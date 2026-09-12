const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'mysql';
const dbName = process.env.DB_NAME || 'db_bukutamu';
const dbUser = process.env.DB_USER || process.env.DB_USERNAME || 'root';
const dbPass = process.env.DB_PASS !== undefined ? process.env.DB_PASS : (process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '');
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

let sequelize;

const initDatabase = () => {
  if (dialect === 'sqlite') {
    const storagePath = path.resolve(__dirname, '..', process.env.DB_STORAGE || './database.sqlite');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging: false
    });
  } else {
    // MySQL Dialect
    sequelize = new Sequelize(dbName, dbUser, dbPass, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false
    });
  }
  return sequelize;
};

const ensureMySQLDatabaseExists = async () => {
  if (dialect !== 'mysql') return;
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
    await connection.query(`USE \`${dbName}\`;`);
    try {
      await connection.query(`UPDATE \`users\` SET \`role\` = 'admin' WHERE \`role\` NOT IN ('admin', 'kordinator', 'user') OR \`role\` IS NULL;`);
      await connection.query(`ALTER TABLE \`users\` MODIFY COLUMN \`role\` ENUM('admin', 'kordinator', 'user') NOT NULL DEFAULT 'user';`);
    } catch (e) {
      // Table may not exist yet on initial run
    }
    await connection.end();
    console.log(`Database MySQL '${dbName}' dipastikan siap/terbuat.`);
  } catch (err) {
    console.error(`Peringatan: Gagal terhubung ke MySQL (${err.message}).`);
    throw err;
  }
};

sequelize = initDatabase();

module.exports = {
  sequelize,
  ensureMySQLDatabaseExists,
  dbName
};
