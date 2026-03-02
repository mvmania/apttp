
import bcrypt from "bcrypt";
import { createHash, randomBytes, randomUUID } from "crypto";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "./utils/jwt.js";
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getClient, query } from './db.js';
import { isStrongPassword } from "./utils/validatePassword.js";
import { securityConfig } from "./config/security.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import { requireAdmin, requireVerifiedUser } from "./middleware/roleMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());

const globalLimiter = rateLimit({
    windowMs: securityConfig.rateLimit.windowMs,
    max: securityConfig.rateLimit.max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

const authLimiterBase = {
    windowMs: securityConfig.rateLimit.authWindowMs,
    standardHeaders: "draft-8" as const,
    legacyHeaders: false,
};

const loginLimiter = rateLimit({ ...authLimiterBase, max: securityConfig.rateLimit.loginMax });
const registerLimiter = rateLimit({ ...authLimiterBase, max: securityConfig.rateLimit.registerMax });
const refreshLimiter = rateLimit({ ...authLimiterBase, max: securityConfig.rateLimit.refreshMax });
const verifyEmailLimiter = rateLimit({ ...authLimiterBase, max: 20 });

app.use("/api", globalLimiter);

// Helper to map DB users to frontend format
const mapUser = (u: any) => ({
    ...u,
    isAdmin: u.is_admin,
    joinedDate: Number(u.joined_date)
});

const parseCookieHeader = (cookieHeader?: string): Record<string, string> => {
    if (!cookieHeader) return {};
    return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
        const [rawKey, ...rest] = part.trim().split("=");
        if (!rawKey) return acc;
        acc[rawKey] = decodeURIComponent(rest.join("=") || "");
        return acc;
    }, {});
};

const hashToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const turnstileEnabled = (process.env.TURNSTILE_ENABLED || "false").toLowerCase() === "true";
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY || "";

interface TurnstileVerificationResult {
    success: boolean;
    action?: string;
    "error-codes"?: string[];
}

const getTurnstileTokenFromRequest = (req: Request): string => {
    const body = req.body || {};
    const fromBody =
        body.turnstileToken ||
        body["cf-turnstile-response"] ||
        body.captchaToken;
    const fromHeader =
        req.header("cf-turnstile-response") ||
        req.header("x-turnstile-token");
    return String(fromBody || fromHeader || "").trim();
};

const verifyTurnstileToken = async (token: string, remoteIp?: string): Promise<TurnstileVerificationResult> => {
    const body = new URLSearchParams({
        secret: turnstileSecretKey,
        response: token
    });
    if (remoteIp) {
        body.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    if (!response.ok) {
        throw new Error(`Turnstile verify request failed with status ${response.status}`);
    }

    return (await response.json()) as TurnstileVerificationResult;
};

const requireTurnstile = (expectedAction?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!turnstileEnabled) {
            return next();
        }

        if (!turnstileSecretKey) {
            return res.status(503).json({ error: "Captcha is enabled but TURNSTILE_SECRET_KEY is not configured" });
        }

        const token = getTurnstileTokenFromRequest(req);
        if (!token) {
            return res.status(400).json({ error: "Captcha token is required" });
        }

        try {
            const result = await verifyTurnstileToken(token, req.ip);
            if (!result.success) {
                return res.status(403).json({
                    error: "Captcha verification failed",
                    details: result["error-codes"] || []
                });
            }

            if (expectedAction && result.action && result.action !== expectedAction) {
                return res.status(403).json({ error: "Captcha action mismatch" });
            }

            return next();
        } catch (error) {
            console.error("Turnstile verification error:", error);
            return res.status(502).json({ error: "Captcha verification service unavailable" });
        }
    };
};

const EMAIL_VERIFICATION_TTL_MINUTES = 15;

const buildEmailVerificationUrl = (token: string): string => {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || `http://localhost:${PORT}`;
    const normalizedBaseUrl = backendBaseUrl.replace(/\/+$/, "");
    return `${normalizedBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
};

const getSmtpConfig = () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
        throw new Error("SMTP_USER and SMTP_PASS must be configured for email verification.");
    }

    return {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: (process.env.SMTP_SECURE || "false").toLowerCase() === "true",
        user: smtpUser,
        pass: smtpPass,
        from: process.env.SMTP_FROM || smtpUser
    };
};

const sendVerificationEmail = async (email: string, name: string, verificationUrl: string): Promise<void> => {
    const smtp = getSmtpConfig();
    const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
            user: smtp.user,
            pass: smtp.pass
        }
    });

    await transporter.sendMail({
        from: smtp.from,
        to: email,
        subject: "Verify your email address",
        text: `Hi ${name},\n\nPlease verify your email by clicking this link:\n${verificationUrl}\n\nThis link expires in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.\n`,
        html: `
            <p>Hi ${name},</p>
            <p>Please verify your email by clicking the link below:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link expires in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.</p>
        `
    });
};

const parseExpiryToMs = (expiry: string | number | undefined): number => {
    if (typeof expiry === "number") return expiry * 1000;
    if (typeof expiry === "string") {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (match) {
            const value = Number(match[1]);
            const unit = match[2];
            if (unit === "s") return value * 1000;
            if (unit === "m") return value * 60 * 1000;
            if (unit === "h") return value * 60 * 60 * 1000;
            if (unit === "d") return value * 24 * 60 * 60 * 1000;
        }
    }
    return 7 * 24 * 60 * 60 * 1000;
};

const refreshTokenTtlMs = parseExpiryToMs(securityConfig.jwt.refreshExpiry);

const setRefreshCookie = (res: Response, refreshToken: string): void => {
    const maxAge = Math.max(refreshTokenTtlMs, 60_000);
    const cookieParts = [
        `${securityConfig.cookies.refreshTokenName}=${encodeURIComponent(refreshToken)}`,
        "HttpOnly",
        `Path=${securityConfig.cookies.path}`,
        `SameSite=${securityConfig.cookies.sameSite}`,
        `Max-Age=${Math.floor(maxAge / 1000)}`,
    ];

    if (securityConfig.cookies.secure) {
        cookieParts.push("Secure");
    }
    if (securityConfig.cookies.domain) {
        cookieParts.push(`Domain=${securityConfig.cookies.domain}`);
    }

    res.setHeader("Set-Cookie", cookieParts.join("; "));
};

const clearRefreshCookie = (res: Response): void => {
    const cookieParts = [
        `${securityConfig.cookies.refreshTokenName}=`,
        "HttpOnly",
        `Path=${securityConfig.cookies.path}`,
        `SameSite=${securityConfig.cookies.sameSite}`,
        "Max-Age=0",
    ];
    if (securityConfig.cookies.secure) {
        cookieParts.push("Secure");
    }
    if (securityConfig.cookies.domain) {
        cookieParts.push(`Domain=${securityConfig.cookies.domain}`);
    }
    res.append("Set-Cookie", cookieParts.join("; "));
};

const getRefreshTokenFromRequest = (req: Request): string | null => {
    const cookies = parseCookieHeader(req.headers.cookie);
    const token = cookies[securityConfig.cookies.refreshTokenName];
    if (!token) return null;
    return token;
};

const storeRefreshSession = async (
    userId: string,
    jti: string,
    refreshToken: string,
    req: Request,
    replacedByJti: string | null = null
): Promise<void> => {
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshTokenTtlMs);
    await query(
        `INSERT INTO user_sessions (id, user_id, jti, token_hash, ip_address, user_agent, expires_at, replaced_by_jti)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            `sess_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            userId,
            jti,
            tokenHash,
            req.ip ?? null,
            req.get("user-agent") ?? null,
            expiresAt,
            replacedByJti,
        ]
    );
};

// GET all data
app.get('/api/data', async (req: Request, res: Response) => {
    try {
        const stakeholders = await query('SELECT * FROM stakeholders');
        const users = await query('SELECT * FROM users');
        const technologies = await query('SELECT * FROM technologies');
        const tech_needs = await query('SELECT * FROM tech_needs');
        const opportunities = await query('SELECT * FROM opportunities');

        res.json({
            stakeholders: stakeholders.rows,
            users: users.rows.map(mapUser),
            technologies: technologies.rows.map(t => ({ ...t, imageUrl: t.image_url })),
            tech_needs: tech_needs.rows.map(n => ({ ...n, createdAt: Number(n.created_at) })),
            opportunities: opportunities.rows.map(o => ({ ...o, imageUrl: o.image_url }))
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// GET stakeholders
app.get('/api/stakeholders', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM stakeholders');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stakeholders' });
    }
});

// GET technologies
app.get('/api/technologies', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM technologies');
        res.json(result.rows.map(t => ({ ...t, imageUrl: t.image_url })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch technologies' });
    }
});

// POST technology
app.post('/api/technologies', authenticateToken, requireVerifiedUser, requireTurnstile("technology_submit"), async (req: Request, res: Response) => {
    try {
        const t = req.body;
        const id = `t${Date.now()}`;
        await query(`
            INSERT INTO technologies (
                id, name, stakeholder_id, tech_category_id, tech_sub_category_id, 
                description, ip_status, patent_number, ip_owner, 
                licensing_availability, geographic_restrictions, 
                disclosure_level, trl_level, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
            id, t.name, t.stakeholder_id, t.tech_category_id, t.tech_sub_category_id,
            t.description, t.ip_status, t.patent_number, t.ip_owner,
            t.licensing_availability, t.geographic_restrictions,
            t.disclosure_level, t.trl_level, t.imageUrl
        ]);
        res.status(201).json({ ...t, id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create technology' });
    }
});

// GET tech needs
app.get('/api/tech-needs', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM tech_needs');
        res.json(result.rows.map(n => ({ ...n, createdAt: Number(n.created_at) })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tech needs' });
    }
});

// POST tech need
app.post('/api/tech-needs', authenticateToken, requireVerifiedUser, requireTurnstile("tech_need_submit"), async (req: Request, res: Response) => {
    try {
        const n = req.body;
        const id = `n${Date.now()}`;
        const createdAt = Date.now();
        await query(`
            INSERT INTO tech_needs (
                id, seeker_id, title, description, industry, 
                budget_range, deadline, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            id, n.seeker_id, n.title, n.description, n.industry,
            n.budget_range, n.deadline, n.status || 'open', createdAt
        ]);
        res.status(201).json({ ...n, id, createdAt });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create tech need' });
    }
});

// GET opportunities
app.get('/api/opportunities', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM opportunities');
        res.json(result.rows.map(o => ({ ...o, imageUrl: o.image_url })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});

// POST opportunity
app.post('/api/opportunities', authenticateToken, requireVerifiedUser, requireTurnstile("opportunity_submit"), async (req: Request, res: Response) => {
    try {
        const o = req.body;
        const id = `o${Date.now()}`;
        await query(`
            INSERT INTO opportunities (
                id, provider_id, title, subtitle, date, 
                description, type, image_url, link
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            id, o.provider_id, o.title, o.subtitle, o.date,
            o.description, o.type, o.imageUrl, o.link
        ]);
        res.status(201).json({ ...o, id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create opportunity' });
    }
});

// GET users
app.get('/api/users', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM users');
        res.json(result.rows.map(mapUser));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});


 //api/login route with this
app.post("/api/login", loginLimiter, requireTurnstile("login"), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role ?? (user.is_admin ? "admin" : "user"),
      is_email_verified: Boolean(user.is_email_verified),
      is_admin: Boolean(user.is_admin),
    });

    const refreshTokenJti = randomUUID();
    const refreshToken = generateRefreshToken(user.id, refreshTokenJti);
    await storeRefreshSession(user.id, refreshTokenJti, refreshToken, req);
    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        scenario: user.scenario,
        stakeholder_id: user.stakeholder_id || undefined,
        is_verified: Boolean(user.is_verified),
        role: user.role ?? (user.is_admin ? "admin" : "user"),
        is_email_verified: Boolean(user.is_email_verified),
        is_id_verified: Boolean(user.is_id_verified),
        verification_status: user.verification_status || "None",
        is_admin: Boolean(user.is_admin),
        isAdmin: Boolean(user.is_admin),
        joinedDate: Number(user.joined_date || Date.now()),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});


// POST refresh token
app.post("/api/refresh-token", refreshLimiter, async (req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const tokenHash = hashToken(refreshToken);

        const sessionResult = await query(
            `SELECT id, token_hash
             FROM user_sessions
             WHERE user_id = $1
               AND jti = $2
               AND revoked_at IS NULL
               AND expires_at > NOW()
             LIMIT 1`,
            [decoded.id, decoded.jti]
        );

        if (sessionResult.rows.length === 0) {
            clearRefreshCookie(res);
            return res.status(403).json({ error: "Invalid refresh session" });
        }

        const session = sessionResult.rows[0];
        if (session.token_hash !== tokenHash) {
            await query(
                "UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL",
                [session.id]
            );
            clearRefreshCookie(res);
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        const result = await query(
            "SELECT id, email, name, role, is_email_verified, is_admin FROM users WHERE id = $1",
            [decoded.id]
        );

        if (result.rows.length === 0) {
            clearRefreshCookie(res);
            return res.status(401).json({ error: "User not found" });
        }

        const user = result.rows[0];
        const newRefreshJti = randomUUID();
        const newRefreshToken = generateRefreshToken(user.id, newRefreshJti);

        await query(
            "UPDATE user_sessions SET revoked_at = NOW(), replaced_by_jti = $1 WHERE id = $2 AND revoked_at IS NULL",
            [newRefreshJti, session.id]
        );
        await storeRefreshSession(user.id, newRefreshJti, newRefreshToken, req, decoded.jti);
        setRefreshCookie(res, newRefreshToken);

        const newAccessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role ?? (user.is_admin ? "admin" : "user"),
            is_email_verified: Boolean(user.is_email_verified),
            is_admin: Boolean(user.is_admin),
        });

        return res.json({ accessToken: newAccessToken });
    } catch {
        clearRefreshCookie(res);
        return res.status(403).json({ error: "Invalid or expired refresh token" });
    }
});

app.post("/api/logout", async (req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    clearRefreshCookie(res);

    if (!refreshToken) {
        return res.json({ success: true });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        await query(
            `UPDATE user_sessions
             SET revoked_at = NOW()
             WHERE user_id = $1
               AND jti = $2
               AND revoked_at IS NULL`,
            [decoded.id, decoded.jti]
        );
    } catch {
        // Always return success to keep logout idempotent.
    }

    return res.json({ success: true });
});


// POST register

app.post('/api/register', registerLimiter, requireTurnstile("register"), async (req: Request, res: Response) => {
    const { name, email, password, scenario, orgName, orgCategory, orgWebsite, country } = req.body;
    if (!isStrongPassword(password)) {
    return res.status(400).json({
        error: "Password must be minimum 8 characters and include uppercase, lowercase, number and special character."
    });
    }

     const hashedPassword = await bcrypt.hash(password, 12);
    const client = await getClient();
    try {
        await client.query("BEGIN");

        const check = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: 'User already exists' });
        }

        let stakeholder_id = '';
        if ((scenario === 'Organization Representative' || scenario === 'Official Representative') && orgName) {
            stakeholder_id = `s${Date.now()}`;
            await client.query(`
                INSERT INTO stakeholders (
                    stakeholder_id, name, category, website, description, is_verified, roles
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                stakeholder_id, orgName, orgCategory, orgWebsite,
                `Registered via platform by ${name}`, false, JSON.stringify(['Provider'])
            ]);
        }

        const id = `u${Date.now()}`;
        const joinedDate = Date.now();
        await client.query(`
            INSERT INTO users (
                id, name, email, password, scenario, stakeholder_id, 
                is_verified, is_email_verified, is_id_verified, 
                verification_status, is_admin, joined_date, country
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
            id, name, email, hashedPassword, scenario, stakeholder_id,
            false, false, false, 'None', false, joinedDate, country || null
        ]);

        const rawVerificationToken = randomBytes(32).toString("hex");
        const verificationTokenHash = hashToken(rawVerificationToken);
        const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

        await client.query(
            `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [randomUUID(), id, verificationTokenHash, expiresAt]
        );

        const verificationUrl = buildEmailVerificationUrl(rawVerificationToken);
        await sendVerificationEmail(email, name, verificationUrl);
        await client.query("COMMIT");

        res.status(201).json({
            id,
            name,
            email,
            scenario,
            stakeholder_id,
            joinedDate,
            verification_required: true,
            message: "Registration successful. Please verify your email within 15 minutes."
        });
    } catch (err) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // Ignore rollback errors to preserve the original failure context.
        }
        console.error("Registration failed:", err);
        const message = err instanceof Error ? err.message : 'Registration failed';
        res.status(500).json({
            error: process.env.NODE_ENV === 'development' ? message : 'Registration failed'
        });
    } finally {
        client.release();
    }
});

app.get('/api/auth/verify-email', verifyEmailLimiter, async (req: Request, res: Response) => {
    const token = String(req.query.token || "").trim();
    if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
    }

    const tokenHash = hashToken(token);
    const client = await getClient();
    try {
        await client.query("BEGIN");

        const tokenResult = await client.query(
            `SELECT id, user_id
             FROM email_verification_tokens
             WHERE token_hash = $1
               AND used_at IS NULL
               AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1
             FOR UPDATE`,
            [tokenHash]
        );

        if (tokenResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Invalid or expired verification token" });
        }

        const tokenRow = tokenResult.rows[0];
        await client.query(
            `UPDATE email_verification_tokens
             SET used_at = NOW()
             WHERE id = $1`,
            [tokenRow.id]
        );

        await client.query(
            `UPDATE users
             SET is_email_verified = TRUE
             WHERE id = $1`,
            [tokenRow.user_id]
        );

        await client.query("COMMIT");
        return res.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // Ignore rollback errors to preserve the original failure context.
        }
        console.error("Email verification failed:", err);
        return res.status(500).json({ error: "Email verification failed" });
    } finally {
        client.release();
    }
});

// PUT user
app.put('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    try {
        // Simple dynamic update for demo purposes
        const keys = Object.keys(body).filter(k => k !== 'isAdmin' && k !== 'joinedDate');
        const setClause = keys.map((k, i) => `${k === 'name' ? 'name' : k} = $${i + 2}`).join(', ');
        const values = keys.map(k => body[k]);

        // Handle mapped fields
        let mappedUpdate = '';
           if (body.isAdmin !== undefined) {
         mappedUpdate += `, is_admin = $${values.length + 2}`;
        values.push(body.isAdmin);
}

        await query(`UPDATE users SET ${setClause} ${mappedUpdate} WHERE id = $1`, [id, ...values]);
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// DELETE user
app.delete('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});
//

// GET stats
app.get('/api/stats', async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT 
                (SELECT COUNT(*) FROM technologies) as innovations,
                (SELECT COUNT(*) FROM stakeholders) as stakeholders,
                (SELECT COUNT(*) FROM chat_rooms) as connected,
                (
                    SELECT COUNT(DISTINCT country) 
                    FROM (
                        SELECT country FROM users WHERE country IS NOT NULL
                        UNION 
                        SELECT country FROM stakeholders WHERE country IS NOT NULL
                    ) as c
                ) as countries
        `);

        const stats = result.rows[0];
        res.json({
            innovations: parseInt(stats.innovations || '0'),
            stakeholders: parseInt(stats.stakeholders || '0'),
            connected: parseInt(stats.connected || '0'),
            countries: parseInt(stats.countries || '0')
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// POST import technology
app.post('/api/technologies/import', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const { tech, stakeholder } = req.body;
    try {
        // 1. Ensure Stakeholder exists
        await query(`
            INSERT INTO stakeholders (stakeholder_id, name, category, website, contact_email, is_verified, roles)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (stakeholder_id) DO UPDATE SET 
                name = EXCLUDED.name,
                website = COALESCE(NULLIF(EXCLUDED.website, ''), stakeholders.website),
                contact_email = COALESCE(NULLIF(EXCLUDED.contact_email, ''), stakeholders.contact_email)
        `, [
            stakeholder.stakeholder_id, stakeholder.name, stakeholder.category,
            stakeholder.website || '', stakeholder.contact_email, true, JSON.stringify(['Provider'])
        ]);

        // 2. Insert Technology
        await query(`
            INSERT INTO technologies (id, name, stakeholder_id, tech_category_id, description, ip_status, patent_number, trl_level, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET 
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              trl_level = EXCLUDED.trl_level,
              patent_number = EXCLUDED.patent_number,
              ip_status = EXCLUDED.ip_status,
              image_url = EXCLUDED.image_url
        `, [
            tech.id, tech.name, tech.stakeholder_id, tech.tech_category_id,
            tech.description, tech.ip_status, tech.patent_number, tech.trl_level, tech.image_url
        ]);

        res.json({ success: true, id: tech.id });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// GET all technology IDs
app.get('/api/technologies/ids', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT id FROM technologies');
        res.json(result.rows.map(r => r.id));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch IDs' });
    }
});

// PUT stakeholder
app.put('/api/stakeholders/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    try {
        const keys = Object.keys(body).filter(k => !Array.isArray(body[k]) && typeof body[k] !== 'object');
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = keys.map(k => body[k]);

        let jsonUpdates = '';
        if (body.key_tech_areas) {
  jsonUpdates += `, key_tech_areas = $${values.length + 2}`;
  values.push(JSON.stringify(body.key_tech_areas));
}

if (body.roles) {
  jsonUpdates += `, roles = $${values.length + 2}`;
  values.push(JSON.stringify(body.roles));
}

        await query(`UPDATE stakeholders SET ${setClause} ${jsonUpdates} WHERE stakeholder_id = $1`, [id, ...values]);
        res.json({ message: 'Stakeholder updated' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// GET site content
app.get('/api/content', async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store'); // Prevent caching
    try {
        const result = await query('SELECT * FROM site_content');
        const contentMap: Record<string, string> = {};
        result.rows.forEach((row: any) => {
            contentMap[row.key] = row.content;
        });
        res.json(contentMap);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// GET all content details (for admin)
app.get('/api/admin/content', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
        const result = await query('SELECT * FROM site_content ORDER BY key');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch content details' });
    }
});

// PUT update content
app.put('/api/content/:key', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const { key } = req.params;
    const { content } = req.body;
    console.log(`📝 Updating content [${key}]: ${content.substring(0, 20)}...`);
    try {
        const result = await query('UPDATE site_content SET content = $1, last_updated = NOW() WHERE key = $2', [content, key]);
        if (result.rowCount === 0) {
            console.warn(`⚠️ Content update failed: Key [${key}] not found.`);
            return res.status(404).json({ error: 'Content key not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Content update error:', err);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

// GET search
app.get('/api/search', async (req: Request, res: Response) => {
    const q = (req.query.q as string || '').toLowerCase();
    try {
        const techs = await query("SELECT * FROM technologies WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1", [`%${q}%`]);
        const stakeholders = await query("SELECT * FROM stakeholders WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1", [`%${q}%`]);
        res.json([...techs.rows, ...stakeholders.rows]);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Basic health check
app.get('/health', (req: Request, res: Response) => {
    res.send('Backend is running');
});

// Detailed DB health check (For debugging Render connection)
app.get('/api/health/db', async (req: Request, res: Response) => {
    try {
        const start = Date.now();
        const result = await query('SELECT count(*) FROM technologies');
        const duration = Date.now() - start;
        res.json({
            status: 'ok',
            message: 'Database Connected Successfully',
            count: result.rows[0].count,
            duration_ms: duration,
            database_url_masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@') : 'Not Set'
        });
    } catch (err: any) {
        console.error('DB Connection Check Failed:', err);
        res.status(500).json({
            status: 'error',
            message: 'Database Connection Failed',
            error_code: err.code,
            error_details: err.message,
            error_hostname: err.hostname || 'N/A', // Critical for identifying old internal Render DB
            database_url_masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@') : 'Not Set'
        });
    }
});
// Testing the authentication and role-based access control middleware


app.get(
  "/api/test-auth",
  authenticateToken,
  (req, res) => {
    return res.json({
      message: "Access granted",
      user: req.user,
    });
  }
);

app.get(
  "/api/test-admin",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    return res.json({
      message: "Admin access granted",
    });
  }
);

// Serve static files from the dist directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Final catch-all middleware for SPA routing
// This replaces the problematic app.get wildcard route for Express 5 compatibility
app.use((req: Request, res: Response) => {
    // If it's an API request that reached here, it's a 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    // Otherwise, serve the frontend index.html for SPA routing
    res.sendFile(path.join(distPath, 'index.html'));
});

// Auto-migration for site content
const initContent = async () => {
    try {
        console.log('Initializing site content...');
        await query(`
            CREATE TABLE IF NOT EXISTS site_content (
                key VARCHAR(255) PRIMARY KEY,
                content TEXT,
                description TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const initialData = [
            {
                key: 'home_hero_title',
                description: 'Main title on the landing page hero section',
                content: 'Accelerating <span class="text-apctt-blue italic">Innovation</span> across Asia-Pacific.'
            },
            {
                key: 'home_hero_subtitle',
                description: 'Subtitle text on the landing page hero section',
                content: 'The official APCTT platform connecting technology providers, seekers, and investors. Bridging the gap between groundbreaking innovation and regional development.'
            },
            {
                key: 'footer_developed_by',
                description: 'Partnership text in the footer',
                content: 'Developed in strategic partnership with <span class="text-slate-500 font-bold">RH ISTC</span>.'
            },
            {
                key: 'about_rh_istc_desc',
                description: 'Description of RH ISTC on the About page',
                content: 'The RH ISTC is a premier institution dedicated to fostering international scientific collaboration and technology transfer. Partnering with APCTT, the RH ISTC plays a pivotal role in connecting Russian technologies and scientific expertise with the Asia-Pacific region, driving innovation and sustainable development through cross-border cooperation.'
            },
            // Landing Stats
            { key: 'landing_stats_innovations_label', description: 'Label for Innovations stat', content: 'Innovations' },
            { key: 'landing_stats_innovations_value', description: 'Value for Innovations stat', content: '1,200+' },
            { key: 'landing_stats_countries_label', description: 'Label for Countries stat', content: 'Countries' },
            { key: 'landing_stats_countries_value', description: 'Value for Countries stat', content: '45+' },
            { key: 'landing_stats_partners_label', description: 'Label for Partners stat', content: 'Partners' },
            { key: 'landing_stats_partners_value', description: 'Value for Partners stat', content: '800+' },
            { key: 'landing_stats_transfers_label', description: 'Label for Transfers stat', content: 'Transfers' },
            { key: 'landing_stats_transfers_value', description: 'Value for Transfers stat', content: '150+' },
            // Landing Sections
            { key: 'landing_recent_tech_title', description: 'Title for Recent Technologies section', content: 'Recently Added Technologies' },
            { key: 'landing_recent_tech_subtitle', description: 'Subtitle for Recent Technologies section', content: 'The latest technical assets ready for licensing and collaboration.' },
            { key: 'landing_updates_title', description: 'Title for Updates section', content: 'Latest Network <br /> Updates' },
            { key: 'landing_updates_subtitle', description: 'Subtitle for Updates section', content: 'Stay informed about regional forums, site tours, and technical support programs organized by our members.' },
            { key: 'landing_featured_stakeholders_title', description: 'Title for Featured Stakeholders section', content: 'Our Verified Network' },
            { key: 'landing_featured_stakeholders_subtitle', description: 'Subtitle for Featured Stakeholders section', content: 'Leading organizations driving regional technology transfer.' },
            { key: 'landing_cta_title', description: 'Title for CTA section', content: 'Ready to expand your technical reach?' },
            { key: 'landing_cta_subtitle', description: 'Subtitle for CTA section', content: 'Join hundreds of organizations across the Asia-Pacific. Register your technology or post your technical needs today.' },
            // About Page
            { key: 'about_title', description: 'Main title on About page', content: 'About the Platform' },
            { key: 'about_subtitle', description: 'Subtitle on About page', content: 'Bridging the gap between innovation and implementation across the Asia-Pacific region.' },
            { key: 'about_apctt_title', description: 'Title for APCTT section', content: 'Asia-Pacific Centre for Transfer of Technologies (APCTT)' },
            { key: 'about_apctt_desc', description: 'Description for APCTT section', content: 'APCTT is a regional institution of the United Nations Economic and Social Commission for Asia and the Pacific (ESCAP) servicing the Asia-Pacific region. Our focus is on institutional capacity-building for the management of the innovation chain, including technology transfer and adoption of new technologies.' },
            { key: 'about_mission_title', description: 'Title for Mission block', content: 'Our Mission' },
            { key: 'about_mission_desc', description: 'Description for Mission block', content: 'To facilitate technology transfer and partnership building for sustainable development in Asia and the Pacific.' },
            { key: 'about_connect_title', description: 'Title for Connect block', content: 'Connect Stakeholders' },
            { key: 'about_connect_desc', description: 'Description for Connect block', content: 'We bring together technology providers, seekers, and investors under one digital roof.' },
            { key: 'about_drive_title', description: 'Title for Drive Innovation block', content: 'Drive Innovation' },
            { key: 'about_drive_desc', description: 'Description for Drive Innovation block', content: 'Empowering regional economies through smart matchmaking and knowledge dissemination.' },
            // Footer
            { key: 'footer_copyright', description: 'Copyright text in footer', content: '© 2024 Asia-Pacific Centre for Transfer of Technologies.' }
        ];

        for (const item of initialData) {
            await query(`
                INSERT INTO site_content (key, content, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO NOTHING
            `, [item.key, item.content, item.description]);
        }
        console.log('Site content initialized.');
    } catch (err) {
        console.error('Failed to initialize site content:', err);
    }
};

// POST chat room (for stats tracking)
app.post('/api/chat-rooms', async (req: Request, res: Response) => {
    const { id, created_at } = req.body;
    try {
        await query(`
            INSERT INTO chat_rooms (id, created_at)
            VALUES ($1, $2)
            ON CONFLICT (id) DO NOTHING
        `, [id, created_at || Date.now()]);
        res.json({ success: true });
    } catch (err) {
        // Log but don't fail the request significantly as this is mainly for stats
        console.error('Failed to record chat room:', err);
        res.status(500).json({ error: 'Failed to record chat' });
    }
});

// Auto-migration for stats support
const initStatsSchema = async () => {
    try {
        console.log('Initializing stats schema...');

        // 1. Add country to users
        try {
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`);
        } catch (e) { console.log('User country column might exist'); }

        // 2. Add country to stakeholders
        try {
            await query(`ALTER TABLE stakeholders ADD COLUMN IF NOT EXISTS country TEXT`);
        } catch (e) { console.log('Stakeholder country column might exist'); }

        // 3. Create chat_rooms
        await query(`
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id TEXT PRIMARY KEY,
                created_at BIGINT
            );
        `);

        // 4. Backfill (simplified)
        await query(`UPDATE stakeholders SET country = 'India' WHERE legal_address LIKE '%India%' AND country IS NULL`);
        await query(`UPDATE stakeholders SET country = 'Japan' WHERE legal_address LIKE '%Japan%' AND country IS NULL`);
        await query(`UPDATE stakeholders SET country = 'Singapore' WHERE legal_address LIKE '%Singapore%' AND country IS NULL`);
        await query(`UPDATE stakeholders SET country = 'South Korea' WHERE legal_address LIKE '%Korea%' OR legal_address LIKE '%Seoul%' AND country IS NULL`);
        await query(`UPDATE stakeholders SET country = 'Thailand' WHERE legal_address LIKE '%Thailand%' OR legal_address LIKE '%Bangkok%' AND country IS NULL`);

        console.log('Stats schema initialized.');
    } catch (err) {
        console.error('Failed to initialize stats schema:', err);
    }
};

const initAuthSchema = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                jti TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                expires_at TIMESTAMPTZ NOT NULL,
                revoked_at TIMESTAMPTZ,
                replaced_by_jti TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_jti ON user_sessions(jti);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);`);

        await query(`
            CREATE TABLE IF NOT EXISTS email_verification_tokens (
                id UUID PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(64) NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                used_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        await query(`CREATE INDEX IF NOT EXISTS idx_email_verification_token_hash ON email_verification_tokens(token_hash);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON email_verification_tokens(expires_at);`);
    } catch (err) {
        console.error("Failed to initialize auth schema:", err);
    }
};

// Start server
(async () => {
  await initAuthSchema();
  await initStatsSchema();
  await initContent();

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
