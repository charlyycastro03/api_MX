import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const status = searchParams.get('status');
    const activity = searchParams.get('activity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId es requerido.' }, { status: 400 });
    }
    
    let paramIndex = 1;
    let query = `SELECT * FROM companies WHERE portfolio_id = $${paramIndex}`;
    const params = [portfolioId];

    if (status && status !== 'Todos') {
      paramIndex++;
      query += ` AND call_status = $${paramIndex}`;
      params.push(status);
    }

    if (activity) {
      paramIndex++;
      query += ` AND activity ILIKE $${paramIndex}`;
      params.push(`%${activity}%`);
    }

    if (startDate) {
      paramIndex++;
      query += ` AND created_at >= CAST($${paramIndex} AS TIMESTAMP)`;
      params.push(startDate + ' 00:00:00');
    }

    if (endDate) {
      paramIndex++;
      query += ` AND created_at <= CAST($${paramIndex} AS TIMESTAMP)`;
      params.push(endDate + ' 23:59:59');
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Error al obtener empresas de la base de datos.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      denueId, name, activity, phone, email, website, address, latitude, longitude, portfolioId 
    } = body;
    
    if (!denueId || !name || !portfolioId) {
      return NextResponse.json({ error: 'denueId, name y portfolioId son requeridos.' }, { status: 400 });
    }

    // Check if company already exists in this portfolio
    const { rows: existing } = await pool.query(
      'SELECT id FROM companies WHERE denue_id = $1 AND portfolio_id = $2',
      [denueId, portfolioId]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Esta empresa ya está guardada en este portafolio.' }, { status: 400 });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO companies 
       (denue_id, name, activity, phone, email, website, address, latitude, longitude, portfolio_id, call_status, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pendiente', '') RETURNING id`,
      [
        denueId, 
        name, 
        activity || '', 
        phone || '', 
        email || '', 
        website || '', 
        address || '', 
        latitude !== undefined && latitude !== null ? parseFloat(latitude) : null, 
        longitude !== undefined && longitude !== null ? parseFloat(longitude) : null, 
        portfolioId
      ]
    );
    
    return NextResponse.json({ 
      id: rows[0].id, 
      denue_id: denueId, 
      name, 
      activity: activity || '',
      phone: phone || '',
      email: email || '',
      website: website || '',
      address: address || '',
      latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
      portfolio_id: portfolioId, 
      call_status: 'Pendiente', 
      notes: '' 
    });
  } catch (error) {
    console.error('Error saving company:', error);
    return NextResponse.json({ error: 'Error al guardar la empresa en el portafolio.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, callStatus, notes } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID de la empresa es requerido.' }, { status: 400 });
    }
    
    let query = 'UPDATE companies SET ';
    const params = [];
    const fields = [];
    let paramIndex = 0;
    
    if (callStatus !== undefined) {
      paramIndex++;
      fields.push(`call_status = $${paramIndex}`);
      params.push(callStatus);
    }
    
    if (notes !== undefined) {
      paramIndex++;
      fields.push(`notes = $${paramIndex}`);
      params.push(notes);
    }
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar.' }, { status: 400 });
    }
    
    paramIndex++;
    query += fields.join(', ') + ` WHERE id = $${paramIndex}`;
    params.push(id);
    
    await pool.query(query, params);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Error al actualizar el seguimiento de la empresa.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID de la empresa es requerido.' }, { status: 400 });
    }
    
    await pool.query('DELETE FROM companies WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Error al eliminar la empresa del portafolio.' }, { status: 500 });
  }
}
