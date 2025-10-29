import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
});

console.log('✅ Connected to MySQL successfully');
console.log({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  passwordLength: process.env.DB_PASSWORD?.length,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

export default db;
