import { useState, useEffect } from 'react';
import CallCenterDialer from './CallCenterDialer';
import BulkEmailModal from './BulkEmailModal';

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

  // Email Campaign States
  const [crmSubTab, setCrmSubTab] = useState('companies'); // 'companies' | 'campaigns'
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] = useState(null);
  const [campaignLogs, setCampaignLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterActivity, setFilterActivity] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Dialer state
  const [showDialer, setShowDialer] = useState(false);
  const [dialerCompanies, setDialerCompanies] = useState([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

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

  // Fetch campaigns when selectedPortfolioId, crmSubTab, or isEmailModalOpen closes
  useEffect(() => {
    if (!selectedPortfolioId || crmSubTab !== 'campaigns') {
      return;
    }

    async function fetchCampaigns() {
      setLoadingCampaigns(true);
      try {
        const res = await fetch(`/api/email/campaigns?portfolioId=${selectedPortfolioId}`);
        if (!res.ok) throw new Error('Error al obtener campañas');
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCampaigns(false);
      }
    }

    fetchCampaigns();
  }, [selectedPortfolioId, crmSubTab, isEmailModalOpen]);

  // Fetch logs when a campaign is selected for detailed view
  useEffect(() => {
    if (!selectedCampaignForDetail) {
      setCampaignLogs([]);
      return;
    }

    async function fetchLogs() {
      setLoadingLogs(true);
      try {
        const res = await fetch(`/api/email/campaigns?campaignId=${selectedCampaignForDetail.id}`);
        if (!res.ok) throw new Error('Error al obtener logs de la campaña');
        const data = await res.json();
        setCampaignLogs(data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLogs(false);
      }
    }

    fetchLogs();
  }, [selectedCampaignForDetail]);

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

  const renderStatusBadge = (status) => {
    let color = 'var(--text-muted)';
    let text = 'Pendiente';
    let dotColor = '#94a3b8';

    if (status === 'No contestó') {
      color = 'var(--accent-warning)';
      text = 'No contestó';
      dotColor = '#fb923c';
    } else if (status === 'Contactado - Sin interés') {
      color = 'var(--accent-danger)';
      text = 'Sin interés';
      dotColor = '#f87171';
    } else if (status === 'Contactado - Interesado') {
      color = 'var(--accent-success)';
      text = 'Interesado';
      dotColor = '#4ade80';
    }

    return (
      <span className="status-badge-indicator" style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        fontSize: '11px', 
        fontWeight: '600', 
        padding: '3px 8px', 
        borderRadius: '4px', 
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        color: color,
        marginTop: '4px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor }}></span>
        {text}
      </span>
    );
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
              <div className="header-actions">
                <button 
                  onClick={exportToCSV} 
                  className="btn-action btn-secondary btn-export" 
                  disabled={companies.length === 0}
                  title="Exportar a Excel"
                >
                  Exportar a CSV
                </button>
                <button 
                  onClick={() => handleOpenDialer(false)} 
                  className="btn-action btn-primary btn-dialer"
                  disabled={companies.length === 0}
                >
                  Call Center (Todos)
                </button>
                <button 
                  onClick={() => handleOpenDialer(true)} 
                  className="btn-action btn-primary btn-dialer"
                  disabled={companies.length === 0}
                  title="Solo prospectos con teléfono o email"
                >
                  Call Center (Con Contacto)
                </button>
                <button 
                  onClick={() => setIsEmailModalOpen(true)} 
                  className="btn-action btn-primary btn-email"
                  disabled={companies.length === 0}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Enviar Correo Masivo
                </button>
              </div>
            </div>

            {/* Sub-tabs switcher */}
            <div className="crm-subtabs">
              <button 
                className={`subtab-btn ${crmSubTab === 'companies' ? 'active' : ''}`}
                onClick={() => setCrmSubTab('companies')}
              >
                Prospectos Guardados
              </button>
              <button 
                className={`subtab-btn ${crmSubTab === 'campaigns' ? 'active' : ''}`}
                onClick={() => setCrmSubTab('campaigns')}
              >
                Historial de Campañas
              </button>
            </div>

            {crmSubTab === 'companies' ? (
              <>
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
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--text-muted)'}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <p>Este portafolio está vacío.</p>
                    <span className="help-text">Realiza una búsqueda de empresas en la API y utiliza la opción "Guardar" para añadirlas aquí.</span>
                  </div>
                ) : (
                  <div className="crm-list">
                    {companies.map((company) => (
                      <div key={company.id} className="crm-card">
                        <div className="crm-card-header">
                          <div className="company-meta">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h3>{company.name}</h3>
                              {renderStatusBadge(company.call_status)}
                            </div>
                            <span className="activity-tag">{company.activity}</span>
                            {company.address && <p className="address-sub">{company.address}</p>}
                          </div>
                          <div className="crm-card-actions">
                            <button 
                              onClick={() => onSelectCompany(company)}
                              className="btn-icon btn-locate"
                              title="Ubicar en Mapa"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#6366f1'}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
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
                                <a href={`tel:${cleanPhone(company.phone)}`} className="phone-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#34d399'}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                  {company.phone}
                                </a>
                              </div>
                            )}
                            {company.email && (
                              <div className="contact-item">
                                <span className="label">Correo:</span>
                                <a href={`mailto:${company.email}`} className="email-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#fb923c'}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                  {company.email}
                                </a>
                              </div>
                            )}
                            {company.website && (
                              <div className="contact-item">
                                <span className="label">Web:</span>
                                <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="web-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#6366f1'}}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                  Sitio Web
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
                                <option value="Pendiente">Pendiente</option>
                                <option value="No contestó">No contestó</option>
                                <option value="Contactado - Sin interés">Sin interés</option>
                                <option value="Contactado - Interesado">Interesado</option>
                              </select>
                            </div>

                            <div className="notes-editor">
                              <label className="label">Notas de Seguimiento:</label>
                              {editingNotesId === company.id ? (
                                <div className="notes-editing-box">
                                  <textarea
                                    value={tempNotes}
                                    onChange={(e) => setTempNotes(e.target.value)}
                                    onBlur={() => handleSaveNotes(company.id)}
                                    placeholder="Escribe el resultado de la llamada..."
                                    rows={3}
                                    autoFocus
                                  />
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
                                  <span className="edit-hint" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                    Editar
                                  </span>
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
              <>
                {loadingCampaigns ? (
                  <div className="panel-loading">
                    <div className="spinner"></div>
                    <p>Cargando historial de campañas...</p>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="panel-empty">
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--text-muted)'}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <p>No se han enviado campañas de correo aún.</p>
                    <span className="help-text">Haz clic en "Enviar Correo Masivo" en la parte superior para crear e iniciar tu primera campaña para este portafolio.</span>
                  </div>
                ) : (
                  <div className="campaigns-list">
                    {campaigns.map((campaign) => {
                      const successRate = campaign.total_emails > 0 
                        ? Math.round((campaign.sent_emails / campaign.total_emails) * 100) 
                        : 0;
                      return (
                        <div key={campaign.id} className="campaign-card glass-panel" onClick={() => setSelectedCampaignForDetail(campaign)}>
                          <div className="campaign-card-header">
                            <div className="campaign-meta">
                              <h3>{campaign.subject}</h3>
                              <span className="date-tag">
                                {new Date(campaign.created_at).toLocaleString('es-MX', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="campaign-stats-pill">
                              <span className="success-percent">{successRate}% Éxito</span>
                              <span className="success-ratio">({campaign.sent_emails}/{campaign.total_emails})</span>
                            </div>
                          </div>
                          <div className="campaign-card-body">
                            <p className="body-preview">{campaign.body.substring(0, 120)}{campaign.body.length > 120 ? '...' : ''}</p>
                            {campaign.error_emails > 0 && (
                              <span className="error-pill">
                                {campaign.error_emails} con error
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="panel-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--text-muted)'}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
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

      {selectedCampaignForDetail && (
        <div className="campaign-detail-overlay" onClick={() => setSelectedCampaignForDetail(null)}>
          <div className="campaign-detail-modal glass-panel animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <h3>Detalle de Campaña</h3>
                <p className="subtitle">Historial de envíos y errores en tiempo real</p>
              </div>
              <button className="btn-close" onClick={() => setSelectedCampaignForDetail(null)}>
                &times;
              </button>
            </div>
            
            <div className="detail-content">
              {/* Left column: Message template preview */}
              <div className="detail-left-pane">
                <div className="message-preview-box">
                  <div className="preview-label">Asunto del Correo</div>
                  <div className="preview-value subject">{selectedCampaignForDetail.subject}</div>
                  
                  <div className="preview-label">Cuerpo del Mensaje</div>
                  <div className="preview-value body">
                    {selectedCampaignForDetail.body.split('\n').map((para, i) => (
                      <p key={i}>{para || '\u00A0'}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: Delivery logs list */}
              <div className="detail-right-pane">
                <div className="logs-summary">
                  <h4>Estado de la Entrega</h4>
                  <div className="detail-stats-grid">
                    <div className="stat-card">
                      <span className="stat-num">{selectedCampaignForDetail.total_emails}</span>
                      <span className="stat-label">Destinatarios</span>
                    </div>
                    <div className="stat-card success">
                      <span className="stat-num">{selectedCampaignForDetail.sent_emails}</span>
                      <span className="stat-label">Enviados</span>
                    </div>
                    <div className="stat-card error">
                      <span className="stat-num">{selectedCampaignForDetail.error_emails}</span>
                      <span className="stat-label">Errores</span>
                    </div>
                  </div>
                </div>

                <div className="logs-list-container">
                  <h5>Registros de Envío</h5>
                  {loadingLogs ? (
                    <div className="logs-loading">
                      <div className="spinner-small"></div>
                      <span>Cargando registros...</span>
                    </div>
                  ) : campaignLogs.length === 0 ? (
                    <div className="logs-empty">
                      No hay registros de envío para esta campaña.
                    </div>
                  ) : (
                    <div className="logs-scroll">
                      {campaignLogs.map((log) => (
                        <div key={log.id} className="log-row-item">
                          <div className="log-company-info">
                            <span className="name">{log.company_name || 'Empresa Eliminada'}</span>
                            <span className="email">{log.recipient_email}</span>
                          </div>
                          
                          <div className="log-status-info">
                            {log.status === 'sent' ? (
                              <span className="badge badge-sent">Enviado</span>
                            ) : (
                              <div className="error-container">
                                <span className="badge badge-error">Error</span>
                                <span className="error-text" title={log.error_message}>{log.error_message}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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
          align-items: center;
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
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-export {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 8px 14px;
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
          background: var(--accent-primary);
          color: var(--accent-primary-text);
          border: 1px solid transparent;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .btn-dialer:hover:not(:disabled) {
          background: #4f46e5;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }
        .btn-dialer:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-email {
          background: var(--accent-primary);
          color: var(--accent-primary-text);
          border: 1px solid transparent;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-email:hover:not(:disabled) {
          background: #4f46e5;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
        }
        .btn-email:disabled {
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
          .header-actions {
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          .btn-action {
            width: 100%;
            text-align: center;
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
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }
          .status-selector, .notes-editor {
            width: 100%;
          }
        }

        /* Subtabs */
        .crm-subtabs {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 10px;
        }
        .subtab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          padding: 6px 16px;
          cursor: pointer;
          position: relative;
          transition: var(--transition-fast);
        }
        .subtab-btn:hover {
          color: var(--text-primary);
        }
        .subtab-btn.active {
          color: var(--text-primary);
        }
        .subtab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -11px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--text-primary);
        }

        /* Campaigns list */
        .campaigns-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .campaign-card {
          background: rgba(18, 25, 45, 0.4);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          padding: 16px;
          cursor: pointer;
          transition: var(--transition-normal);
        }
        .campaign-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(18, 25, 45, 0.6);
        }
        .campaign-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .campaign-meta h3 {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .date-tag {
          font-size: 11px;
          color: var(--text-muted);
        }
        .campaign-stats-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .success-percent {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-success);
          background: rgba(74, 222, 128, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .success-ratio {
          font-size: 10.5px;
          color: var(--text-secondary);
        }
        .campaign-card-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .body-preview {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.4;
          flex: 1;
        }
        .error-pill {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-danger);
          background: rgba(248, 113, 113, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        /* Campaign Detail Modal */
        .campaign-detail-overlay {
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
        .campaign-detail-modal {
          background: var(--bg-primary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1000px;
          height: 80vh;
          max-height: 750px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          overflow: hidden;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--panel-border);
        }
        .detail-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .detail-header .subtitle {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .detail-content {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          height: calc(100% - 81px);
          overflow: hidden;
        }
        .detail-left-pane {
          border-right: 1px solid var(--panel-border);
          display: flex;
          flex-direction: column;
          padding: 20px;
          overflow-y: auto;
        }
        .message-preview-box {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .preview-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .preview-value {
          background: var(--bg-secondary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: 13.5px;
          margin-bottom: 16px;
        }
        .preview-value.subject {
          font-weight: 600;
        }
        .preview-value.body {
          white-space: pre-wrap;
          line-height: 1.5;
          min-height: 250px;
          font-family: inherit;
        }
        .detail-right-pane {
          display: flex;
          flex-direction: column;
          padding: 20px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.01);
        }
        .logs-summary {
          margin-bottom: 20px;
        }
        .logs-summary h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--text-primary);
        }
        .detail-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        .stat-card.error .stat-num {
          color: var(--accent-danger);
        }
        .logs-list-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        .logs-list-container h5 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text-secondary);
        }
        .logs-loading, .logs-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 20px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .logs-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }
        .log-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          gap: 15px;
        }
        .log-company-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .log-company-info .name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .log-company-info .email {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .log-status-info {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .badge-pending {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
        }
        .badge-sending {
          background: rgba(99, 102, 241, 0.1);
          color: var(--accent-primary);
        }
        .badge-sent {
          background: rgba(74, 222, 128, 0.1);
          color: var(--accent-success);
        }
        .badge-error {
          background: rgba(248, 113, 113, 0.1);
          color: var(--accent-danger);
        }
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          max-width: 180px;
        }
        .error-text {
          font-size: 10px;
          color: var(--accent-danger);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        .spinner-small {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: currentColor;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
      <BulkEmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        companies={companies} 
        portfolioId={selectedPortfolioId}
      />
    </div>
  );
}
