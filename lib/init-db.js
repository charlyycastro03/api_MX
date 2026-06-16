import fs from 'fs';
import path from 'path';
import pool from './db.js';

export async function initDatabase() {
  try {
    console.log('Verifying PostgreSQL database tables...');
    const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split queries by semicolon and clean them up, ignoring empty lines or comments
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    for (const query of queries) {
      await pool.query(query);
    }
    console.log('PostgreSQL database tables verified/created successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}
