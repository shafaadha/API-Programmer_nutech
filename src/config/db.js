import mysql from 'mysql2/promise';

async function connectDB() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
    });
    console.log('✅ Connected to MySQL successfully');
    return db;
  } catch (err) {
    console.error('❌ MySQL connection error:', err.code, err.message);
    process.exit(1);
  }
}

const db = await connectDB();
export default db;
