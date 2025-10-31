import mysql from "mysql2/promise";
import "dotenv/config";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

try {
  const connection = await db.getConnection();
  console.log("✅ Connected to MySQL using pool");
  connection.release();
} catch (err) {
  console.error("❌ MySQL pool connection failed:", err.message);
  process.exit(1);
}

export default db;
