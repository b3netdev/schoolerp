import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const { Pool } = pg;


// PostgreSQL database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // pool options
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();

    console.log("✅ PostgreSQL database connected successfully");

    client.release();
    return true;
  } catch (error: any) {
    console.error("❌ PostgreSQL database connection failed:", error.message);
    return false;
  }
};

// Execute query helper
export const query = async (sql: any, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

export default pool;
