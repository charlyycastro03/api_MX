'use client';
import { useState } from 'react';

export default function BusinessTable({ 
  companies = [], 
  portfolios = [], 
  savedCompanyIds = new Set(), 
  onSaveToPortfolio = () => {}, 
  onSelectCompany = () => {},
  loading = false
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [savingId, setSavingId] = useState(null);
  const [selectedPortfolioForCompany, setSelectedPortfolioForCompany] = useState({});

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = companies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(companies.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSave = async (company, id) => {
    const portId = selectedPortfolioForCompany[id];
    if (!portId) {
      alert('Por favor selecciona un portafolio.');
      return;
    }
    setSavingId(id);
    await onSaveToPortfolio(company, portId);
    setSavingId(null);
  };

  const handlePortfolioSelect = (companyId, portfolioId) => {
    setSelectedPortfolioForCompany(prev => ({
      ...prev,
      [companyId]: portfolioId
    }));
  };

  const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  const exportToCSV = () => {
    if (companies.length === 0) return;

    const headers = ['ID', 'Nombre', 'Razón Social', 'Actividad', 'Teléfono', 'Email', 'Sitio Web', 'Dirección', 'Estrato'];
    
    const rows = companies.map(comp => {
      const id = comp.Id || comp.id || comp.denue_id || comp.ID || '';
      const name = comp.Nombre || comp.name || '';
      const reason = comp.RazonSocial || '';
      const activity = comp.ClaseActividad || comp.activity || '';
      const phone = comp.Telefono || comp.phone || '';
      const email = comp.CorreoElectronico || comp.email || '';
      const website = comp.SitioInternet || comp.website || '';
      const address = comp.address || comp.Ubicacion || `${comp.Calle || ''} ${comp.NumExterior || ''}, ${comp.Colonia || ''}, ${comp.Municipio || ''}, ${comp.Entidad || ''}`;
      const estrato = comp.Estrato || comp.estrato || '';

      return [
        `"${id}"`,
        `"${name.replace(/"/g, '""')}"`,
        `"${reason.replace(/"/g, '""')}"`,
        `"${activity.replace(/"/g, '""')}"`,
        `"${phone}"`,
        `"${email}"`,
        `"${website}"`,
        `"${address.replace(/"/g, '""')}"`,
        `"${estrato}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `empresas_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="table-loading-state">
        <div className="spinner"></div>
        <p>Buscando empresas en la API del INEGI...</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="table-empty-state">
        <p>No se encontraron resultados. Intenta buscar otra palabra clave, cambiar el estado o verificar tu token.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-actions-header">
        <button onClick={exportToCSV} className="btn-action btn-secondary btn-export">
          Exportar a CSV
        </button>
      </div>
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Actividad</th>
              <th>Ubicación</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((comp) => {
              const id = comp.Id || comp.id || comp.denue_id || comp.ID;
              const name = comp.Nombre || comp.name || comp.RazonSocial;
              const activity = comp.ClaseActividad || comp.activity || 'No especificada';
              const phone = comp.Telefono || comp.phone || '';
              const email = comp.CorreoElectronico || comp.email || '';
              const website = comp.SitioInternet || comp.website || '';
              const address = comp.address || comp.Ubicacion || `${comp.Calle || ''} ${comp.NumExterior || ''}, ${comp.Colonia || ''}, ${comp.Municipio || ''}, ${comp.Entidad || ''}`;
              
              const isSaved = savedCompanyIds.has(String(id));

              return (
                <tr key={id} className="table-row-interactive">
                  <td className="company-info-cell">
                    <div className="company-name">{name}</div>
                    {comp.RazonSocial && comp.RazonSocial !== name && (
                      <div className="company-reason">{comp.RazonSocial}</div>
                    )}
                    <span className="estrato-badge">{comp.Estrato || comp.estrato || '1-5 personas'}</span>
                  </td>
                  <td className="activity-cell">{activity}</td>
                  <td className="address-cell">
                    <span className="address-text">{address}</span>
                  </td>
                  <td className="contact-cell">
                    {phone && (
                      <a href={`tel:${cleanPhone(phone)}`} className="contact-link phone-link">
                        Tel: {phone}
                      </a>
                    )}
                    {email && (
                      <a href={`mailto:${email}`} className="contact-link email-link">
                        Email: {email}
                      </a>
                    )}
                    {website && (
                      <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="contact-link web-link">
                        Sitio Web
                      </a>
                    )}
                    {!phone && !email && !website && <span className="text-muted">Sin datos de contacto</span>}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons-group">
                      <button 
                        onClick={() => onSelectCompany(comp)} 
                        className="btn-action btn-secondary"
                        title="Ver en Mapa"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Ubicar
                      </button>
                      
                      {isSaved ? (
                        <span className="saved-indicator">Guardado</span>
                      ) : (
                        <div className="save-form-inline">
                          <select
                            value={selectedPortfolioForCompany[id] || ''}
                            onChange={(e) => handlePortfolioSelect(id, e.target.value)}
                            className="select-portfolio"
                          >
                            <option value="">-- Guardar en... --</option>
                            {portfolios.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSave(comp, id)}
                            disabled={savingId === id || !selectedPortfolioForCompany[id]}
                            className="btn-action btn-primary"
                          >
                            {savingId === id ? '...' : 'Guardar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards-list mobile-only">
        {currentItems.map((comp) => {
          const id = comp.Id || comp.id || comp.denue_id || comp.ID;
          const name = comp.Nombre || comp.name || comp.RazonSocial;
          const activity = comp.ClaseActividad || comp.activity || 'No especificada';
          const phone = comp.Telefono || comp.phone || '';
          const email = comp.CorreoElectronico || comp.email || '';
          const website = comp.SitioInternet || comp.website || '';
          const address = comp.address || comp.Ubicacion || `${comp.Calle || ''} ${comp.NumExterior || ''}, ${comp.Colonia || ''}, ${comp.Municipio || ''}, ${comp.Entidad || ''}`;
          
          const isSaved = savedCompanyIds.has(String(id));

          return (
            <div key={id} className="mobile-business-card glass-panel">
              <div className="card-header-main">
                <div className="name-section">
                  <div className="mobile-company-name">{name}</div>
                  {comp.RazonSocial && comp.RazonSocial !== name && (
                    <div className="mobile-company-reason">{comp.RazonSocial}</div>
                  )}
                  <span className="estrato-badge">{comp.Estrato || comp.estrato || '1-5 personas'}</span>
                </div>
                <button 
                  onClick={() => onSelectCompany(comp)} 
                  className="mobile-locate-btn"
                  title="Ver en Mapa"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </button>
              </div>

              <div className="card-details">
                <div className="detail-row">
                  <span className="detail-label">Actividad:</span>
                  <span className="detail-value">{activity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Dirección:</span>
                  <span className="detail-value address-value">{address}</span>
                </div>
              </div>

              {(phone || email || website) ? (
                <div className="mobile-contact-actions">
                  {phone && (
                    <a href={`tel:${cleanPhone(phone)}`} className="mobile-action-link phone">
                      Llamar
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="mobile-action-link email">
                      Correo
                    </a>
                  )}
                  {website && (
                    <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="mobile-action-link web">
                      Web
                    </a>
                  )}
                </div>
              ) : (
                <div className="no-contact-info">Sin datos de contacto</div>
              )}

              <div className="card-footer-actions">
                {isSaved ? (
                  <span className="mobile-saved-badge">Guardado</span>
                ) : (
                  <div className="mobile-save-group">
                    <select
                      value={selectedPortfolioForCompany[id] || ''}
                      onChange={(e) => handlePortfolioSelect(id, e.target.value)}
                      className="mobile-select-portfolio"
                    >
                      <option value="">Guardar en...</option>
                      {portfolios.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSave(comp, id)}
                      disabled={savingId === id || !selectedPortfolioForCompany[id]}
                      className="mobile-save-btn btn-primary"
                    >
                      {savingId === id ? '...' : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Anterior
          </button>
          
          <div className="pagination-info">
            Página <strong>{currentPage}</strong> de {totalPages} ({companies.length} resultados)
          </div>

          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Siguiente
          </button>
        </div>
      )}

      <style jsx>{`
        .table-wrapper {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .table-actions-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 5px;
        }
        .btn-export {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .btn-export:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
        }
        
        .desktop-only {
          display: block;
        }
        .mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }
          .mobile-only {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .mobile-business-card {
            background: rgba(18, 25, 45, 0.4);
            border: 1px solid var(--panel-border);
            border-radius: var(--radius-md);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
            width: 100%;
            overflow: hidden;
          }

          .card-header-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
          }

          .mobile-company-name {
            font-size: 14.5px;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1.3;
            word-wrap: break-word;
            word-break: break-word;
          }

          .mobile-company-reason {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 2px;
          }

          .mobile-locate-btn {
            background: var(--bg-tertiary);
            border: 1px solid var(--panel-border);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            flex-shrink: 0;
            box-shadow: var(--shadow-sm);
            transition: var(--transition-fast);
          }
          
          .mobile-locate-btn:active {
            transform: scale(0.9);
            background: var(--accent-secondary);
          }

          .card-details {
            font-size: 12.5px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            padding-top: 10px;
          }

          .detail-row {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .detail-label {
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .detail-value {
            color: var(--text-primary);
          }

          .address-value {
            color: var(--text-secondary);
            line-height: 1.4;
            word-wrap: break-word;
            word-break: break-word;
          }

          .mobile-contact-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 4px;
          }

          .mobile-action-link {
            flex: 1;
            min-width: 80px;
            text-align: center;
            padding: 9px 12px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--panel-border);
          }

          .mobile-action-link:active {
            background: var(--accent-secondary);
          }

          .no-contact-info {
            font-size: 11.5px;
            color: var(--text-muted);
            text-align: center;
            padding: 8px;
            background: rgba(255, 255, 255, 0.01);
            border-radius: var(--radius-sm);
            border: 1px dashed var(--panel-border);
          }

          .card-footer-actions {
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            padding-top: 12px;
            margin-top: 4px;
          }

          .mobile-saved-badge {
            display: block;
            text-align: center;
            font-size: 12px;
            color: var(--accent-success);
            font-weight: 600;
            background: rgba(16, 185, 129, 0.1);
            padding: 8px;
            border-radius: var(--radius-sm);
            border: 1px solid rgba(16, 185, 129, 0.2);
          }

          .mobile-save-group {
            display: flex;
            gap: 8px;
            width: 100%;
          }

          .mobile-select-portfolio {
            flex: 1;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--panel-border);
            border-radius: var(--radius-sm);
            padding: 10px;
            font-size: 12px;
            outline: none;
          }

          .mobile-save-btn {
            padding: 10px 16px;
            font-size: 12px;
            font-weight: 700;
            border-radius: var(--radius-sm);
            border: none;
            cursor: pointer;
            transition: var(--transition-fast);
          }
          .mobile-save-btn:active {
            transform: scale(0.95);
          }
        }

        .table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: var(--radius-md);
          border: 1px solid var(--panel-border);
          background: rgba(12, 18, 34, 0.4);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13.5px;
        }

        th {
          background: var(--bg-tertiary);
          padding: 14px 18px;
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--panel-border);
        }
        td {
          padding: 16px 18px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
          color: var(--text-primary);
        }
        .table-row-interactive:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .company-info-cell {
          max-width: 250px;
        }
        .company-name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 3px;
        }
        .company-reason {
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .estrato-badge {
          display: inline-block;
          font-size: 10px;
          padding: 2px 6px;
          background: var(--bg-tertiary);
          color: var(--accent-primary);
          border-radius: 4px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          font-weight: 500;
        }
        .activity-cell {
          color: var(--text-secondary);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .address-cell {
          max-width: 220px;
        }
        .address-text {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .contact-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }
        .contact-link {
          font-size: 12px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .contact-link:hover {
          color: var(--accent-primary);
          transform: translateX(2px);
        }
        .phone-link {
          font-weight: 500;
          color: #f8fafc;
        }
        .actions-cell {
          min-width: 230px;
        }
        .action-buttons-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-action {
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          border: 1px solid transparent;
        }
        .btn-primary {
          background: var(--accent-primary);
color: var(--accent-primary-text);
        }
        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }
        .btn-primary:disabled {
          background: var(--bg-tertiary);
          color: var(--text-muted);
          cursor: not-allowed;
        }
        .btn-secondary {
          background: transparent;
          color: var(--text-primary);
          border-color: var(--panel-border);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--text-secondary);
        }
        .save-form-inline {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .select-portfolio {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          padding: 7px 10px;
          font-size: 12px;
          outline: none;
          max-width: 140px;
          cursor: pointer;
        }
        .select-portfolio:focus {
          border-color: var(--accent-primary);
        }
        .saved-indicator {
          font-size: 12px;
          color: var(--accent-success);
          font-weight: 600;
          background: rgba(16, 185, 129, 0.1);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .table-loading-state, .table-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 60px 20px;
          text-align: center;
          border-radius: var(--radius-md);
          border: 1px solid var(--panel-border);
          background: rgba(12, 18, 34, 0.4);
          color: var(--text-secondary);
        }
        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 5px;
        }
        .pagination-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pagination-info {
          font-size: 13px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
