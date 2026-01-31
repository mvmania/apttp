import { query } from './db.js';

async function check() {
    try {
        const result = await query('SELECT * FROM tech_categories');
        console.log(JSON.stringify(result.rows));
    } catch (e: any) {
        console.error('Error:', e.message);
        // If table doesn't exist, we might be in trouble or it's a fresh DB.
        // Let's try to infer from technologies table if possible or just use a fallback.
        try {
            const t = await query('SELECT DISTINCT tech_category_id FROM technologies');
            console.log('Existing IDs:', t.rows);
        } catch (e2: any) {
            console.log('Failed to check existing IDs too.');
        }
    }
}
check();
