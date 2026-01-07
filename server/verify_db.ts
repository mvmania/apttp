import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
async function check() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM technologies');
        console.log('COUNT_TECH:' + res.rows[0].count);
        const res2 = await pool.query('SELECT stakeholder_id, count(*) FROM technologies GROUP BY stakeholder_id');
        console.log('STAKEHOLDERS:', JSON.stringify(res2.rows));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
check();
