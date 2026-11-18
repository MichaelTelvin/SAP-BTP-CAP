const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'app.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Open or create the SQLite database file
const db = new Database(dbPath);

// Enable Write-Ahead Logging (better performance) and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables from schema.sql
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = db;
