import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { initDatabase } from '@/lib/init-db';

let isDbInitialized = false;

async function ensureDb() {
  if (!isDbInitialized) {
    await initDatabase();
    isDbInitialized = true;
  }
}

export async function GET() {
  try {
    await ensureDb();
    const [rows] = await pool.query(`
      SELECT p.*, COUNT(c.id) AS company_count 
      FROM portfolios p 
      LEFT JOIN companies c ON p.id = c.portfolio_id 
      GROUP BY p.id 
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json({ error: 'Error al obtener portafolios de la base de datos.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureDb();
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre del portafolio es requerido.' }, { status: 400 });
    }
    
    const [result] = await pool.query('INSERT INTO portfolios (name) VALUES (?)', [name.trim()]);
    
    return NextResponse.json({ id: result.insertId, name: name.trim(), company_count: 0 });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json({ error: 'Error al crear el portafolio en la base de datos.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID de portafolio es requerido.' }, { status: 400 });
    }
    
    await pool.query('DELETE FROM portfolios WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json({ error: 'Error al eliminar el portafolio.' }, { status: 500 });
  }
}
