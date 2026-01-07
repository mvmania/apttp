import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
});
async function test() {
    console.log('Connecting to:', process.env.DATABASE_URL?.split('@')[1]);
    try {
        const start = Date.now();
        const res = await pool.query('SELECT 1');
        console.log('Query took:', Date.now() - start, 'ms');
        console.log('Result:', res.rows[0]);
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}
test();
