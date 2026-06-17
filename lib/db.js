import pg from 'pg';
const { Pool } = pg;

let pool;

const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL;

const config = connectionString 
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(config);
} else {
  if (!global._pgPool) {
    global._pgPool = new Pool(config);
  }
  pool = global._pgPool;
}

export default pool;

// Trigger redeploy to pick up Vercel Supabase integration variables

