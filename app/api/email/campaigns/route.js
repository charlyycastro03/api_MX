import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/email/campaigns
// Consulta campañas o el detalle de logs de una campaña específica
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const campaignId = searchParams.get('campaignId');

    // Caso 1: Obtener detalles de una campaña específica (Listado de correos individuales)
    if (campaignId) {
      const { rows } = await pool.query(
        `SELECT 
          el.id, 
          el.campaign_id, 
          el.company_id, 
          c.name as company_name, 
          el.recipient_email, 
          el.status, 
          el.error_message, 
          el.created_at
        FROM email_logs el
        LEFT JOIN companies c ON el.company_id = c.id
        WHERE el.campaign_id = $1
        ORDER BY el.id ASC`,
        [parseInt(campaignId, 10)]
      );
      return NextResponse.json({ logs: rows });
    }

    // Caso 2: Listar campañas agregadas de un portafolio
    if (portfolioId) {
      const { rows } = await pool.query(
        `SELECT 
          ec.id, 
          ec.portfolio_id, 
          ec.subject, 
          ec.body, 
          ec.created_at,
          COUNT(el.id)::int as total_emails,
          SUM(CASE WHEN el.status = 'sent' THEN 1 ELSE 0 END)::int as sent_emails,
          SUM(CASE WHEN el.status = 'error' THEN 1 ELSE 0 END)::int as error_emails
        FROM email_campaigns ec
        LEFT JOIN email_logs el ON ec.id = el.campaign_id
        WHERE ec.portfolio_id = $1
        GROUP BY ec.id, ec.portfolio_id, ec.subject, ec.body, ec.created_at
        ORDER BY ec.id DESC`,
        [parseInt(portfolioId, 10)]
      );
      return NextResponse.json({ campaigns: rows });
    }

    return NextResponse.json({ error: 'Falta parametro portfolioId o campaignId' }, { status: 400 });
  } catch (error) {
    console.error('Error al obtener campañas/logs:', error);
    return NextResponse.json({ error: 'Error interno al consultar campañas' }, { status: 500 });
  }
}

// POST /api/email/campaigns
// Crea una nueva campaña vacía para luego asociarle logs de envío
export async function POST(request) {
  try {
    const { portfolioId, subject, body } = await request.json();

    if (!portfolioId || !subject || !body) {
      return NextResponse.json({ error: 'portfolioId, subject y body son requeridos' }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO email_campaigns (portfolio_id, subject, body) 
       VALUES ($1, $2, $3) 
       RETURNING id, portfolio_id, subject, body, created_at`,
      [parseInt(portfolioId, 10), subject, body]
    );

    return NextResponse.json({ success: true, campaign: rows[0] });
  } catch (error) {
    console.error('Error al guardar campaña:', error);
    return NextResponse.json({ error: 'Error interno al crear campaña' }, { status: 500 });
  }
}
