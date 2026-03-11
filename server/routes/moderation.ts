import { randomUUID } from "crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import { getClient, query } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireCoAdminOrAdmin, requireMasterAdmin } from "../middleware/roleMiddleware.js";

type ModerationEntity = "technology" | "stakeholder" | "tech_need";
type ModerationAction = "approve" | "reject";
type ModerationStatus = "pending" | "approved" | "rejected";

const normalizeCountry = (country: string): string => country.trim().toLowerCase();

const sanitizeCountries = (countries: unknown): string[] => {
  if (!Array.isArray(countries)) return [];
  const values = countries
    .map((country) => String(country || "").trim())
    .filter((country) => country.length > 0);
  return [...new Set(values)];
};

const canManageCountry = async (userId: string, country: string): Promise<boolean> => {
  const normalizedCountry = normalizeCountry(country);
  const result = await query(
    `SELECT 1
     FROM co_admin_scopes
     WHERE user_id = $1
       AND LOWER(country) = $2
     LIMIT 1`,
    [userId, normalizedCountry]
  );
  return result.rows.length > 0;
};

const ensureCountryScope = async (
  req: Request,
  res: Response,
  country: string | null
): Promise<boolean> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }

  if (req.user.role === "admin") {
    return true;
  }

  if (req.user.role !== "co_admin") {
    res.status(403).json({ error: "Insufficient permissions" });
    return false;
  }

  if (!country || country.trim().length === 0) {
    res.status(400).json({ error: "Item has no country assigned for scope validation" });
    return false;
  }

  const allowed = await canManageCountry(req.user.id, country);
  if (!allowed) {
    res.status(403).json({ error: "Not authorized for this country" });
    return false;
  }

  return true;
};

const writeApprovalLog = async (
  actorId: string,
  actorRole: string,
  action: ModerationAction,
  entityType: ModerationEntity,
  entityId: string,
  country: string | null,
  note?: string
): Promise<void> => {
  await query(
    `INSERT INTO approval_logs (
      id, actor_id, actor_role, action, entity_type, entity_id, country, note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [randomUUID(), actorId, actorRole, action, entityType, entityId, country, note ?? null]
  );
};

const getEntityCountry = async (
  entityType: ModerationEntity,
  entityId: string
): Promise<string | null> => {
  if (entityType === "technology") {
    const result = await query(
      `SELECT s.country
       FROM technologies t
       LEFT JOIN stakeholders s ON s.stakeholder_id = t.stakeholder_id
       WHERE t.id = $1
       LIMIT 1`,
      [entityId]
    );
    return (result.rows[0]?.country as string | null) ?? null;
  }

  if (entityType === "stakeholder") {
    const result = await query(
      `SELECT country
       FROM stakeholders
       WHERE stakeholder_id = $1
       LIMIT 1`,
      [entityId]
    );
    return (result.rows[0]?.country as string | null) ?? null;
  }

  const result = await query(
    `SELECT u.country
     FROM tech_needs n
     LEFT JOIN users u ON u.id = n.seeker_id
     WHERE n.id = $1
     LIMIT 1`,
    [entityId]
  );
  return (result.rows[0]?.country as string | null) ?? null;
};

const updateEntityStatus = async (
  entityType: ModerationEntity,
  entityId: string,
  status: ModerationStatus
): Promise<boolean> => {
  if (entityType === "technology") {
    const result = await query(
      `UPDATE technologies
       SET approval_status = $1, moderation_updated_at = NOW()
       WHERE id = $2`,
      [status, entityId]
    );
    return (result.rowCount || 0) > 0;
  }

  if (entityType === "stakeholder") {
    const result = await query(
      `UPDATE stakeholders
       SET approval_status = $1, moderation_updated_at = NOW()
       WHERE stakeholder_id = $2`,
      [status, entityId]
    );
    return (result.rowCount || 0) > 0;
  }

  const result = await query(
    `UPDATE tech_needs
     SET approval_status = $1, moderation_updated_at = NOW()
     WHERE id = $2`,
    [status, entityId]
  );
  return (result.rowCount || 0) > 0;
};

const moderateEntity = async (
  req: Request,
  res: Response,
  entityType: ModerationEntity,
  action: ModerationAction
): Promise<Response> => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: "Entity id is required" });
  }

  const country = await getEntityCountry(entityType, id);
  const hasScope = await ensureCountryScope(req, res, country);
  if (!hasScope) {
    return res;
  }

  const status: ModerationStatus = action === "approve" ? "approved" : "rejected";
  const updated = await updateEntityStatus(entityType, id, status);
  if (!updated) {
    return res.status(404).json({ error: "Entity not found" });
  }

  await writeApprovalLog(
    req.user.id,
    req.user.role,
    action,
    entityType,
    id,
    country,
    typeof req.body?.note === "string" ? req.body.note : undefined
  );

  return res.json({ success: true, id, status, country });
};

export const moderationRouter = Router();

moderationRouter.get(
  "/api/moderation/pending",
  authenticateToken,
  requireCoAdminOrAdmin,
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const stakeholdersQuery =
        req.user.role === "admin"
          ? query(
              `SELECT stakeholder_id, name, category, country, approval_status, moderation_updated_at
               FROM stakeholders
               WHERE approval_status = 'pending'
               ORDER BY name ASC
               LIMIT 500`
            )
          : query(
              `SELECT s.stakeholder_id, s.name, s.category, s.country, s.approval_status, s.moderation_updated_at
               FROM stakeholders s
               WHERE s.approval_status = 'pending'
                 AND LOWER(s.country) IN (
                    SELECT LOWER(country) FROM co_admin_scopes WHERE user_id = $1
                 )
               ORDER BY s.name ASC
               LIMIT 500`,
              [req.user.id]
            );

      const technologiesQuery =
        req.user.role === "admin"
          ? query(
              `SELECT t.id, t.name, t.stakeholder_id, s.country, t.approval_status, t.moderation_updated_at
               FROM technologies t
               LEFT JOIN stakeholders s ON s.stakeholder_id = t.stakeholder_id
               WHERE t.approval_status = 'pending'
               ORDER BY t.name ASC
               LIMIT 500`
            )
          : query(
              `SELECT t.id, t.name, t.stakeholder_id, s.country, t.approval_status, t.moderation_updated_at
               FROM technologies t
               LEFT JOIN stakeholders s ON s.stakeholder_id = t.stakeholder_id
               WHERE t.approval_status = 'pending'
                 AND LOWER(s.country) IN (
                    SELECT LOWER(country) FROM co_admin_scopes WHERE user_id = $1
                 )
               ORDER BY t.name ASC
               LIMIT 500`,
              [req.user.id]
            );

      const techNeedsQuery =
        req.user.role === "admin"
          ? query(
              `SELECT n.id, n.title, n.seeker_id, u.country, n.approval_status, n.moderation_updated_at
               FROM tech_needs n
               LEFT JOIN users u ON u.id = n.seeker_id
               WHERE n.approval_status = 'pending'
               ORDER BY n.created_at DESC
               LIMIT 500`
            )
          : query(
              `SELECT n.id, n.title, n.seeker_id, u.country, n.approval_status, n.moderation_updated_at
               FROM tech_needs n
               LEFT JOIN users u ON u.id = n.seeker_id
               WHERE n.approval_status = 'pending'
                 AND LOWER(u.country) IN (
                    SELECT LOWER(country) FROM co_admin_scopes WHERE user_id = $1
                 )
               ORDER BY n.created_at DESC
               LIMIT 500`,
              [req.user.id]
            );

      const [stakeholders, technologies, techNeeds] = await Promise.all([
        stakeholdersQuery,
        technologiesQuery,
        techNeedsQuery
      ]);

      return res.json({
        stakeholders: stakeholders.rows,
        technologies: technologies.rows,
        tech_needs: techNeeds.rows
      });
    } catch (err) {
      console.error("Failed to fetch moderation queue:", err);
      return res.status(500).json({ error: "Failed to fetch moderation queue" });
    }
  }
);

moderationRouter.put(
  "/api/moderation/technologies/:id/approve",
  authenticateToken,
  requireCoAdminOrAdmin,
  async (req, res) => moderateEntity(req, res, "technology", "approve")
);

moderationRouter.put(
  "/api/moderation/technologies/:id/reject",
  authenticateToken,
  requireCoAdminOrAdmin,
  async (req, res) => moderateEntity(req, res, "technology", "reject")
);

moderationRouter.put(
  "/api/moderation/stakeholders/:id/approve",
  authenticateToken,
  requireCoAdminOrAdmin,
  async (req, res) => moderateEntity(req, res, "stakeholder", "approve")
);

moderationRouter.put(
  "/api/moderation/stakeholders/:id/reject",
  authenticateToken,
  requireCoAdminOrAdmin,
  async (req, res) => moderateEntity(req, res, "stakeholder", "reject")
);

moderationRouter.put(
  "/api/moderation/tech-needs/:id/approve",
  authenticateToken,
  requireCoAdminOrAdmin,
  async (req, res) => moderateEntity(req, res, "tech_need", "approve")
);

moderationRouter.put(
  "/api/moderation/tech-needs/:id/reject",
  authenticateToken,
  requireCoAdminOrAdmin,
  async (req, res) => moderateEntity(req, res, "tech_need", "reject")
);

moderationRouter.get(
  "/api/admin/co-admin-scopes",
  authenticateToken,
  requireMasterAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = await query(
        `SELECT s.user_id, u.name, u.email, s.country
         FROM co_admin_scopes s
         JOIN users u ON u.id = s.user_id
         ORDER BY u.name ASC, s.country ASC`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("Failed to fetch co-admin scopes:", err);
      return res.status(500).json({ error: "Failed to fetch co-admin scopes" });
    }
  }
);

moderationRouter.post(
  "/api/admin/assign-co-admin",
  authenticateToken,
  requireMasterAdmin,
  async (req: Request, res: Response) => {
    const userId = String(req.body?.userId || "").trim();
    const countries = sanitizeCountries(req.body?.countries);

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (countries.length === 0) {
      return res.status(400).json({ error: "At least one country is required" });
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");
      const userResult = await client.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [userId]);
      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "User not found" });
      }

      await client.query("UPDATE users SET role = 'co_admin', is_admin = FALSE WHERE id = $1", [userId]);
      await client.query("DELETE FROM co_admin_scopes WHERE user_id = $1", [userId]);

      for (const country of countries) {
        await client.query(
          `INSERT INTO co_admin_scopes (id, user_id, country)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, country) DO NOTHING`,
          [randomUUID(), userId, country]
        );
      }

      await client.query("COMMIT");
      return res.json({ success: true, userId, role: "co_admin", countries });
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback errors.
      }
      console.error("Assign co-admin failed:", err);
      return res.status(500).json({ error: "Failed to assign co-admin" });
    } finally {
      client.release();
    }
  }
);

moderationRouter.post(
  "/api/admin/revoke-co-admin",
  authenticateToken,
  requireMasterAdmin,
  async (req: Request, res: Response) => {
    const userId = String(req.body?.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE users SET role = 'user', is_admin = FALSE WHERE id = $1", [userId]);
      await client.query("DELETE FROM co_admin_scopes WHERE user_id = $1", [userId]);
      await client.query("COMMIT");
      return res.json({ success: true, userId, role: "user" });
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback errors.
      }
      console.error("Revoke co-admin failed:", err);
      return res.status(500).json({ error: "Failed to revoke co-admin" });
    } finally {
      client.release();
    }
  }
);

export const initModerationSchema = async (): Promise<void> => {
  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`);
    await query(
      `UPDATE users
       SET role = CASE WHEN is_admin IS TRUE THEN 'admin' ELSE 'user' END
       WHERE role IS NULL OR TRIM(role) = '';`
    );
    await query(
      `UPDATE users
       SET role = 'user'
       WHERE role NOT IN ('user', 'co_admin', 'admin', 'master_admin');`
    );

    await query(
      `CREATE TABLE IF NOT EXISTS co_admin_scopes (
        id UUID PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        country TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, country)
      );`
    );
    await query(`CREATE INDEX IF NOT EXISTS idx_co_admin_scopes_user_id ON co_admin_scopes(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_co_admin_scopes_country ON co_admin_scopes(country);`);

    await query(
      `CREATE TABLE IF NOT EXISTS approval_logs (
        id UUID PRIMARY KEY,
        actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        country TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`
    );
    await query(`CREATE INDEX IF NOT EXISTS idx_approval_logs_actor_id ON approval_logs(actor_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_approval_logs_entity ON approval_logs(entity_type, entity_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_approval_logs_created_at ON approval_logs(created_at);`);

    await query(`ALTER TABLE stakeholders ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';`);
    await query(`ALTER TABLE stakeholders ADD COLUMN IF NOT EXISTS moderation_updated_at TIMESTAMPTZ;`);
    await query(`UPDATE stakeholders SET approval_status = 'approved' WHERE approval_status IS NULL;`);
    await query(`CREATE INDEX IF NOT EXISTS idx_stakeholders_approval_status ON stakeholders(approval_status);`);

    await query(`ALTER TABLE technologies ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';`);
    await query(`ALTER TABLE technologies ADD COLUMN IF NOT EXISTS moderation_updated_at TIMESTAMPTZ;`);
    await query(`UPDATE technologies SET approval_status = 'approved' WHERE approval_status IS NULL;`);
    await query(`CREATE INDEX IF NOT EXISTS idx_technologies_approval_status ON technologies(approval_status);`);

    await query(`ALTER TABLE tech_needs ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';`);
    await query(`ALTER TABLE tech_needs ADD COLUMN IF NOT EXISTS moderation_updated_at TIMESTAMPTZ;`);
    await query(`UPDATE tech_needs SET approval_status = 'approved' WHERE approval_status IS NULL;`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tech_needs_approval_status ON tech_needs(approval_status);`);
  } catch (err) {
    console.error("Failed to initialize moderation schema:", err);
  }
};
