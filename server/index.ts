import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Helper to map DB users to frontend format
const mapUser = (u: any) => ({
    ...u,
    isAdmin: u.is_admin,
    joinedDate: Number(u.joined_date)
});

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
app.post('/api/technologies', async (req: Request, res: Response) => {
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
app.post('/api/tech-needs', async (req: Request, res: Response) => {
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
app.post('/api/opportunities', async (req: Request, res: Response) => {
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

// POST register
app.post('/api/register', async (req: Request, res: Response) => {
    const { name, email, password, scenario, orgName, orgCategory, orgWebsite } = req.body;

    try {
        const check = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        let stakeholder_id = '';
        if ((scenario === 'Organization Representative' || scenario === 'Official Representative') && orgName) {
            stakeholder_id = `s${Date.now()}`;
            await query(`
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
        await query(`
            INSERT INTO users (
                id, name, email, password, scenario, stakeholder_id, 
                is_verified, is_email_verified, is_id_verified, 
                verification_status, is_admin, joined_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
            id, name, email, password, scenario, stakeholder_id,
            false, false, false, 'None', false, joinedDate
        ]);

        res.status(201).json({ id, name, email, scenario, stakeholder_id, joinedDate });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
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
        if (body.isAdmin !== undefined) mappedUpdate += `, is_admin = ${body.isAdmin}`;

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

// GET stats
app.get('/api/stats', async (req: Request, res: Response) => {
    try {
        const techCount = await query('SELECT COUNT(*) FROM technologies');
        const stakeCount = await query('SELECT COUNT(*) FROM stakeholders');
        res.json({
            technologies: parseInt(techCount.rows[0].count),
            stakeholders: parseInt(stakeCount.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// PUT stakeholder
app.put('/api/stakeholders/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    try {
        const keys = Object.keys(body).filter(k => !Array.isArray(body[k]) && typeof body[k] !== 'object');
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = keys.map(k => body[k]);

        let jsonUpdates = '';
        if (body.key_tech_areas) jsonUpdates += `, key_tech_areas = '${JSON.stringify(body.key_tech_areas)}'`;
        if (body.roles) jsonUpdates += `, roles = '${JSON.stringify(body.roles)}'`;

        await query(`UPDATE stakeholders SET ${setClause} ${jsonUpdates} WHERE stakeholder_id = $1`, [id, ...values]);
        res.json({ message: 'Stakeholder updated' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
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

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log(`Serving static files from: ${distPath}`);
});
