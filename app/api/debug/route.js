import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const debugInfo = {};

  try {
    // 1. Check database connection
    const timeRes = await pool.query('SELECT NOW()');
    debugInfo.connection = 'SUCCESS';
    debugInfo.db_time = timeRes.rows[0].now;

    // 2. Check existing tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    debugInfo.tables = tablesRes.rows.map(r => r.table_name);

    // 3. Check campaigns count
    if (debugInfo.tables.includes('email_campaigns')) {
      const campCount = await pool.query('SELECT COUNT(*)::int as count FROM email_campaigns');
      debugInfo.email_campaigns_count = campCount.rows[0].count;
      
      const latestCamp = await pool.query('SELECT * FROM email_campaigns ORDER BY id DESC LIMIT 5');
      debugInfo.latest_campaigns = latestCamp.rows;
    } else {
      debugInfo.email_campaigns_count = 'TABLE DOES NOT EXIST';
    }

    // 4. Check email logs count
    if (debugInfo.tables.includes('email_logs')) {
      const logsCount = await pool.query('SELECT COUNT(*)::int as count FROM email_logs');
      debugInfo.email_logs_count = logsCount.rows[0].count;

      const latestLogs = await pool.query('SELECT * FROM email_logs ORDER BY id DESC LIMIT 5');
      debugInfo.latest_logs = latestLogs.rows;
    } else {
      debugInfo.email_logs_count = 'TABLE DOES NOT EXIST';
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Error debugging DB:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      debugInfo
    }, { status: 500 });
  }
}
