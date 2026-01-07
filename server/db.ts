import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });
dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

// Use DATABASE_URL if provided (preferred for production/Render), 
// otherwise fallback to individual params for local dev
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};

export default pool;
