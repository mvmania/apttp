import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'csir_technologies_detailed.json');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function updateStakeholders() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ Data file not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`📂 Loaded ${data.length} records. Extracting stakeholder info...`);

    const stakeholders = new Map();

    data.forEach((item: any) => {
        if (!item.institute) return;

        const orgName = item.institute;
        const stakeholderId = `s_${orgName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50)}`;

        // Extract Contact Info from full text
        // Pattern: ": director[at]csio[dot]res[dot]in :91-XXX... :https://..."
        let email = '';
        let website = '';

        if (item.full_content) {
            // Email
            const emailMatch = item.full_content.match(/:?\s*([a-zA-Z0-9._-]+\[at\][a-zA-Z0-9._-]+(\[dot\][a-zA-Z0-9._-]+)+)/);
            if (emailMatch) {
                email = emailMatch[1].replace(/\[at\]/g, '@').replace(/\[dot\]/g, '.');
            }

            // Website
            const urlMatch = item.full_content.match(/:(https?:\/\/[a-zA-Z0-9./-]+)/);
            if (urlMatch) {
                website = urlMatch[1];
            }
        }

        if (email || website) {
            // Only add if we found something new, merge if multiple entries for same org
            const existing = stakeholders.get(stakeholderId) || { email: '', website: '' };
            if (!existing.email && email) existing.email = email;
            if (!existing.website && website) existing.website = website;
            stakeholders.set(stakeholderId, existing);
        }
    });

    console.log(`Found updates for ${stakeholders.size} stakeholders. Updating DB...`);

    let updated = 0;

    // Process sequentially with robust connection
    for (const [id, info] of stakeholders.entries()) {
        if (!info.email && !info.website) continue;

        // Build dynamic update
        const fields = [];
        const values = [];
        let idx = 1;

        if (info.email) {
            fields.push(`contact_email = $${idx++}`);
            values.push(info.email);
        }
        if (info.website) {
            fields.push(`website = $${idx++}`);
            values.push(info.website);
        }

        values.push(id); // ID is last param
        const queryStr = `UPDATE stakeholders SET ${fields.join(', ')} WHERE stakeholder_id = $${idx} RETURNING stakeholder_id`;

        // Create fresh client for each to avoid long-lived pool issues on weak connections
        const client = new pg.Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            await client.query(queryStr, values);
            process.stdout.write('.');
            updated++;
        } catch (e: any) {
            console.error(`\n❌ Failed id ${id}: ${e.message}`);
        } finally {
            await client.end().catch(() => { });
        }
    }

    console.log(`\n✅ Updated ${updated} stakeholders.`);
    await pool.end();
}

updateStakeholders();
