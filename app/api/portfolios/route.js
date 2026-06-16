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
    const { rows } = await pool.query(`
      SELECT p.id, p.name, p.created_at, COUNT(c.id) AS company_count 
      FROM portfolios p 
      LEFT JOIN companies c ON p.id = c.portfolio_id 
      GROUP BY p.id, p.name, p.created_at
      ORDER BY p.created_at DESC
    `);
    
    // Convert company_count to integer because PostgreSQL COUNT() returns a bigint/string
    const formattedRows = rows.map(r => ({
      ...r,
      company_count: parseInt(r.company_count || '0')
    }));

    return NextResponse.json(formattedRows);
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
    
    const { rows } = await pool.query(
      'INSERT INTO portfolios (name) VALUES ($1) RETURNING id', 
      [name.trim()]
    );
    
    return NextResponse.json({ id: rows[0].id, name: name.trim(), company_count: 0 });
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
    
    await pool.query('DELETE FROM portfolios WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json({ error: 'Error al eliminar el portafolio.' }, { status: 500 });
  }
}
