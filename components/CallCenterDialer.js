'use client';
import { useState, useEffect } from 'react';

export default function CallCenterDialer({ companies, onClose, onUpdateCompany }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => {
    if (companies.length > 0) {
      setTempNotes(companies[currentIndex]?.notes || '');
    }
  }, [currentIndex, companies]);

  if (!companies || companies.length === 0) return null;

  const currentCompany = companies[currentIndex];

  const handleNext = () => {
    if (currentIndex < companies.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  const saveNotes = () => {
    onUpdateCompany(currentCompany.id, { notes: tempNotes });
  };

  const handleStatusChange = (status) => {
    onUpdateCompany(currentCompany.id, { callStatus: status });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Contactado - Interesado': return 'status-interested';
      case 'Contactado - Sin interés': return 'status-not-interested';
      case 'No contestó': return 'status-no-answer';
      default: return 'status-pending';
    }
  };

  return (
    <div className="dialer-overlay">
      <div className="dialer-modal glass-panel">
        <div className="dialer-header">
          <div className="dialer-progress">
            Prospecto {currentIndex + 1} de {companies.length}
          </div>
          <button className="btn-close" onClick={onClose}>Cerrar</button>
        </div>

        <div className="dialer-content">
          <div className="dialer-left">
            <h2>{currentCompany.name}</h2>
            <div className="company-info-tags">
              <span className="tag">{currentCompany.activity}</span>
              {currentCompany.estrato && <span className="tag">{currentCompany.estrato}</span>}
            </div>
            
            <p className="address">{currentCompany.address}</p>

            <div className="dial-box">
              {currentCompany.phone ? (
                <>
                  <div className="phone-number">{currentCompany.phone}</div>
                  <a href={`tel:${cleanPhone(currentCompany.phone)}`} className="btn-call" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    Llamar Ahora
                  </a>
                </>
              ) : (
                <div className="no-phone">Sin número de teléfono</div>
              )}
            </div>

            <div className="other-contacts">
              {currentCompany.email && (
                <a href={`mailto:${currentCompany.email}`} className="contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#fb923c'}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Email: {currentCompany.email}
                </a>
              )}
              {currentCompany.website && (
                <a href={currentCompany.website.startsWith('http') ? currentCompany.website : `https://${currentCompany.website}`} target="_blank" rel="noopener noreferrer" className="contact-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#6366f1'}}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  Sitio Web: {currentCompany.website}
                </a>
              )}
            </div>
          </div>

          <div className="dialer-right">
            <div className="status-selector">
              <label>Resultado de la Llamada:</label>
              <select
                value={currentCompany.call_status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`select-status ${getStatusClass(currentCompany.call_status)}`}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="No contestó">No contestó</option>
                <option value="Contactado - Sin interés">Sin interés</option>
                <option value="Contactado - Interesado">Interesado</option>
              </select>
            </div>

            <div className="notes-section">
              <label>Notas de Seguimiento:</label>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Escribe el resultado de la llamada..."
                rows={6}
              />
            </div>
          </div>
        </div>

        <div className="dialer-footer">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="btn-nav">
            &laquo; Anterior
          </button>
          <div className="nav-indicators">
            {companies.map((_, idx) => (
              <span key={idx} className={`indicator ${idx === currentIndex ? 'active' : ''} ${companies[idx].call_status !== 'Pendiente' ? 'contacted' : ''}`} />
            ))}
          </div>
          <button onClick={handleNext} disabled={currentIndex === companies.length - 1} className="btn-nav btn-next">
            Siguiente &raquo;
          </button>
        </div>
      </div>

      <style jsx>{`
        .dialer-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .dialer-modal {
          background: var(--bg-primary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .dialer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 25px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--panel-border);
        }
        .dialer-progress {
          font-size: 14px;
          font-weight: 600;
          color: var(--accent-primary);
        }
        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .btn-close:hover {
          color: var(--text-primary);
        }
        
        .dialer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          padding: 30px;
        }
        
        .dialer-left h2 {
          font-size: 24px;
          margin-bottom: 10px;
          color: var(--text-primary);
        }
        .company-info-tags {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        .tag {
          background: var(--bg-tertiary);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
          border: 1px solid var(--panel-border);
        }
        .address {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 25px;
          line-height: 1.5;
        }
        
        .dial-box {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-md);
          padding: 25px;
          text-align: center;
          margin-bottom: 20px;
        }
        .phone-number {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--text-primary);
          margin-bottom: 15px;
        }
        .no-phone {
          font-size: 16px;
          color: var(--text-muted);
          font-style: italic;
        }
        .btn-call {
          display: inline-block;
          background: var(--accent-success);
          color: var(--text-primary);
          text-decoration: none;
          padding: 12px 25px;
          border-radius: var(--radius-sm);
          font-size: 16px;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .btn-call:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
        }
        
        .other-contacts {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .contact-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          transition: var(--transition-fast);
        }
        .contact-link:hover {
          color: var(--accent-primary);
        }
        
        .dialer-right {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .status-selector label, .notes-section label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          font-weight: 600;
        }
        .select-status {
          width: 100%;
          padding: 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 15px;
          outline: none;
          cursor: pointer;
        }
        .status-pending { border-left: 4px solid var(--text-muted); }
        .status-no-answer { border-left: 4px solid var(--accent-warning); }
        .status-not-interested { border-left: 4px solid var(--accent-danger); }
        .status-interested { border-left: 4px solid var(--accent-success); }
        
        .notes-section textarea {
          width: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          padding: 15px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          resize: vertical;
          margin-bottom: 10px;
          font-family: inherit;
        }
        .notes-section textarea:focus {
          border-color: var(--accent-primary);
        }
        .btn-save-notes {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--panel-border);
          padding: 10px 15px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: var(--transition-fast);
          width: 100%;
        }
        .btn-save-notes:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        
        .dialer-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid var(--panel-border);
        }
        .btn-nav {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--panel-border);
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .btn-nav:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .btn-nav:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-next {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .btn-next:hover:not(:disabled) {
          background: #4f46e5;
          color: var(--text-primary);
        }
        
        .nav-indicators {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          max-width: 300px;
          padding: 5px;
        }
        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--panel-border);
          flex-shrink: 0;
        }
        .indicator.active {
          background: var(--accent-primary);
          transform: scale(1.3);
        }
        .indicator.contacted {
          background: var(--accent-success);
        }
        @media (max-width: 768px) {
          .dialer-overlay {
            padding: 0;
            background: var(--bg-primary);
          }
          .dialer-modal {
            max-width: 100%;
            height: 100%;
            border-radius: 0;
            border: none;
          }
          .dialer-content {
            grid-template-columns: 1fr;
            padding: 20px;
            overflow-y: auto;
            gap: 20px;
            max-height: calc(100vh - 140px);
          }
          .phone-number {
            font-size: 28px;
          }
          .dial-box {
            padding: 15px;
          }
          .nav-indicators {
            max-width: 120px;
          }
          .dialer-footer {
            padding: 15px 20px;
            background: rgba(10, 10, 10, 0.95);
            border-top: 1px solid var(--panel-border);
          }
        }
      `}</style>
    </div>
  );
}
