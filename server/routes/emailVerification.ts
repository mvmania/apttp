import { createHash, randomBytes, randomUUID } from "crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import { getClient } from "../db.js";
import { securityConfig } from "../config/security.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const PORT = process.env.PORT || 10000;

export const EMAIL_VERIFICATION_TTL_MINUTES = 15;

type EmailProvider = "resend" | "smtp";
type DbClient = Awaited<ReturnType<typeof getClient>>;

const parseEnvBoolean = (value: string | undefined, fallback: boolean): boolean => {
    if (value === undefined) return fallback;
    return value.toLowerCase() === "true";
};

const getEmailProvider = (): EmailProvider => {
    const rawProvider = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();
    if (rawProvider === "resend" || rawProvider === "smtp") {
        return rawProvider;
    }
    return process.env.RESEND_API_KEY ? "resend" : "smtp";
};

const hashToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};

const getResendConfig = () => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || process.env.SMTP_FROM;

    if (!apiKey) {
        throw new Error("RESEND_API_KEY must be configured for Resend email delivery.");
    }
    if (!from) {
        throw new Error("RESEND_FROM must be configured for Resend email delivery.");
    }

    return { apiKey, from };
};

const getSmtpConfig = () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
        throw new Error("SMTP_USER and SMTP_PASS must be configured for SMTP email delivery.");
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

export const buildEmailVerificationUrl = (token: string): string => {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || `http://localhost:${PORT}`;
    const normalizedBaseUrl = backendBaseUrl.replace(/\/+$/, "");
    return `${normalizedBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
};

const sendViaSmtp = async (email: string, name: string, verificationUrl: string): Promise<void> => {
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

const sendViaResend = async (email: string, name: string, verificationUrl: string): Promise<void> => {
    const resend = getResendConfig();
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resend.apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: resend.from,
            to: [email],
            subject: "Verify your email address",
            text: `Hi ${name},\n\nPlease verify your email by clicking this link:\n${verificationUrl}\n\nThis link expires in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.\n`,
            html: `
                <p>Hi ${name},</p>
                <p>Please verify your email by clicking the link below:</p>
                <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                <p>This link expires in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.</p>
            `
        })
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Resend send failed (${response.status}): ${details}`);
    }
};

export const sendVerificationEmail = async (email: string, name: string, verificationUrl: string): Promise<void> => {
    const provider = getEmailProvider();
    const allowSmtpFallback = parseEnvBoolean(process.env.EMAIL_PROVIDER_FALLBACK_TO_SMTP, true);

    if (provider === "smtp") {
        await sendViaSmtp(email, name, verificationUrl);
        return;
    }

    try {
        await sendViaResend(email, name, verificationUrl);
    } catch (resendErr) {
        if (!allowSmtpFallback) {
            throw resendErr;
        }
        console.warn("Resend delivery failed; attempting SMTP fallback.");
        await sendViaSmtp(email, name, verificationUrl);
    }
};

export const createEmailVerificationToken = async (
    client: DbClient,
    userId: string,
    options?: { invalidateExisting?: boolean }
): Promise<string> => {
    const invalidateExisting = Boolean(options?.invalidateExisting);
    const rawVerificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = hashToken(rawVerificationToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

    if (invalidateExisting) {
        await client.query(
            `UPDATE email_verification_tokens
             SET used_at = NOW()
             WHERE user_id = $1
               AND used_at IS NULL`,
            [userId]
        );
    }

    await client.query(
        `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [randomUUID(), userId, verificationTokenHash, expiresAt]
    );

    return rawVerificationToken;
};

export const verifyEmailProviderConnection = async (): Promise<void> => {
    const provider = getEmailProvider();

    if (provider === "resend") {
        try {
            getResendConfig();
            console.log("Resend email provider configured successfully.");
        } catch (err) {
            console.error("Resend configuration invalid. Email delivery will fail until fixed:", err);
        }
        return;
    }

    try {
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
        await transporter.verify();
        console.log("SMTP connection verified successfully.");
    } catch (err) {
        console.error("SMTP verification failed. Email delivery will fail until fixed:", err);
    }
};

const authLimiterBase = {
    windowMs: securityConfig.rateLimit.authWindowMs,
    standardHeaders: "draft-8" as const,
    legacyHeaders: false,
};

const verifyEmailLimiter = rateLimit({ ...authLimiterBase, max: 20 });
const resendVerificationLimiter = rateLimit({ ...authLimiterBase, max: 5 });

export const emailVerificationRouter = Router();

emailVerificationRouter.get('/api/auth/verify-email', verifyEmailLimiter, async (req: Request, res: Response) => {
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

emailVerificationRouter.post('/api/auth/resend-verification', resendVerificationLimiter, authenticateToken, async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.id;
    const client = await getClient();
    try {
        const userResult = await client.query(
            `SELECT id, email, name, is_email_verified
             FROM users
             WHERE id = $1
             LIMIT 1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const dbUser = userResult.rows[0];
        if (Boolean(dbUser.is_email_verified)) {
            return res.status(400).json({ error: "Email is already verified" });
        }

        await client.query("BEGIN");
        const rawVerificationToken = await createEmailVerificationToken(client, userId, { invalidateExisting: true });
        await client.query("COMMIT");

        const verificationUrl = buildEmailVerificationUrl(rawVerificationToken);
        await sendVerificationEmail(dbUser.email, dbUser.name || "User", verificationUrl);

        return res.json({
            success: true,
            message: "Verification email sent.",
            ...(process.env.NODE_ENV === "development" ? { verification_debug_url: verificationUrl } : {})
        });
    } catch (err) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // Ignore rollback errors to preserve original failure context.
        }
        console.error("Resend verification email failed:", err);
        return res.status(500).json({ error: "Failed to send verification email" });
    } finally {
        client.release();
    }
});
