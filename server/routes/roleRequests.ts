import { randomUUID } from "crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import { getClient, query } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireMasterAdmin } from "../middleware/roleMiddleware.js";

type RequestRole = "co_admin" | "admin";
type RequestStatus = "pending" | "approved" | "rejected";

const normalizeCountries = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .map((v) => String(v || "").trim())
    .filter((v) => v.length > 0);
  return [...new Set(cleaned)];
};

const validRequestedRole = (role: unknown): role is RequestRole => {
  return role === "co_admin" || role === "admin";
};

const isMasterAdmin = (role: string | undefined): boolean => role === "master_admin";

export const roleRequestsRouter = Router();

roleRequestsRouter.post(
  "/api/role-requests",
  authenticateToken,
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const requestedRole = req.body?.requestedRole;
    if (!validRequestedRole(requestedRole)) {
      return res.status(400).json({ error: "requestedRole must be co_admin or admin" });
    }

    if (isMasterAdmin(req.user.role)) {
      return res.status(400).json({ error: "Master admin does not need role requests" });
    }

    const countries = normalizeCountries(req.body?.countries);
    if (requestedRole === "co_admin" && countries.length === 0) {
      return res.status(400).json({ error: "At least one country is required for co-admin requests" });
    }

    try {
      const duplicate = await query(
        `SELECT id
         FROM role_upgrade_requests
         WHERE user_id = $1
           AND status = 'pending'
           AND requested_role = $2
         LIMIT 1`,
        [req.user.id, requestedRole]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ error: "You already have a pending request for this role" });
      }

      const created = await query(
        `INSERT INTO role_upgrade_requests (
          id, user_id, requested_role, requested_countries, status
        ) VALUES ($1, $2, $3, $4::jsonb, 'pending')
        RETURNING *`,
        [randomUUID(), req.user.id, requestedRole, JSON.stringify(countries)]
      );

      return res.status(201).json(created.rows[0]);
    } catch (err) {
      console.error("Failed to create role request:", err);
      return res.status(500).json({ error: "Failed to create role request" });
    }
  }
);

roleRequestsRouter.get(
  "/api/role-requests/mine",
  authenticateToken,
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const result = await query(
        `SELECT id, requested_role, requested_countries, status, note, requested_at, reviewed_at
         FROM role_upgrade_requests
         WHERE user_id = $1
         ORDER BY requested_at DESC`,
        [req.user.id]
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("Failed to fetch own role requests:", err);
      return res.status(500).json({ error: "Failed to fetch own role requests" });
    }
  }
);

roleRequestsRouter.get(
  "/api/master-admin/role-requests",
  authenticateToken,
  requireMasterAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = await query(
        `SELECT r.*, u.name, u.email
         FROM role_upgrade_requests r
         JOIN users u ON u.id = r.user_id
         WHERE r.status = 'pending'
         ORDER BY r.requested_at ASC`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("Failed to fetch pending role requests:", err);
      return res.status(500).json({ error: "Failed to fetch pending role requests" });
    }
  }
);

const applyRequestDecision = async (
  req: Request,
  res: Response,
  status: RequestStatus
): Promise<Response> => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const requestId = String(req.params.id || "").trim();
  if (!requestId) {
    return res.status(400).json({ error: "Request id is required" });
  }

  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const requestResult = await client.query(
      `SELECT id, user_id, requested_role, requested_countries, status
       FROM role_upgrade_requests
       WHERE id = $1
       FOR UPDATE`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Role request not found" });
    }

    const roleRequest = requestResult.rows[0];
    if (roleRequest.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Request is already processed" });
    }

    if (status === "approved") {
      if (roleRequest.requested_role === "admin") {
        await client.query(
          `UPDATE users
           SET role = 'admin', is_admin = TRUE
           WHERE id = $1`,
          [roleRequest.user_id]
        );
      } else {
        const countries = normalizeCountries(roleRequest.requested_countries || []);
        if (countries.length === 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Co-admin request has no countries attached" });
        }

        await client.query(
          `UPDATE users
           SET role = 'co_admin', is_admin = FALSE
           WHERE id = $1`,
          [roleRequest.user_id]
        );
        await client.query(`DELETE FROM co_admin_scopes WHERE user_id = $1`, [roleRequest.user_id]);
        for (const country of countries) {
          await client.query(
            `INSERT INTO co_admin_scopes (id, user_id, country)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, country) DO NOTHING`,
            [randomUUID(), roleRequest.user_id, country]
          );
        }
      }
    }

    await client.query(
      `UPDATE role_upgrade_requests
       SET status = $1, note = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [status, note || null, req.user.id, requestId]
    );

    await client.query("COMMIT");
    return res.json({ success: true, requestId, status });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors.
    }
    console.error("Failed to process role request:", err);
    return res.status(500).json({ error: "Failed to process role request" });
  } finally {
    client.release();
  }
};

roleRequestsRouter.put(
  "/api/master-admin/role-requests/:id/approve",
  authenticateToken,
  requireMasterAdmin,
  async (req, res) => applyRequestDecision(req, res, "approved")
);

roleRequestsRouter.put(
  "/api/master-admin/role-requests/:id/reject",
  authenticateToken,
  requireMasterAdmin,
  async (req, res) => applyRequestDecision(req, res, "rejected")
);

roleRequestsRouter.post(
  "/api/master-admin/transfer",
  authenticateToken,
  requireMasterAdmin,
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const newMasterUserId = String(req.body?.newMasterUserId || "").trim();
    if (!newMasterUserId) {
      return res.status(400).json({ error: "newMasterUserId is required" });
    }
    if (newMasterUserId === req.user.id) {
      return res.status(400).json({ error: "You are already the master admin" });
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");

      const cooldownResult = await client.query(
        `SELECT transferred_at
         FROM master_admin_transfers
         WHERE from_user_id = $1
         ORDER BY transferred_at DESC
         LIMIT 1`,
        [req.user.id]
      );

      if (cooldownResult.rows.length > 0) {
        const last = new Date(cooldownResult.rows[0].transferred_at).getTime();
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (now - last < sevenDaysMs) {
          await client.query("ROLLBACK");
          const availableAt = new Date(last + sevenDaysMs);
          return res.status(429).json({
            error: "Master role can only be transferred once every 7 days",
            next_transfer_at: availableAt.toISOString()
          });
        }
      }

      const targetUser = await client.query(
        `SELECT id, role
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [newMasterUserId]
      );
      if (targetUser.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Target user not found" });
      }

      await client.query(
        `UPDATE users
         SET role = 'admin', is_admin = TRUE
         WHERE id = $1`,
        [req.user.id]
      );

      await client.query(
        `UPDATE users
         SET role = 'master_admin', is_admin = TRUE
         WHERE id = $1`,
        [newMasterUserId]
      );

      await client.query(
        `INSERT INTO master_admin_transfers (id, from_user_id, to_user_id)
         VALUES ($1, $2, $3)`,
        [randomUUID(), req.user.id, newMasterUserId]
      );

      await client.query("COMMIT");
      return res.json({ success: true, newMasterUserId });
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback errors.
      }
      console.error("Failed to transfer master admin role:", err);
      return res.status(500).json({ error: "Failed to transfer master admin role" });
    } finally {
      client.release();
    }
  }
);

export const initRoleRequestSchema = async (): Promise<void> => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS role_upgrade_requests (
        id UUID PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requested_role TEXT NOT NULL,
        requested_countries JSONB DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'pending',
        note TEXT,
        reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        requested_at TIMESTAMPTZ DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ
      );`
    );
    await query(`CREATE INDEX IF NOT EXISTS idx_role_upgrade_requests_user_id ON role_upgrade_requests(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_role_upgrade_requests_status ON role_upgrade_requests(status);`);

    await query(
      `CREATE TABLE IF NOT EXISTS master_admin_transfers (
        id UUID PRIMARY KEY,
        from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transferred_at TIMESTAMPTZ DEFAULT NOW()
      );`
    );
    await query(`CREATE INDEX IF NOT EXISTS idx_master_admin_transfers_from ON master_admin_transfers(from_user_id, transferred_at DESC);`);

    await query(
      `UPDATE users
       SET role = 'master_admin', is_admin = TRUE
       WHERE id = (
         SELECT id
         FROM users
         WHERE role = 'master_admin'
         ORDER BY joined_date ASC NULLS LAST, id ASC
         LIMIT 1
       );`
    );

    const hasMaster = await query(`SELECT 1 FROM users WHERE role = 'master_admin' LIMIT 1`);
    if (hasMaster.rows.length === 0) {
      await query(
        `UPDATE users
         SET role = 'master_admin', is_admin = TRUE
         WHERE id = (
           SELECT id
           FROM users
           WHERE role = 'admin' OR is_admin IS TRUE
           ORDER BY joined_date ASC NULLS LAST, id ASC
           LIMIT 1
         );`
      );
    }
  } catch (err) {
    console.error("Failed to initialize role request schema:", err);
  }
};
