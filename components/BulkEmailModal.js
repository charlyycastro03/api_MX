import React, { useState, useEffect, useRef } from 'react';

export default function BulkEmailModal({ isOpen, onClose, companies }) {
  const [recipients, setRecipients] = useState([]);
  const [subjectTemplate, setSubjectTemplate] = useState('Pregunta rápida sobre {{NOMBRE}}');
  const [bodyTemplate, setBodyTemplate] = useState(
    'Hola,\n\nEstaba buscando empresas del sector {{ACTIVIDAD}} en {{MUNICIPIO}} y me topé con {{NOMBRE}}.\n\nNoté que muchas empresas en su categoría están buscando optimizar sus procesos de ventas digitales, y desarrollamos una solución específica para esto.\n\n¿Tendría sentido enviarle un vídeo de 2 minutos que muestra cómo lo hacemos?\n\nSaludos,\nSoporte de Kodratech'
  );
  
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [sendingProgress, setSendingProgress] = useState(0);
  const [currentSendingIndex, setCurrentSendingIndex] = useState(-1);
  const isPausedRef = useRef(true);

  // Filter companies that have an email when modal opens or companies prop changes
  useEffect(() => {
    if (isOpen && companies) {
      const filtered = companies
        .map((c, index) => {
          const email = c.CorreoElectronico || c.Correo_e || c.correo_e || c.email || c.Email || '';
          const name = c.Nombre || c.name || '';
          const activity = c.ClaseActividad || c.Clase_actividad || c.activity || '';
          const municipio = c.Municipio || c.municipio || '';
          const estrato = c.Estrato || c.estrato || '';
          const phone = c.Telefono || c.phone || '';
          const id = c.Id || c.id || c.denue_id || index;

          return {
            id,
            name,
            email: email.trim(),
            activity,
            municipio,
            estrato,
            phone,
            status: 'pending', // 'pending' | 'sending' | 'sent' | 'error'
            errorMsg: ''
          };
        })
        .filter(c => c.email !== '' && c.email.includes('@'));
      
      setRecipients(filtered);
      setIsSending(false);
      isPausedRef.current = true;
      setSendingProgress(0);
      setCurrentSendingIndex(-1);
    }
  }, [isOpen, companies]);

  if (!isOpen) return null;

  const compileTemplate = (template, recipient) => {
    if (!template) return '';
    return template
      .replace(/\{\{NOMBRE\}\}/g, recipient.name)
      .replace(/\{\{ACTIVIDAD\}\}/g, recipient.activity)
      .replace(/\{\{MUNICIPIO\}\}/g, recipient.municipio)
      .replace(/\{\{ESTRATO\}\}/g, recipient.estrato)
      .replace(/\{\{TELEFONO\}\}/g, recipient.phone)
      .replace(/\{\{EMAIL\}\}/g, recipient.email);
  };

  const getHtmlBody = (text) => {
    return text
      .split('\n')
      .map(paragraph => `<p style="margin-bottom: 12px; line-height: 1.6; font-size: 15px; color: #222222; font-family: sans-serif;">${paragraph}</p>`)
      .join('');
  };

  const handleStartSending = async () => {
    if (recipients.length === 0) return;
    
    setIsSending(true);
    isPausedRef.current = false;
    
    // Find the next index to process
    let startIndex = recipients.findIndex(r => r.status === 'pending' || r.status === 'error');
    if (startIndex === -1) {
      // If all are completed, reset and start over
      startIndex = 0;
      setRecipients(prev => prev.map(r => ({ ...r, status: 'pending', errorMsg: '' })));
    }

    sendEmailsLoop(startIndex);
  };

  const sendEmailsLoop = async (index) => {
    if (index >= recipients.length || isPausedRef.current) {
      if (isPausedRef.current) {
        setIsSending(false);
      } else {
        // Finished everything
        setIsSending(false);
        setCurrentSendingIndex(-1);
      }
      return;
    }

    setCurrentSendingIndex(index);
    
    // Update recipient status to 'sending'
    setRecipients(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'sending', errorMsg: '' };
      return next;
    });

    const recipient = recipients[index];
    const subject = compileTemplate(subjectTemplate, recipient);
    const bodyText = compileTemplate(bodyTemplate, recipient);
    const bodyHtml = getHtmlBody(bodyText);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient.email,
          subject: subject,
          html: bodyHtml,
          text: bodyText
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRecipients(prev => {
          const next = [...prev];
          next[index] = { ...next[index], status: 'sent' };
          
          // Calculate progress percentage
          const finished = next.filter(r => r.status === 'sent' || r.status === 'error').length;
          setSendingProgress(Math.round((finished / next.length) * 100));
          
          return next;
        });
      } else {
        throw new Error(data.error || 'Fallo desconocido al enviar correo');
      }
    } catch (err) {
      console.error(`Error enviando email a ${recipient.email}:`, err);
      setRecipients(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'error', errorMsg: err.message || 'Error de conexión' };
        
        const finished = next.filter(r => r.status === 'sent' || r.status === 'error').length;
        setSendingProgress(Math.round((finished / next.length) * 100));
        
        return next;
      });
    }

    // Wait a brief moment to avoid overloading SMTP server too fast (1.5 seconds delay)
    setTimeout(() => {
      sendEmailsLoop(index + 1);
    }, 1500);
  };

  const handlePauseSending = () => {
    isPausedRef.current = true;
    setIsSending(false);
  };

  const previewRecipient = recipients[0] || {
    name: 'Ejemplo Empresa S.A.',
    activity: 'Restaurante de comida rápida',
    municipio: 'Guadalajara',
    estrato: '6 a 10 personas',
    phone: '3312345678',
    email: 'contacto@ejemplo.com'
  };

  const previewSubject = compileTemplate(subjectTemplate, previewRecipient);
  const previewBody = compileTemplate(bodyTemplate, previewRecipient);

  return (
    <div className="email-modal-overlay">
      <div className="email-modal glass-panel animate-slide-up">
        
        {/* Header */}
        <div className="email-modal-header">
          <div>
            <h3>Campañas de Correo Masivo (Opción B)</h3>
            <p className="subtitle">Configura y envía correos personalizados con disparadores psicológicos</p>
          </div>
          <button className="btn-close" onClick={onClose} disabled={isSending}>
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="email-modal-content">
          
          {/* Left Column: Editor & Templates */}
          <div className="email-left-pane">
            <div className="tab-buttons">
              <button 
                className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                Diseñar Correo
              </button>
              <button 
                className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Vista Previa
              </button>
            </div>

            {activeTab === 'editor' ? (
              <div className="editor-form">
                <div className="form-group">
                  <label>Asunto del Correo</label>
                  <input 
                    type="text" 
                    value={subjectTemplate} 
                    onChange={(e) => setSubjectTemplate(e.target.value)} 
                    placeholder="Ej. Pregunta rápida sobre {{NOMBRE}}"
                    disabled={isSending}
                  />
                </div>

                <div className="form-group">
                  <label>Cuerpo del Mensaje (Texto Plano / Párrafos)</label>
                  <textarea 
                    value={bodyTemplate} 
                    onChange={(e) => setBodyTemplate(e.target.value)}
                    rows={12}
                    placeholder="Redacta tu mensaje aquí..."
                    disabled={isSending}
                  />
                </div>

                {/* Variables helper */}
                <div className="variables-helper">
                  <span className="helper-title">Variables dinámicas:</span>
                  <div className="variables-tags">
                    <button 
                      type="button" 
                      onClick={() => !isSending && setBodyTemplate(prev => prev + ' {{NOMBRE}}')}
                      title="Nombre del negocio"
                      disabled={isSending}
                    >
                      {"{{NOMBRE}}"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => !isSending && setBodyTemplate(prev => prev + ' {{MUNICIPIO}}')}
                      title="Municipio"
                      disabled={isSending}
                    >
                      {"{{MUNICIPIO}}"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => !isSending && setBodyTemplate(prev => prev + ' {{ACTIVIDAD}}')}
                      title="Giro del negocio"
                      disabled={isSending}
                    >
                      {"{{ACTIVIDAD}}"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => !isSending && setBodyTemplate(prev => prev + ' {{ESTRATO}}')}
                      title="Tamaño de la empresa"
                      disabled={isSending}
                    >
                      {"{{ESTRATO}}"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => !isSending && setBodyTemplate(prev => prev + ' {{TELEFONO}}')}
                      title="Teléfono"
                      disabled={isSending}
                    >
                      {"{{TELEFONO}}"}
                    </button>
                  </div>
                  <p className="helper-desc">
                    Haz clic en una variable para insertarla al final del mensaje. Se reemplazarán dinámicamente para cada destinatario.
                  </p>
                </div>
              </div>
            ) : (
              <div className="preview-pane">
                <div className="preview-header">
                  <div><strong>De:</strong> {process.env.SMTP_USER || 'tudominio@empresa.com'} (Vía SMTP de la App)</div>
                  <div><strong>Para:</strong> {previewRecipient.email}</div>
                  <div><strong>Asunto:</strong> {previewSubject}</div>
                </div>
                <div className="preview-body">
                  {previewBody.split('\n').map((para, i) => (
                    <p key={i}>{para || '\u00A0'}</p>
                  ))}
                </div>
                <p className="preview-note">
                  * Mostrando vista previa del primer destinatario. Las variables se adaptarán automáticamente para las demás empresas.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Recipient list & Controls */}
          <div className="email-right-pane">
            <div className="campaign-summary">
              <h4>Resumen de Destinatarios</h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-num">{companies ? companies.length : 0}</span>
                  <span className="stat-label">Total Filtrados</span>
                </div>
                <div className="stat-card highlighted">
                  <span className="stat-num">{recipients.length}</span>
                  <span className="stat-label">Con Correo</span>
                </div>
                <div className="stat-card success">
                  <span className="stat-num">{recipients.filter(r => r.status === 'sent').length}</span>
                  <span className="stat-label">Enviados</span>
                </div>
              </div>
            </div>

            {/* Campaign controls */}
            <div className="controls-section">
              {recipients.length === 0 ? (
                <div className="alert-no-emails">
                  No hay empresas con correo electrónico en los resultados filtrados. Por favor, asegúrate de que el filtro incluya empresas con correo válido.
                </div>
              ) : (
                <>
                  <div className="progress-container">
                    <div className="progress-info">
                      <span>Progreso del envío</span>
                      <span>{sendingProgress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${sendingProgress}%` }}></div>
                    </div>
                  </div>

                  <div className="actions-row">
                    {!isSending ? (
                      <button 
                        className="btn-action btn-send-start" 
                        onClick={handleStartSending}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        {recipients.some(r => r.status === 'sent') ? 'Reanudar Envío' : 'Iniciar Campaña'}
                      </button>
                    ) : (
                      <button 
                        className="btn-action btn-send-pause" 
                        onClick={handlePauseSending}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        Pausar Envío
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Recipients list table */}
            <div className="recipients-list-container">
              <h5>Listado de Envío</h5>
              <div className="recipients-scroll">
                {recipients.map((rec, index) => (
                  <div 
                    key={rec.id} 
                    className={`recipient-row-item ${currentSendingIndex === index ? 'active-sending' : ''}`}
                  >
                    <div className="recipient-details">
                      <span className="name">{rec.name}</span>
                      <span className="email">{rec.email}</span>
                    </div>
                    
                    <div className="recipient-status">
                      {rec.status === 'pending' && <span className="badge badge-pending">Pendiente</span>}
                      {rec.status === 'sending' && <span className="badge badge-sending spinner-small"></span>}
                      {rec.status === 'sent' && <span className="badge badge-sent">Enviado</span>}
                      {rec.status === 'error' && (
                        <span className="badge badge-error" title={rec.errorMsg}>
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      <style jsx>{`
        .email-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .email-modal {
          background: var(--bg-primary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1050px;
          height: 85vh;
          max-height: 800px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          overflow: hidden;
        }

        .email-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--panel-border);
        }

        .email-modal-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .email-modal-header .subtitle {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 28px;
          cursor: pointer;
          transition: var(--transition-fast);
          line-height: 1;
        }

        .btn-close:hover {
          color: var(--text-primary);
        }

        .email-modal-content {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          height: calc(100% - 81px);
          overflow: hidden;
        }

        /* Left Pane (Editor) */
        .email-left-pane {
          border-right: 1px solid var(--panel-border);
          display: flex;
          flex-direction: column;
          padding: 20px;
          overflow-y: auto;
        }

        .tab-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 10px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          padding: 6px 12px;
          cursor: pointer;
          position: relative;
          transition: var(--transition-fast);
        }

        .tab-btn.active {
          color: var(--text-primary);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -11px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--text-primary);
        }

        .editor-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input, .form-group textarea {
          background: var(--bg-secondary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          padding: 10px 14px;
          font-family: var(--font-sans);
          font-size: 14px;
          transition: var(--transition-fast);
        }

        .form-group input:focus, .form-group textarea:focus {
          border-color: var(--text-primary);
          outline: none;
        }

        .variables-helper {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }

        .helper-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 8px;
        }

        .variables-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .variables-tags button {
          background: var(--bg-tertiary);
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          color: var(--text-primary);
          padding: 4px 8px;
          font-family: monospace;
          font-size: 12px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .variables-tags button:hover {
          background: var(--text-primary);
          color: var(--bg-primary);
        }

        .helper-desc {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* Preview Pane */
        .preview-pane {
          background: #ffffff;
          color: #222222;
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          min-height: 350px;
          font-family: sans-serif;
        }

        .preview-header {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: #4a5568;
        }

        .preview-body {
          flex: 1;
          overflow-y: auto;
          white-space: pre-wrap;
          font-size: 15px;
          color: #2d3748;
        }

        .preview-body p {
          margin-bottom: 12px;
        }

        .preview-note {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          border: 1px solid var(--panel-border);
        }

        /* Right Pane (Recipients & controls) */
        .email-right-pane {
          display: flex;
          flex-direction: column;
          padding: 20px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.01);
        }

        .campaign-summary {
          margin-bottom: 20px;
        }

        .campaign-summary h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-num {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .stat-card.highlighted {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .stat-card.success .stat-num {
          color: var(--accent-success);
        }

        .controls-section {
          border: 1px solid var(--panel-border);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 20px;
        }

        .alert-no-emails {
          color: var(--accent-warning);
          font-size: 13px;
          text-align: center;
          line-height: 1.5;
        }

        .progress-container {
          margin-bottom: 16px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .progress-bar-bg {
          background: var(--bg-tertiary);
          height: 6px;
          border-radius: 3px;
          overflow: hidden;
          width: 100%;
        }

        .progress-bar-fill {
          background: var(--text-primary);
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .actions-row {
          display: flex;
          justify-content: center;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition-fast);
          width: 100%;
          border: none;
        }

        .btn-send-start {
          background: var(--accent-primary);
          color: var(--accent-primary-text);
        }

        .btn-send-start:hover {
          opacity: 0.9;
        }

        .btn-send-pause {
          background: var(--accent-danger);
          color: var(--text-primary);
        }

        .btn-send-pause:hover {
          opacity: 0.9;
        }

        /* Recipients List scroll */
        .recipients-list-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .recipients-list-container h5 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .recipients-scroll {
          flex: 1;
          overflow-y: auto;
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }

        .recipient-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--panel-border);
          font-size: 13px;
          transition: var(--transition-fast);
        }

        .recipient-row-item:last-child {
          border-bottom: none;
        }

        .recipient-row-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .recipient-row-item.active-sending {
          background: rgba(255, 255, 255, 0.05);
          border-left: 2px solid var(--text-primary);
        }

        .recipient-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-width: 70%;
        }

        .recipient-details .name {
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recipient-details .email {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recipient-status {
          display: flex;
          align-items: center;
        }

        .badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .badge-pending {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--panel-border);
        }

        .badge-sending {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .badge-sent {
          background: rgba(23, 201, 100, 0.15);
          color: var(--accent-success);
          border: 1px solid rgba(23, 201, 100, 0.2);
        }

        .badge-error {
          background: rgba(243, 18, 96, 0.15);
          color: var(--accent-danger);
          border: 1px solid rgba(243, 18, 96, 0.2);
          cursor: help;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border-color);
          border-radius: 50%;
          border-top-color: var(--text-primary);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
