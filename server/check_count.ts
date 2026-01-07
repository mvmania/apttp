import { query } from './db.js';
async function checkCount() {
    const result = await query('SELECT COUNT(*) FROM technologies');
    console.log('COUNT:' + result.rows[0].count);
    process.exit(0);
}
checkCount();
