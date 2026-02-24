import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Whois123",
  database: "apttp_db",
  ssl: false
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = () => pool.connect();

export default pool;
