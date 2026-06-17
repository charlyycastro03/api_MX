import { NextResponse } from 'next/server';
import pg from 'pg';
const { Pool } = pg;

export async function GET() {
  // Find all environment variable keys containing DB, POSTGRES, SUPABASE, URL, or CONN
  const allEnvKeys = Object.keys(process.env).filter(key => {
    const k = key.toUpperCase();
    return k.includes('DB') || k.includes('POSTGRES') || k.includes('SUPABASE') || k.includes('URL') || k.includes('CONN');
  });

  const envVars = Array.from(new Set([
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    ...allEnvKeys
  ]));

  const results = {};

  for (const name of envVars) {
    const value = process.env[name];
    if (!value) {
      results[name] = { defined: false };
      continue;
    }

    // Mask connection string credentials
    let masked = value;
    let host = 'unknown';
    let port = 'unknown';
    let database = 'unknown';

    try {
      if (value.startsWith('postgresql://') || value.startsWith('postgres://')) {
        const url = new URL(value);
        host = url.hostname;
        port = url.port || '5432';
        database = url.pathname.replace(/^\//, '');
        masked = `postgresql://***:***@${host}:${port}/${database}`;
      } else if (name.includes('KEY') || name.includes('PASSWORD') || name.includes('SECRET') || name.includes('TOKEN')) {
        masked = '*** (sensitive key)';
      } else {
        masked = value.substring(0, 15) + '...';
      }
    } catch (e) {
      masked = 'Error parsing connection string';
    }

    results[name] = {
      defined: true,
      masked,
      host,
      port,
      database
    };

    // Only test connection for postgresql connection strings
    if (value.startsWith('postgresql://') || value.startsWith('postgres://')) {
      const pool = new Pool({
        connectionString: value,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        const start = Date.now();
        const res = await pool.query('SELECT NOW()');
        results[name].status = 'SUCCESS';
        results[name].responseTimeMs = Date.now() - start;
        results[name].serverTime = res.rows[0].now;
      } catch (err) {
        results[name].status = 'FAILURE';
        results[name].error = err.message;
        results[name].errorCode = err.code;
      } finally {
        await pool.end();
      }
    } else {
      results[name].status = 'SKIPPED (not a DB connection string)';
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    foundKeys: allEnvKeys,
    results
  });
}
