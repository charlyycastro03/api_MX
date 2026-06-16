import { useState, useEffect } from 'react';
import CallCenterDialer from './CallCenterDialer';

export default function PortfolioManager({
  portfolios = [],
  onAddPortfolio = () => {},
  onDeletePortfolio = () => {},
  onSelectCompany = () => {}
}) {
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNotes, setTempNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterActivity, setFilterActivity] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Dialer state
  const [showDialer, setShowDialer] = useState(false);
  const [dialerCompanies, setDialerCompanies] = useState([]);

  // Set initial selected portfolio if none selected and portfolios exist
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  // Fetch companies for selected portfolio
  useEffect(() => {
    if (!selectedPortfolioId) {
      setCompanies([]);
      return;
    }

    async function fetchCompanies() {
      setLoadingCompanies(true);
      try {
        const queryParams = new URLSearchParams({ portfolioId: selectedPortfolioId });
        if (filterStatus && filterStatus !== 'Todos') queryParams.append('status', filterStatus);
        if (filterActivity) queryParams.append('activity', filterActivity);
        if (filterStartDate) queryParams.append('startDate', filterStartDate);
        if (filterEndDate) queryParams.append('endDate', filterEndDate);

        const res = await fetch(`/api/companies?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Error al obtener empresas');
        const data = await res.json();
        setCompanies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCompanies(false);
      }
    }

    fetchCompanies();
  }, [selectedPortfolioId, filterStatus, filterActivity, filterStartDate, filterEndDate]);

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;
    setCreating(true);
    const newPort = await onAddPortfolio(newPortfolioName.trim());
    if (newPort) {
      setNewPortfolioName('');
      setSelectedPortfolioId(newPort.id);
    }
    setCreating(false);
  };

  const handleDeletePortfolio = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este portafolio? Esto borrará todas las empresas guardadas en él.')) {
      return;
    }
    await onDeletePortfolio(id);
    if (selectedPortfolioId === id) {
      setSelectedPortfolioId(portfolios.length > 1 ? portfolios.find(p => p.id !== id)?.id : null);
    }
  };

  const handleUpdateCompany = async (companyId, fields) => {
    try {
      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: companyId, ...fields })
      });
      if (!res.ok) throw new Error('Error al actualizar');
      
      // Update local state
      setCompanies(prev => prev.map(c => {
        if (c.id === companyId) {
          return { ...c, ...fields };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios en la base de datos.');
    }
  };

  const handleCallStatusChange = (companyId, newStatus) => {
    handleUpdateCompany(companyId, { callStatus: newStatus });
  };

  const handleStartEditingNotes = (companyId, currentNotes) => {
    setEditingNotesId(companyId);
    setTempNotes(currentNotes || '');
  };

  const handleSaveNotes = async (companyId) => {
    await handleUpdateCompany(companyId, { notes: tempNotes });
    setEditingNotesId(null);
  };

  const handleDeleteCompany = async (companyId) => {
    if (!confirm('¿Deseas eliminar esta empresa del portafolio?')) return;
    try {
      const res = await fetch(`/api/companies?id=${companyId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setCompanies(prev => prev.filter(c => c.id !== companyId));
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la empresa.');
    }
  };

  const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  const exportToCSV = () => {
    if (companies.length === 0) return;

    const portfolioName = portfolios.find(p => p.id === selectedPortfolioId)?.name || 'Portafolio';
    const headers = ['ID', 'Nombre', 'Actividad', 'Teléfono', 'Email', 'Sitio Web', 'Dirección', 'Estado Llamada', 'Notas'];
    
    const rows = companies.map(comp => {
      const id = comp.id || comp.denue_id || '';
      const name = comp.name || '';
      const activity = comp.activity || '';
      const phone = comp.phone || '';
      const email = comp.email || '';
      const website = comp.website || '';
      const address = comp.address || '';
      const callStatus = comp.call_status || '';
      const notes = comp.notes || '';

      return [
        `"${id}"`,
        `"${name.replace(/"/g, '""')}"`,
        `"${activity.replace(/"/g, '""')}"`,
        `"${phone}"`,
        `"${email}"`,
        `"${website}"`,
        `"${address.replace(/"/g, '""')}"`,
        `"${callStatus}"`,
        `"${notes.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${portfolioName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Contactado - Interesado': return 'status-interested';
      case 'Contactado - Sin interés': return 'status-not-interested';
      case 'No contestó': return 'status-no-answer';
      default: return 'status-pending';
    }
  };

  const handleOpenDialer = (onlyWithContact) => {
    let listToDial = companies;
    if (onlyWithContact) {
      listToDial = companies.filter(c => (c.phone && c.phone.trim() !== '') || (c.email && c.email.trim() !== ''));
      if (listToDial.length === 0) {
        alert("No hay empresas con teléfono o correo en este portafolio con los filtros actuales.");
        return;
      }
    }
    setDialerCompanies(listToDial);
    setShowDialer(true);
  };

  return (
    <div className="crm-container">
      {/* Sidebar - Portfolios List */}
      <div className="crm-sidebar glass-panel">
        <h3 className="section-title">Portafolios</h3>
        
        <form onSubmit={handleCreatePortfolio} className="add-portfolio-form">
          <input
            type="text"
            placeholder="Nuevo portafolio..."
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newPortfolioName.trim()}>
            +
          </button>
        </form>

        <ul className="portfolio-list">
          {portfolios.map((port) => (
            <li 
              key={port.id} 
              className={`portfolio-item ${selectedPortfolioId === port.id ? 'active' : ''}`}
              onClick={() => setSelectedPortfolioId(port.id)}
            >
              <span className="portfolio-name">{port.name}</span>
              <div className="portfolio-badge-group">
                <span className="count-badge">{port.company_count}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePortfolio(port.id);
                  }}
                  className="btn-delete-port"
                  title="Eliminar Portafolio"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
          {portfolios.length === 0 && (
            <div className="empty-portfolios">No tienes portafolios creados. Escribe un nombre arriba para crear el primero.</div>
          )}
        </ul>
      </div>

      {/* Main Panel - Saved Companies / CRM list */}
      <div className="crm-main-panel glass-panel">
        {selectedPortfolioId ? (
          <>
            <div className="panel-header">
              <div className="header-title-group">
                <h2>
                  {portfolios.find(p => p.id === selectedPortfolioId)?.name || 'Portafolio'}
                </h2>
                <span className="subtitle">Llamadas y seguimiento de prospectos</span>
              </div>
              <button 
                onClick={exportToCSV} 
                className="btn-action btn-secondary btn-export" 
                disabled={companies.length === 0}
                title="Exportar a Excel"
              >
                📥 Exportar a CSV
              </button>
              <button 
                onClick={() => handleOpenDialer(false)} 
                className="btn-action btn-primary btn-dialer"
                disabled={companies.length === 0}
              >
                📞 Call Center (Todos)
              </button>
              <button 
                onClick={() => handleOpenDialer(true)} 
                className="btn-action btn-primary btn-dialer"
                disabled={companies.length === 0}
                title="Solo prospectos con teléfono o email"
              >
                📱 Call Center (Con Contacto)
              </button>
            </div>

            {/* Filters Bar */}
            <div className="crm-filters-bar glass-panel">
              <div className="filter-group">
                <label>Estatus:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="No contestó">No contestó</option>
                  <option value="Contactado - Sin interés">Sin interés</option>
                  <option value="Contactado - Interesado">Interesado</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Giro Comercial:</label>
                <input 
                  type="text" 
                  placeholder="Ej. restaurante" 
                  value={filterActivity} 
                  onChange={(e) => setFilterActivity(e.target.value)} 
                />
              </div>
              <div className="filter-group">
                <label>Desde:</label>
                <input 
                  type="date" 
                  value={filterStartDate} 
                  onChange={(e) => setFilterStartDate(e.target.value)} 
                />
              </div>
              <div className="filter-group">
                <label>Hasta:</label>
                <input 
                  type="date" 
                  value={filterEndDate} 
                  onChange={(e) => setFilterEndDate(e.target.value)} 
                />
              </div>
            </div>

            {loadingCompanies ? (
              <div className="panel-loading">
                <div className="spinner"></div>
                <p>Cargando prospectos...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="panel-empty">
                <div className="empty-icon">📁</div>
                <p>Este portafolio está vacío.</p>
                <span className="help-text">Realiza una búsqueda de empresas en la API y utiliza la opción "Guardar" para añadirlas aquí.</span>
              </div>
            ) : (
              <div className="crm-list">
                {companies.map((company) => (
                  <div key={company.id} className="crm-card">
                    <div className="crm-card-header">
                      <div className="company-meta">
                        <h3>{company.name}</h3>
                        <span className="activity-tag">{company.activity}</span>
                        {company.address && <p className="address-sub">{company.address}</p>}
                      </div>
                      <div className="crm-card-actions">
                        <button 
                          onClick={() => onSelectCompany(company)}
                          className="btn-icon btn-locate"
                          title="Ubicar en Mapa"
                        >
                          📍
                        </button>
                        <button 
                          onClick={() => handleDeleteCompany(company.id)}
                          className="btn-icon btn-delete-company"
                          title="Eliminar de la lista"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="crm-card-body">
                      {/* Contacts details */}
                      <div className="contact-details">
                        {company.phone && (
                          <div className="contact-item">
                            <span className="label">Teléfono:</span>
                            <a href={`tel:${cleanPhone(company.phone)}`} className="phone-tag">
                              📞 {company.phone}
                            </a>
                          </div>
                        )}
                        {company.email && (
                          <div className="contact-item">
                            <span className="label">Correo:</span>
                            <a href={`mailto:${company.email}`} className="email-tag">
                              ✉️ {company.email}
                            </a>
                          </div>
                        )}
                        {company.website && (
                          <div className="contact-item">
                            <span className="label">Web:</span>
                            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="web-tag">
                              🌐 {company.website}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* CRM Status & Notes */}
                      <div className="crm-flow">
                        <div className="status-selector">
                          <label className="label">Estado de Llamada:</label>
                          <select
                            value={company.call_status}
                            onChange={(e) => handleCallStatusChange(company.id, e.target.value)}
                            className={`select-status ${getStatusClass(company.call_status)}`}
                          >
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="No contestó">📴 No contestó</option>
                            <option value="Contactado - Sin interés">❌ Sin interés</option>
                            <option value="Contactado - Interesado">🤝 Interesado</option>
                          </select>
                        </div>

                        <div className="notes-editor">
                          <label className="label">Notas de Seguimiento:</label>
                          {editingNotesId === company.id ? (
                            <div className="notes-editing-box">
                              <textarea
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="Escribe el resultado de la llamada..."
                                rows={3}
                                autoFocus
                              />
                              <div className="notes-editing-actions">
                                <button 
                                  onClick={() => handleSaveNotes(company.id)}
                                  className="btn-save-notes"
                                >
                                  Guardar Nota
                                </button>
                                <button 
                                  onClick={() => setEditingNotesId(null)}
                                  className="btn-cancel-notes"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="notes-display-box"
                              onClick={() => handleStartEditingNotes(company.id, company.notes)}
                            >
                              {company.notes ? (
                                <p className="notes-text">{company.notes}</p>
                              ) : (
                                <span className="notes-placeholder">Haz clic para agregar notas de seguimiento...</span>
                              )}
                              <span className="edit-hint">✏️ Editar</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="panel-empty">
            <div className="empty-icon">📁</div>
            <p>No hay ningún portafolio seleccionado.</p>
            <span className="help-text">Crea un portafolio en la barra lateral para comenzar a prospectar.</span>
          </div>
        )}
      </div>

      {showDialer && (
        <CallCenterDialer 
          companies={dialerCompanies} 
          onClose={() => setShowDialer(false)} 
          onUpdateCompany={handleUpdateCompany} 
        />
      )}

      <style jsx>{`
        .crm-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          align-items: start;
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .crm-sidebar {
          padding: 20px;
          min-height: 500px;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }
        .crm-main-panel {
          padding: 25px;
          min-height: 500px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }
        .section-title {
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          margin-bottom: 15px;
          font-weight: 700;
        }
        .add-portfolio-form {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .add-portfolio-form input {
          flex: 1;
          background: var(--bg-tertiary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .add-portfolio-form input:focus {
          border-color: var(--accent-primary);
        }
        .add-portfolio-form button {
          background: var(--accent-primary);
color: var(--accent-primary-text);
          border: none;
          border-radius: var(--radius-sm);
          width: 34px;
          height: 34px;
          font-size: 18px;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .add-portfolio-form button:hover:not(:disabled) {
          background: #4f46e5;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }
        .portfolio-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .portfolio-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          border: 1px solid transparent;
        }
        .portfolio-item:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: var(--panel-border);
        }
        .portfolio-item.active {
          background: var(--accent-primary-glow);
          border-color: rgba(99, 102, 241, 0.3);
          color: var(--text-primary);
        }
        .portfolio-name {
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }
        .portfolio-badge-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .count-badge {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .btn-delete-port {
          background: transparent;
          color: var(--text-muted);
          border: none;
          cursor: pointer;
          font-size: 10px;
          padding: 2px;
          transition: var(--transition-fast);
          opacity: 0;
        }
        .portfolio-item:hover .btn-delete-port {
          opacity: 1;
        }
        .btn-delete-port:hover {
          color: var(--accent-danger);
        }
        .empty-portfolios {
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
          padding: 20px 10px;
          line-height: 1.4;
        }
        
        /* Main CRM Panel */
        .panel-header {
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 15px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header-title-group {
          display: flex;
          flex-direction: column;
        }
        .panel-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .panel-header .subtitle {
          font-size: 12.5px;
          color: var(--text-secondary);
        }
        .btn-export {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .btn-export:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
        }
        .btn-export:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-dialer {
          margin-left: 10px;
          background: var(--accent-primary);
color: var(--accent-primary-text);
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: none;
          transition: var(--transition-fast);
        }
        .btn-dialer:hover:not(:disabled) {
          background: #4f46e5;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }
        .btn-dialer:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .crm-filters-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--panel-border);
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
          min-width: 140px;
        }
        .filter-group label {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .filter-group input, .filter-group select {
          background: var(--bg-tertiary);
          border: 1px solid var(--panel-border);
          color: var(--text-primary);
          padding: 8px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          outline: none;
        }
        .filter-group input:focus, .filter-group select:focus {
          border-color: var(--accent-primary);
        }
        .panel-loading, .panel-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
          flex: 1;
          color: var(--text-secondary);
        }
        .empty-icon {
          font-size: 40px;
          margin-bottom: 15px;
        }
        .panel-empty p {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 6px;
          color: var(--text-primary);
        }
        .help-text {
          font-size: 12px;
          color: var(--text-muted);
          max-width: 300px;
          line-height: 1.4;
        }
        
        /* CRM Cards */
        .crm-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .crm-card {
          background: rgba(18, 25, 45, 0.4);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          padding: 18px;
          transition: var(--transition-normal);
        }
        .crm-card:hover {
          border-color: rgba(99, 102, 241, 0.2);
          background: rgba(18, 25, 45, 0.6);
        }
        .crm-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .company-meta h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .activity-tag {
          font-size: 10px;
          padding: 2px 6px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border-radius: 4px;
          font-weight: 500;
          display: inline-block;
          margin-bottom: 6px;
        }
        .address-sub {
          font-size: 11px;
          color: var(--text-muted);
        }
        .crm-card-actions {
          display: flex;
          gap: 6px;
        }
        .btn-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--panel-border);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: var(--transition-fast);
        }
        .btn-locate:hover {
          background: var(--accent-primary-glow);
          border-color: var(--accent-primary);
        }
        .btn-delete-company:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--accent-danger);
          color: var(--accent-danger);
        }
        
        /* Contacts block */
        .contact-details {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 15px;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .contact-item .label {
          color: var(--text-muted);
        }
        .phone-tag, .email-tag, .web-tag {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          transition: var(--transition-fast);
        }
        .phone-tag:hover, .email-tag:hover, .web-tag:hover {
          color: var(--accent-primary);
        }

        /* CRM logic block */
        .crm-flow {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 20px;
          background: rgba(7, 10, 19, 0.4);
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }
        .label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 6px;
          font-weight: 600;
        }
        .select-status {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12.5px;
          width: 100%;
          cursor: pointer;
          outline: none;
          font-weight: 600;
        }
        .status-pending { border-left: 4px solid var(--text-muted); }
        .status-no-answer { border-left: 4px solid var(--accent-warning); }
        .status-not-interested { border-left: 4px solid var(--accent-danger); }
        .status-interested { border-left: 4px solid var(--accent-success); }
        
        /* Notes block */
        .notes-display-box {
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed var(--panel-border);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          min-height: 48px;
          cursor: pointer;
          position: relative;
          transition: var(--transition-fast);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .notes-display-box:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--text-muted);
        }
        .notes-text {
          font-size: 12.5px;
          color: var(--text-primary);
          line-height: 1.4;
          padding-right: 40px;
        }
        .notes-placeholder {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }
        .edit-hint {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          color: var(--text-muted);
          opacity: 0;
          transition: var(--transition-fast);
        }
        .notes-display-box:hover .edit-hint {
          opacity: 1;
        }
        .notes-editing-box textarea {
          width: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--accent-primary);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12.5px;
          outline: none;
          resize: vertical;
          font-family: inherit;
        }
        .notes-editing-actions {
          display: flex;
          gap: 8px;
          margin-top: 6px;
        }
        .btn-save-notes {
          background: var(--accent-primary);
color: var(--accent-primary-text);
          border: none;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .btn-save-notes:hover {
          background: #4f46e5;
        }
        .btn-cancel-notes {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--panel-border);
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .btn-cancel-notes:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 768px) {
          .crm-container {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          .crm-sidebar {
            min-height: auto;
            padding: 15px;
            border-radius: var(--radius-md);
          }
          .portfolio-list {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 8px;
            gap: 8px;
            scrollbar-width: none;
          }
          .portfolio-list::-webkit-scrollbar {
            display: none;
          }
          .portfolio-item {
            flex-shrink: 0;
            padding: 8px 16px;
            border-radius: 20px;
            border: 1px solid var(--panel-border);
          }
          .portfolio-name {
            max-width: 110px;
          }
          .btn-delete-port {
            opacity: 1;
            margin-left: 4px;
          }
          .crm-main-panel {
            padding: 15px;
            min-height: auto;
            border-radius: var(--radius-md);
          }
          .panel-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          .panel-header h2 {
            font-size: 18px;
          }
          .btn-action {
            width: 100%;
            text-align: center;
          }
          .btn-export {
            margin-bottom: 4px;
          }
          .btn-dialer {
            margin-left: 0;
            margin-bottom: 4px;
          }
          .crm-filters-bar {
            flex-direction: column;
            gap: 10px;
            padding: 12px;
          }
          .filter-group {
            width: 100%;
            min-width: 100%;
          }
          .crm-card {
            padding: 14px;
          }
          .crm-card-header {
            align-items: flex-start;
          }
          .company-meta h3 {
            font-size: 14px;
          }
          .crm-flow {
            flex-direction: column;
            gap: 12px;
          }
          .status-selector, .notes-editor {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
