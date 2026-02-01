import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkEmails() {
    try {
        const res = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN contact_email IS NOT NULL AND contact_email != '' THEN 1 END) as with_email,
                COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website
            FROM stakeholders
        `);

        console.log('--- Stakeholder Data Stats ---');
        console.log('Total Stakeholders:', res.rows[0].total);
        console.log('With Email:', res.rows[0].with_email);
        console.log('With Website:', res.rows[0].with_website);
        console.log('Missing Email:', res.rows[0].total - res.rows[0].with_email);

        // List top 5 missing
        const missing = await pool.query(`SELECT name, stakeholder_id FROM stakeholders WHERE contact_email IS NULL OR contact_email = '' LIMIT 5`);
        if (missing.rows.length > 0) {
            console.log('\nExamples with missing email:');
            missing.rows.forEach(r => console.log(`- ${r.name} (${r.stakeholder_id})`));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkEmails();
