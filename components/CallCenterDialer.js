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
          <button className="btn-close" onClick={onClose}>✕ Cerrar</button>
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
                  <a href={`tel:${cleanPhone(currentCompany.phone)}`} className="btn-call">
                    📞 Llamar Ahora
                  </a>
                </>
              ) : (
                <div className="no-phone">Sin número de teléfono</div>
              )}
            </div>

            <div className="other-contacts">
              {currentCompany.email && (
                <a href={`mailto:${currentCompany.email}`} className="contact-link">✉️ {currentCompany.email}</a>
              )}
              {currentCompany.website && (
                <a href={currentCompany.website.startsWith('http') ? currentCompany.website : `https://${currentCompany.website}`} target="_blank" rel="noopener noreferrer" className="contact-link">🌐 {currentCompany.website}</a>
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
                <option value="Pendiente">⏳ Pendiente</option>
                <option value="No contestó">📴 No contestó</option>
                <option value="Contactado - Sin interés">❌ Sin interés</option>
                <option value="Contactado - Interesado">🤝 Interesado</option>
              </select>
            </div>

            <div className="notes-section">
              <label>Notas de Seguimiento:</label>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Escribe el resultado de la llamada..."
                rows={6}
              />
              <button onClick={saveNotes} className="btn-save-notes">Guardar Nota</button>
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
        .indicator.contacted.active {
          background: #34d399;
        }
      `}</style>
    </div>
  );
}
