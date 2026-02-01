import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
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
    const { name, email, password, scenario, orgName, orgCategory, orgWebsite, country } = req.body;

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
                verification_status, is_admin, joined_date, country
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
            id, name, email, password, scenario, stakeholder_id,
            false, false, false, 'None', false, joinedDate, country || null
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
app.post('/api/technologies/import', async (req: Request, res: Response) => {
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
            INSERT INTO technologies (id, name, stakeholder_id, tech_category_id, description, ip_status, patent_number, trl_level)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET 
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              trl_level = EXCLUDED.trl_level,
              patent_number = EXCLUDED.patent_number,
              ip_status = EXCLUDED.ip_status
        `, [
            tech.id, tech.name, tech.stakeholder_id, tech.tech_category_id,
            tech.description, tech.ip_status, tech.patent_number, tech.trl_level
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
app.get('/api/admin/content', async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
        const result = await query('SELECT * FROM site_content ORDER BY key');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch content details' });
    }
});

// PUT update content
app.put('/api/content/:key', async (req: Request, res: Response) => {
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

// Start server
app.listen(Number(PORT), '0.0.0.0', async () => {
    await initContent();
    await initStatsSchema();
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log(`Serving static files from: ${distPath}`);
});
