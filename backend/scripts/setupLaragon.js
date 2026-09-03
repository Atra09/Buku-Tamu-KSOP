const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupLaragonDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  };

  console.log(`[Laragon Setup] Connecting to MySQL at ${config.host}:${config.port} as ${config.user}...`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('[Laragon Setup] Connected to MySQL successfully!');

    // 1. Create Database db_bukutamu
    const dbName = process.env.DB_NAME || 'db_bukutamu';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
    console.log(`[Laragon Setup] Database \`${dbName}\` is created/ready!`);

    // 2. Select Database db_bukutamu
    await connection.changeUser({ database: dbName });

    // 3. Read and execute db_bukutamu.sql
    const sqlPath = path.join(__dirname, '../database/db_bukutamu.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (err) {
          // Ignore table already exists warnings
        }
      }
      console.log(`[Laragon Setup] Successfully executed db_bukutamu.sql schema & seed data into \`${dbName}\`!`);
    }

    await connection.end();
    console.log('[Laragon Setup] Done! Database db_bukutamu is synced and active.');
  } catch (error) {
    console.error('[Laragon Setup] Failed to connect to MySQL:', error.message);
    console.log('[Laragon Setup] Make sure Laragon / MySQL is started in your control panel.');
  }
}

setupLaragonDatabase();
