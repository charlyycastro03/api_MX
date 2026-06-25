import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const campaignId = searchParams.get('campaignId');

    if (!companyId) {
      return new Response('Parámetros inválidos', { status: 400 });
    }

    // 1. Fetch current status of the company to log it correctly
    const { rows: companyRows } = await pool.query(
      'SELECT name, call_status, notes FROM companies WHERE id = $1',
      [parseInt(companyId, 10)]
    );

    if (companyRows.length === 0) {
      return new Response('Empresa no encontrada', { status: 404 });
    }

    const company = companyRows[0];
    const previousStatus = company.call_status;
    const currentNotes = company.notes || '';
    const newNotes = `[Interés Registrado vía Campaña de Correo el ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}]\n${currentNotes}`;

    // 2. Update status in companies table
    await pool.query(
      `UPDATE companies 
       SET call_status = 'Contactado - Interesado', notes = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [newNotes, parseInt(companyId, 10)]
    );

    // 3. Insert call log history
    await pool.query(
      `INSERT INTO call_logs (company_id, previous_status, new_status, notes) 
       VALUES ($1, $2, $3, $4)`,
      [parseInt(companyId, 10), previousStatus, 'Contactado - Interesado', 'El cliente hizo clic en el enlace de interés en el correo masivo.']
    );

    // 4. Return a gorgeous premium HTML landing page
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interés Registrado - Kodra</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #070a13;
            color: #f8fafc;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .glass-panel {
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            border-radius: 16px;
            padding: 40px;
            max-width: 480px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .icon-wrapper {
            width: 72px;
            height: 72px;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: #6366f1;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          p {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .btn {
            display: inline-block;
            background: #6366f1;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14.5px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          }
        </style>
      </head>
      <body>
        <div class="glass-panel">
          <div class="icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1>¡Interés Registrado!</h1>
          <p>Hemos recibido tu solicitud para <strong>${company.name}</strong>. Un asesor especializado de nuestro equipo se pondrá en contacto contigo en breve para preparar una propuesta a la medida de tu negocio.</p>
          <a href="https://servicios-kodra.vercel.app/" class="btn">Visitar Kodra</a>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Error handling client interest:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
}
