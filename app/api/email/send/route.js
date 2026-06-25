import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import pool from '@/lib/db';

export async function POST(request) {
  let toEmail = '';
  let campaignIdVal = null;
  let companyIdVal = null;

  try {
    const { to, subject, html, text, campaignId, companyId } = await request.json();
    toEmail = to;
    campaignIdVal = campaignId;
    companyIdVal = companyId;

    if (!to) {
      return NextResponse.json({ error: 'El destinatario (to) es requerido' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: 'El asunto (subject) es requerido' }, { status: 400 });
    }
    if (!html && !text) {
      return NextResponse.json({ error: 'El cuerpo del mensaje (html o text) es requerido' }, { status: 400 });
    }

    // Obtener variables de entorno SMTP
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true';
    const fromName = process.env.SMTP_FROM_NAME || 'Soporte';
    const fromEmail = process.env.SMTP_FROM || user;

    if (!host || !port || !user || !pass) {
      return NextResponse.json(
        { error: 'Configuración SMTP incompleta en las variables de entorno (.env)' },
        { status: 500 }
      );
    }

    // Configurar el transportador de Nodemailer
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        // Evita fallas por certificados autofirmados o no verificados (común en Proton Mail Bridge o redes locales)
        rejectUnauthorized: false,
      },
    });

    // Enviar el correo electrónico
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    });

    // Registrar éxito en email_logs si campaignId y companyId están presentes
    if (campaignIdVal && companyIdVal) {
      try {
        await pool.query(
          `INSERT INTO email_logs (campaign_id, company_id, recipient_email, status) 
           VALUES ($1, $2, $3, 'sent')`,
          [parseInt(campaignIdVal, 10), parseInt(companyIdVal, 10), toEmail]
        );
      } catch (logErr) {
        console.error('Error al registrar log de éxito en email_logs:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error al enviar correo electrónico:', error);

    // Registrar error en email_logs si campaignId y companyId están de hecho presentes
    if (campaignIdVal && companyIdVal && toEmail) {
      try {
        await pool.query(
          `INSERT INTO email_logs (campaign_id, company_id, recipient_email, status, error_message) 
           VALUES ($1, $2, $3, 'error', $4)`,
          [parseInt(campaignIdVal, 10), parseInt(companyIdVal, 10), toEmail, error.message || 'Error de envío']
        );
      } catch (logErr) {
        console.error('Error al registrar log de error en email_logs:', logErr);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Error interno al enviar el correo' },
      { status: 500 }
    );
  }
}
