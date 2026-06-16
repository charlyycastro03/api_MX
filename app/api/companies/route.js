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
    
    let query = 'SELECT * FROM companies WHERE portfolio_id = ?';
    const params = [portfolioId];

    if (status && status !== 'Todos') {
      query += ' AND call_status = ?';
      params.push(status);
    }

    if (activity) {
      query += ' AND activity LIKE ?';
      params.push(`%${activity}%`);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate + ' 00:00:00');
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
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
    const [existing] = await pool.query(
      'SELECT id FROM companies WHERE denue_id = ? AND portfolio_id = ?',
      [denueId, portfolioId]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Esta empresa ya está guardada en este portafolio.' }, { status: 400 });
    }
    
    const [result] = await pool.query(
      `INSERT INTO companies 
       (denue_id, name, activity, phone, email, website, address, latitude, longitude, portfolio_id, call_status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', '')`,
      [denueId, name, activity || '', phone || '', email || '', website || '', address || '', latitude || null, longitude || null, portfolioId]
    );
    
    return NextResponse.json({ 
      id: result.insertId, 
      denue_id: denueId, 
      name, 
      activity: activity || '',
      phone: phone || '',
      email: email || '',
      website: website || '',
      address: address || '',
      latitude: latitude || null,
      longitude: longitude || null,
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
    
    if (callStatus !== undefined) {
      fields.push('call_status = ?');
      params.push(callStatus);
    }
    
    if (notes !== undefined) {
      fields.push('notes = ?');
      params.push(notes);
    }
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar.' }, { status: 400 });
    }
    
    query += fields.join(', ') + ' WHERE id = ?';
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
    
    await pool.query('DELETE FROM companies WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Error al eliminar la empresa del portafolio.' }, { status: 500 });
  }
}
