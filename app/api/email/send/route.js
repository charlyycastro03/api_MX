import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { to, subject, html, text } = await request.json();

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

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error al enviar correo electrónico:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al enviar el correo' },
      { status: 500 }
    );
  }
}
