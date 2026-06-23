import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

// Middleware or explicit check is needed here
async function checkAdmin(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'SUPERADMIN' && payload.role !== 'ADMIN')) {
    return null;
  }
  return payload;
}

export async function GET(request) {
  const admin = await checkAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { rows } = await pool.query('SELECT id, email, role, name, created_at FROM users ORDER BY id DESC');
    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await checkAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { email, password, role, name } = await request.json();

    if (!email || !password || !role || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    // Only SUPERADMIN can create other SUPERADMINS
    if (role === 'SUPERADMIN' && admin.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Only SUPERADMIN can create SUPERADMINS' }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, name',
      [email, passwordHash, role, name]
    );

    return NextResponse.json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
