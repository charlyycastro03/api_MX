import pool from './db.js';
import bcrypt from 'bcryptjs';

async function initAuthDB() {
  const client = await pool.connect();
  try {
    console.log('Creando tablas de auth...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'AGENT', -- SUPERADMIN, ADMIN, AGENT
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create call_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id SERIAL PRIMARY KEY,
        company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add columns to companies if they don't exist
    // Just to link the last assigned agent
    try {
        await client.query(`ALTER TABLE companies ADD COLUMN last_called_by INT REFERENCES users(id) ON DELETE SET NULL;`);
    } catch (e) {
        // Ignorar si ya existe
        console.log("Columna last_called_by posiblemente ya existe.");
    }

    // Insert superadmin
    const email = 'charlyycastro03@gmail.com';
    const password = 'CharlyAdmin123!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      await client.query(
        'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)',
        [email, passwordHash, 'SUPERADMIN', 'Carlos Castro']
      );
      console.log('Superadmin user created successfully.');
    } else {
      console.log('Superadmin user already exists. Updating password...');
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [passwordHash, email]
      );
    }
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initAuthDB();
