import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const DATA_FILE = path.join(__dirname, 'csir_technologies.json');

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render needs this usually
    connectionTimeoutMillis: 5000,
});

const DEFAULT_CATEGORY = 'General';

async function migrateCSIR() {
    console.log('🔌 Connecting to DB...');
    try {
        const client = await pool.connect();
        console.log('✅ Connected.');
        client.release();
    } catch (err: any) {
        console.error('❌ DB Connection Failed:', err.message);
        process.exit(1);
    }

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ Data file not found:', DATA_FILE);
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`📂 Loaded ${data.length} records. Preparing bulk insert...`);

    // Prepare arrays for bulk
    const stakeholdersMap = new Map();
    const technologies = [];

    for (const item of data) {
        const orgName = item.institute || 'Unknown Institute';
        const stakeholderId = `s_${orgName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50)}`;

        if (!stakeholdersMap.has(stakeholderId)) {
            stakeholdersMap.set(stakeholderId, {
                id: stakeholderId,
                name: orgName,
                desc: `CSIR Institute: ${orgName}`
            });
        }

        const techId = `t_csir_${Buffer.from(item.url).toString('base64').substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`;
        let trlLevel = 1;
        const trlMatch = (item.trl || '').match(/(\d+)/);
        if (trlMatch) trlLevel = parseInt(trlMatch[1]);

        technologies.push({
            id: techId,
            name: item.title,
            stakeholder_id: stakeholderId,
            description: item.description || item.raw_text?.substring(0, 500) || 'No description',
            trl: trlLevel
        });
    }

    // 1. Insert Stakeholders (Batch isn't strictly necessary for < 100 items but good practice)
    console.log(`Processing ${stakeholdersMap.size} stakeholders...`);
    for (const s of stakeholdersMap.values()) {
        try {
            await pool.query(`
                INSERT INTO stakeholders (stakeholder_id, name, category, description, is_verified, roles)
                VALUES ($1, $2, 'Research Institution', $3, true, $4)
                ON CONFLICT (stakeholder_id) DO NOTHING
            `, [s.id, s.name, s.desc, JSON.stringify(['Provider'])]);
        } catch (e: any) {
            console.warn(`Error inserting stakeholder ${s.name}: ${e.message}`);
        }
    }

    // 2. Insert Technologies (Batch 50)
    console.log(`Processing ${technologies.length} technologies...`);
    const BATCH_SIZE = 50;

    for (let i = 0; i < technologies.length; i += BATCH_SIZE) {
        const batch = technologies.slice(i, i + BATCH_SIZE);

        // Construct query: VALUES ($1, $2...), ($X, $Y...)
        const values: any[] = [];
        const placeholders: string[] = [];

        batch.forEach((t, idx) => {
            const offset = idx * 8;
            placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);

            values.push(
                t.id, t.name, t.stakeholder_id, DEFAULT_CATEGORY,
                t.description, 'know-how', t.trl, 'Public'
            );
        });

        const queryText = `
            INSERT INTO technologies (
                id, name, stakeholder_id, tech_category_id, 
                description, ip_status, trl_level, disclosure_level
            ) VALUES ${placeholders.join(', ')}
            ON CONFLICT (id) DO UPDATE SET
                description = EXCLUDED.description,
                trl_level = EXCLUDED.trl_level
        `;

        try {
            await pool.query(queryText, values);
            process.stdout.write('.');
        } catch (e: any) {
            console.error(`\n❌ Batch failed: ${e.message}`);
        }
    }

    console.log('\n✅ Migration Complete.');
    pool.end();
}

migrateCSIR();
