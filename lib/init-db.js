import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import pool from './db.js';

export async function initDatabase() {
  let connection;
  try {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = parseInt(process.env.DB_PORT || '3306');
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || 'Leoluis03';

    // 1. Connect without database to ensure we can create it
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });

    console.log('Connecting to MySQL to verify database...');
    await connection.query('CREATE DATABASE IF NOT EXISTS api_mx;');
    await connection.end();

    // 2. Now use the pool (which connects to api_mx) to run the rest of the schema
    const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split queries by semicolon and clean them up, ignoring empty lines or comments
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    console.log('Initializing tables in api_mx...');
    for (const query of queries) {
      // Skip CREATE DATABASE and USE statements as we do it at connection level
      if (query.toUpperCase().startsWith('CREATE DATABASE') || query.toUpperCase().startsWith('USE ')) {
        continue;
      }
      await pool.query(query);
    }
    console.log('Database and tables verified/created successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    if (connection && connection.connection.connectionId) {
      try {
        await connection.end();
      } catch (e) {}
    }
    throw error;
  }
}
