'use client';
import { useState, useEffect, useRef } from 'react';
import BusinessTable from '@/components/BusinessTable';
import PortfolioManager from '@/components/PortfolioManager';
import Map from '@/components/Map';

const ESTADOS_MEXICO = [
  { code: '00', name: 'Nacional (Todos los Estados)' },
  { code: '01', name: 'Aguascalientes' },
  { code: '02', name: 'Baja California' },
  { code: '03', name: 'Baja California Sur' },
  { code: '04', name: 'Campeche' },
  { code: '05', name: 'Coahuila de Zaragoza' },
  { code: '06', name: 'Colima' },
  { code: '07', name: 'Chiapas' },
  { code: '08', name: 'Chihuahua' },
  { code: '09', name: 'Ciudad de México' },
  { code: '10', name: 'Durango' },
  { code: '11', name: 'Guanajuato' },
  { code: '12', name: 'Guerrero' },
  { code: '13', name: 'Hidalgo' },
  { code: '14', name: 'Jalisco' },
  { code: '15', name: 'Estado de México' },
  { code: '16', name: 'Michoacán de Ocampo' },
  { code: '17', name: 'Morelos' },
  { code: '18', name: 'Nayarit' },
  { code: '19', name: 'Nuevo León' },
  { code: '20', name: 'Oaxaca' },
  { code: '21', name: 'Puebla' },
  { code: '22', name: 'Querétaro' },
  { code: '23', name: 'Quintana Roo' },
  { code: '24', name: 'San Luis Potosí' },
  { code: '25', name: 'Sinaloa' },
  { code: '26', name: 'Sonora' },
  { code: '27', name: 'Tabasco' },
  { code: '28', name: 'Tamaulipas' },
  { code: '29', name: 'Tlaxcala' },
  { code: '30', name: 'Veracruz de Ignacio de la Llave' },
  { code: '31', name: 'Yucatán' },
  { code: '32', name: 'Zacatecas' }
];

const ESTRATOS = [
  { value: 'todos', label: 'Cualquier tamaño (Estrato)' },
  { value: '0 a 5 personas', label: '0 a 5 personas' },
  { value: '6 a 10 personas', label: '6 a 10 personas' },
  { value: '11 a 30 personas', label: '11 a 30 personas' },
  { value: '31 a 50 personas', label: '31 a 50 personas' },
  { value: '51 a 100 personas', label: '51 a 100 personas' },
  { value: '101 a 250 personas', label: '101 a 250 personas' },
  { value: '251 y más personas', label: '251 personas o más' }
];

const GIROS_POPULARES = [
  { value: 'restaurantes', label: 'Restaurantes y Alimentos' },
  { value: 'hoteles', label: 'Hoteles y Alojamientos' },
  { value: 'comercio al por menor', label: 'Comercio al por Menor' },
  { value: 'comercio al por mayor', label: 'Comercio al por Mayor' },
  { value: 'escuelas', label: 'Escuelas y Educación' },
  { value: 'servicios médicos', label: 'Hospitales y Servicios Médicos' },
  { value: 'construcción', label: 'Construcción' },
  { value: 'manufactura', label: 'Manufactura' },
  { value: 'servicios profesionales', label: 'Servicios Profesionales' },
];

const SUGERENCIAS_BUSQUEDA = [
  'Abarrotes', 'Farmacia', 'Ferretería', 'Papelería', 'Estética',
  'Taller mecánico', 'Refaccionaria', 'Zapatería', 'Boutique', 'Carnicería',
  'Panadería', 'Tortillería', 'Restaurante', 'Cafetería', 'Taquería',
  'Pizzería', 'Gimnasio', 'Consultorio dental', 'Consultorio médico',
  'Veterinaria', 'Lavandería', 'Tintorería', 'Cerrajería', 'Carpintería',
  'Herrería', 'Vidriería', 'Plomería', 'Electricista', 'Pinturas',
  'Materiales para construcción', 'Mueblería', 'Joyería', 'Óptica',
  'Notaría', 'Despacho contable', 'Despacho jurídico', 'Agencia de viajes',
  'Inmobiliaria', 'Escuela', 'Colegio', 'Guardería', 'Clínica',
  'Laboratorio', 'Hojalatería', 'Taller eléctrico',
  'Autolavado', 'Vulcanizadora', 'Llantera', 'Gasolinera', 'Purificadora',
  'Cremería', 'Frutería', 'Verdulería', 'Pollería', 'Pescadería',
  'Dulcería', 'Materias primas', 'Heladería', 'Paletería', 'Licorería',
  'Depósito de cerveza', 'Cyber café', 'Casa de empeño', 'Salón de fiestas',
  'Florería', 'Regalos', 'Novedades', 'Cosméticos', 'Perfumería',
  'Tienda de conveniencia', 'Minisuper', 'Supermercado', 'Tienda departamental',
  'Agencia automotriz', 'Taller de motos', 'Refacciones para moto',
  'Venta de celulares', 'Reparación de celulares', 'Computadoras',
  'Impresiones', 'Copias', 'Fotografía', 'Tatuajes', 'Barbería',
  'Spa', 'Masajes', 'Ropa deportiva', 'Bazar', 'Fonda', 
  'Cocina económica', 'Sushi', 'Hamburguesas', 'Oxxo', 'Seven Eleven',
  'Elektra', 'Coppel', 'Farmacias del Ahorro', 'Farmacias Similares'
].sort();

const normalizeText = (text) => {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'crm'
  const [token, setToken] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const searchInputRef = useRef(null);

  const [selectedGiros, setSelectedGiros] = useState([]);
  const [selectedState, setSelectedState] = useState('09'); // Default: Ciudad de México
  const [selectedEstrato, setSelectedEstrato] = useState('todos');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState([]);
  const [municipalitySearch, setMunicipalitySearch] = useState('');
  const [allMunicipiosPorEstado, setAllMunicipiosPorEstado] = useState({});
  
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCompany, setActiveCompany] = useState(null);

  // CRM state
  const [portfolios, setPortfolios] = useState([]);
  const [savedCompanyIds, setSavedCompanyIds] = useState(new Set());

  // Load token and portfolios from server/localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('denue_api_token') || '';
    setToken(savedToken);
    fetchPortfolios();
  }, []);

  // Sync portfolios to saved company IDs to check "Guardado" status in Search tab
  useEffect(() => {
    async function loadAllSavedCompanies() {
      if (portfolios.length === 0) {
        setSavedCompanyIds(new Set());
        return;
      }
      
      const ids = new Set();
      try {
        for (const p of portfolios) {
          const res = await fetch(`/api/companies?portfolioId=${p.id}`);
          if (res.ok) {
            const list = await res.json();
            list.forEach(c => ids.add(String(c.denue_id)));
          }
        }
        setSavedCompanyIds(ids);
      } catch (err) {
        console.error('Error listing saved companies IDs:', err);
      }
    }

    loadAllSavedCompanies();
  }, [portfolios]);

  useEffect(() => {
    fetch('/municipios.json')
      .then(res => res.json())
      .then(data => setAllMunicipiosPorEstado(data))
      .catch(err => console.error('Error cargando municipios:', err));
  }, []);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update available municipalities when state changes
  useEffect(() => {
    if (selectedState !== '00' && Object.keys(allMunicipiosPorEstado).length > 0) {
      const stateObj = ESTADOS_MEXICO.find(e => e.code === selectedState);
      let stateName = stateObj?.name;
      if (stateName === 'Estado de México') stateName = 'México';
      
      const munis = allMunicipiosPorEstado[stateName] || [];
      setAvailableMunicipalities(munis);
    } else {
      setAvailableMunicipalities([]);
    }
    setSelectedMunicipalities([]);
    setMunicipalitySearch('');
  }, [selectedState, allMunicipiosPorEstado]);

  // Client-side filter for estrato and municipalities
  useEffect(() => {
    let result = companies;
    
    if (selectedEstrato !== 'todos') {
      result = result.filter(c => {
        const estratoVal = c.Estrato || c.estrato || '';
        return estratoVal.toLowerCase().includes(selectedEstrato.toLowerCase());
      });
    }

    if (selectedMunicipalities.length > 0) {
      result = result.filter(c => {
        let m = c.Municipio || c.municipio || '';
        if (m) {
          return selectedMunicipalities.some(selected => normalizeText(m) === normalizeText(selected));
        }
        if (c.Ubicacion) {
          const parts = c.Ubicacion.split(',').map(p => normalizeText(p.trim()));
          return selectedMunicipalities.some(selected => parts.includes(normalizeText(selected)));
        }
        return false;
      });
    }

    if (onlyWithPhone) {
      result = result.filter(c => {
        const phoneVal = c.Telefono || c.phone || '';
        return phoneVal.trim() !== '';
      });
    }

    setFilteredCompanies(result);
  }, [companies, selectedEstrato, selectedMunicipalities, onlyWithPhone]);

  const handleMunicipalityChange = (muni) => {
    setSelectedMunicipalities(prev => 
      prev.includes(muni) ? prev.filter(m => m !== muni) : [...prev, muni]
    );
  };

  const handleGiroChange = (giroValue) => {
    setSelectedGiros(prev => 
      prev.includes(giroValue) ? prev.filter(g => g !== giroValue) : [...prev, giroValue]
    );
  };

  const fetchPortfolios = async () => {
    try {
      const res = await fetch('/api/portfolios');
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data);
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
    }
  };

  const handleSaveToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem('denue_api_token', newToken);
  };

  const handleSearchQueryChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (val.length >= 2) {
      const filtered = SUGERENCIAS_BUSQUEDA.filter(sug => 
        normalizeText(sug).includes(normalizeText(val))
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActiveCompany(null);
    try {
      const headers = {};
      const baseSearchQuery = searchQuery.trim();
      let queriesToRun = [];

      const girosToSearch = selectedGiros.length > 0 ? selectedGiros : (baseSearchQuery ? [baseSearchQuery] : ['todos']);

      // Helper to simplify queries to prevent INEGI API 500 errors on long strings
      const simplifyGiro = (g) => {
        if (g === 'todos' || g === baseSearchQuery) return g;
        return g.split(' ')[0]; // e.g. "comercio al por menor" -> "comercio"
      };

      const simplifiedQueries = new Set();

      if (selectedMunicipalities.length > 0) {
        girosToSearch.forEach(g => {
          const simpleG = simplifyGiro(g);
          selectedMunicipalities.forEach(muni => {
            simplifiedQueries.add(`${simpleG} ${muni}`.trim());
            const normalizedMuni = normalizeText(muni);
            if (normalizedMuni !== muni.toLowerCase()) {
              simplifiedQueries.add(`${simpleG} ${normalizedMuni}`.trim());
            }
          });
        });
      } else {
        girosToSearch.forEach(g => simplifiedQueries.add(simplifyGiro(g)));
      }
      
      queriesToRun = Array.from(simplifiedQueries);
      
      let allResults = [];
      const promises = queriesToRun.map(async (mQuery) => {
        const limit = selectedMunicipalities.length > 0 ? 100 : 250;
        const res = await fetch(`/api/denue?action=searchEntidad&query=${encodeURIComponent(mQuery)}&stateCode=${selectedState}&start=1&end=${limit}`, { headers });
        if (!res.ok) throw new Error(`Error en API para consulta: ${mQuery}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      });
      
      const resultsArray = await Promise.all(promises);
      
      const seen = new Set();
      resultsArray.forEach(data => {
        data.forEach(item => {
          const id = item.CLEE || item.Id;
          if (id && !seen.has(id)) {
            seen.add(id);
            allResults.push(item);
          }
        });
      });

      // Local filter to strictly match the selected complex giros (e.g. "comercio al por menor")
      if (selectedGiros.length > 0) {
        allResults = allResults.filter(item => {
          const actividad = (item.Clase_actividad || '').toLowerCase();
          const nombre = (item.Nombre || '').toLowerCase();
          return selectedGiros.some(giro => {
            const lowerGiro = giro.toLowerCase();
            return actividad.includes(lowerGiro) || nombre.includes(lowerGiro) || lowerGiro.includes(actividad);
          });
        });
      }

      setCompanies(allResults);
    } catch (err) {
      alert(err.message || 'Error al conectar con la API de INEGI. Revisa tu token.');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPortfolio = async (name) => {
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const newPort = await res.json();
        await fetchPortfolios();
        return newPort;
      }
    } catch (err) {
      console.error(err);
      alert('No se pudo crear el portafolio.');
    }
    return null;
  };

  const handleDeletePortfolio = async (id) => {
    try {
      const res = await fetch(`/api/portfolios?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchPortfolios();
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el portafolio.');
    }
  };

  const handleSaveToPortfolio = async (company, portfolioId) => {
    try {
      // Mapping fields from DENUE response to DB model schema
      const mapped = {
        denueId: String(company.Id || company.id || company.ID),
        name: company.Nombre || company.name || company.RazonSocial,
        activity: company.ClaseActividad || company.activity || '',
        phone: company.Telefono || company.phone || '',
        email: company.CorreoElectronico || company.email || '',
        website: company.SitioInternet || company.website || '',
        address: `${company.Calle || ''} ${company.NumExterior || ''}, ${company.Colonia || ''}, ${company.Municipio || ''}, ${company.Entidad || ''}`,
        latitude: parseFloat(company.Latitud || company.latitude || company.Latitude || 0),
        longitude: parseFloat(company.Longitud || company.longitude || company.Longitude || 0),
        portfolioId: parseInt(portfolioId)
      };

      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapped)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'No se pudo guardar la empresa.');
      }

      // Refresh portfolios counts and active mappings
      await fetchPortfolios();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header Panel */}
      <header className="dashboard-header animate-slide-up">
        <div className="logo-section">
          <div className="logo-svg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="logo-text">
            <h1>ProspectaMX</h1>
            <p>Intelligence Platform</p>
          </div>
        </div>

        {/* Global configuration: INEGI token */}
        <div className="header-actions">
          <div className="token-input-wrapper">
            <svg className="token-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
            <input
              id="token-input"
              type="password"
              placeholder={token ? "Token INEGI configurado" : "Ingresa Token INEGI"}
              onChange={(e) => handleSaveToken(e.target.value)}
              className="token-input"
            />
            {token && <span className="token-saved-status">✓</span>}
          </div>
          <a href="https://www.inegi.org.mx/app/api/denue/v1/token/" target="_blank" rel="noopener noreferrer" className="btn-secondary btn-small">
            Obtener token gratis
          </a>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav glass-panel">
        <button
          className={`nav-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Buscador de Empresas
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
          onClick={() => setActiveTab('crm')}
        >
          Mis Portafolios (CRM)
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {activeTab === 'search' ? (
          <div className="search-layout-grid">
            {/* Left Column: Map & Search Filters */}
            <div className="filters-map-column">
              <div className="search-filters-card glass-panel">
                <h3 className="card-title">Filtros de Búsqueda</h3>
                <form onSubmit={handleSearch} className="filters-form">
                  <div className="form-group animate-slide-up">
                    <label>Giros Comerciales (Puedes seleccionar varios):</label>
                    <div className="chips-list">
                      {GIROS_POPULARES.map(g => (
                        <label key={g.value} className={`chip-checkbox ${selectedGiros.includes(g.value) ? 'active' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedGiros.includes(g.value)}
                            onChange={() => handleGiroChange(g.value)}
                          />
                          {g.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group animate-slide-up" style={{ animationDelay: '0.1s' }} ref={searchInputRef}>
                    <label>Búsqueda Adicional (Opcional):</label>
                    <div className="autocomplete-wrapper">
                      <input
                        type="text"
                        placeholder="Ej. Oxxo, Refaccionaria, Ferretería..."
                        value={searchQuery}
                        onChange={handleSearchQueryChange}
                        onFocus={() => { if (searchQuery.length >= 2) setShowSuggestions(true); }}
                      />
                      {showSuggestions && filteredSuggestions.length > 0 && (
                        <ul className="autocomplete-dropdown">
                          {filteredSuggestions.map((sug, idx) => (
                            <li key={idx} onClick={() => handleSelectSuggestion(sug)}>
                              {sug}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="form-group animate-slide-up" style={{ animationDelay: '0.15s' }}>
                    <label className="checkbox-label" style={{ fontWeight: '600' }}>
                      <input
                        type="checkbox"
                        checked={onlyWithPhone}
                        onChange={(e) => setOnlyWithPhone(e.target.checked)}
                      />
                      Mostrar solo empresas con teléfono registrado
                    </label>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Estado de la República:</label>
                      <select 
                        value={selectedState} 
                        onChange={(e) => setSelectedState(e.target.value)}
                      >
                        {ESTADOS_MEXICO.map(e => (
                          <option key={e.code} value={e.code}>{e.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Tamaño de Empresa:</label>
                      <select
                        value={selectedEstrato}
                        onChange={(e) => setSelectedEstrato(e.target.value)}
                      >
                        {ESTRATOS.map(e => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {availableMunicipalities.length > 0 && (
                    <div className="form-group animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      <label>Filtrar por Municipios (Opcional):</label>
                      <div className="multiselect-container">
                        <input
                          type="text"
                          placeholder="Buscar municipio..."
                          value={municipalitySearch}
                          onChange={(e) => setMunicipalitySearch(e.target.value)}
                          className="municipality-search-input"
                        />
                        
                        {selectedMunicipalities.length > 0 && (
                          <div className="selected-chips-container">
                            {selectedMunicipalities.map(muni => (
                              <div key={`sel-${muni}`} className="chip-selected">
                                <span>{muni}</span>
                                <button type="button" onClick={() => handleMunicipalityChange(muni)}>&times;</button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="municipalities-list">
                          {availableMunicipalities
                            .filter(muni => normalizeText(muni).includes(normalizeText(municipalitySearch)))
                            .map(muni => (
                            <label key={muni} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedMunicipalities.includes(muni)}
                                onChange={() => handleMunicipalityChange(muni)}
                              />
                              {muni}
                            </label>
                          ))}
                          {availableMunicipalities.filter(muni => normalizeText(muni).includes(normalizeText(municipalitySearch))).length === 0 && (
                            <span className="text-muted" style={{fontSize: '12px', padding: '4px'}}>No se encontraron coincidencias</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn-search-submit"
                    disabled={loading}
                  >
                    {loading ? 'Consultando INEGI...' : 'Buscar Empresas'}
                  </button>
                </form>
              </div>

              {/* Dynamic Map panel */}
              <div className="map-card glass-panel">
                <Map companies={filteredCompanies} activeCompany={activeCompany} />
              </div>
            </div>

            {/* Right/Bottom Column: Search Results Table */}
            <div className="results-table-card glass-panel">
              <div className="card-header">
                <h2>Resultados de Búsqueda ({filteredCompanies.length})</h2>
                <p>Empresas encontradas en el estado seleccionado</p>
              </div>
              <BusinessTable
                companies={filteredCompanies}
                portfolios={portfolios}
                savedCompanyIds={savedCompanyIds}
                onSaveToPortfolio={handleSaveToPortfolio}
                onSelectCompany={(company) => setActiveCompany(company)}
                loading={loading}
              />
            </div>
          </div>
        ) : (
          <div className="crm-layout-grid">
            {/* Split layout for CRM: list on the left, map on the right to track visually */}
            <div className="crm-content-section">
              <PortfolioManager
                portfolios={portfolios}
                onAddPortfolio={handleAddPortfolio}
                onDeletePortfolio={handleDeletePortfolio}
                onSelectCompany={(company) => setActiveCompany(company)}
              />
            </div>
            
            <div className="crm-map-section glass-panel">
              <div className="map-header">
                <h3>Ubicación Geográfica</h3>
                <p>Ver mapa dinámico del cliente seleccionado</p>
              </div>
              <Map companies={[]} activeCompany={activeCompany} />
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .dashboard-layout {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 100vh;
        }
        
        /* Header Section */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(15, 15, 18, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          margin-bottom: 8px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-svg {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.1);
          padding: 10px;
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
        }
        .logo-text h1 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .logo-text p {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        /* Token Configuration block */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .token-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          transition: all 0.2s ease;
        }
        .token-input-wrapper:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .token-icon {
          color: var(--text-secondary);
        }
        .token-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          outline: none;
          width: 170px;
        }
        .token-input::placeholder {
          color: var(--text-secondary);
        }
        .token-saved-status {
          font-size: 14px;
          color: var(--accent-success);
          font-weight: bold;
        }
        .btn-small {
          padding: 7px 14px;
          font-size: 12px;
          border-radius: var(--radius-full);
        }

        /* Navigation Bar */
        .dashboard-nav {
          display: flex;
          padding: 6px;
          gap: 6px;
        }
        .nav-tab-btn {
          flex: 1;
          padding: 14px 20px;
          font-size: 14px;
          font-weight: 600;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .nav-tab-btn:hover {
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-primary);
        }
        .nav-tab-btn.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          border: 1px solid var(--panel-border);
        }

        /* Main Area layouts */
        .dashboard-main {
          flex: 1;
        }
        
        /* Search Tab layout grid */
        .search-layout-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 20px;
          align-items: start;
        }
        .filters-map-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }
        .search-filters-card {
          padding: 20px;
        }
        .card-title {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 15px;
          font-weight: 700;
        }
        .filters-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .filters-form input, .filters-form select {
          background: var(--bg-tertiary);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          color: var(--text-primary);
          font-size: 13.5px;
          outline: none;
          width: 100%;
          cursor: pointer;
        }
        .filters-form input:focus, .filters-form select:focus {
          border-color: var(--accent-primary);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 15px;
        }
        .btn-search-submit {
          background: var(--accent-primary);
color: var(--accent-primary-text);
          border: none;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          margin-top: 5px;
        }
        .btn-search-submit:hover:not(:disabled) {
          background: #4f46e5;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }
        .btn-search-submit:disabled {
          background: var(--bg-tertiary);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .autocomplete-wrapper {
          position: relative;
          width: 100%;
        }
        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-sm);
          margin-top: 4px;
          max-height: 220px;
          overflow-y: auto;
          z-index: 50;
          list-style: none;
          padding: 0;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .autocomplete-dropdown li {
          padding: 10px 14px;
          font-size: 13.5px;
          color: var(--text-primary);
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .autocomplete-dropdown li:last-child {
          border-bottom: none;
        }
        .autocomplete-dropdown li:hover {
          background: rgba(99, 102, 241, 0.15);
          color: var(--accent-primary);
        }

        .multiselect-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(12, 18, 34, 0.3);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-md);
          padding: 12px;
        }

        .municipality-search-input {
          background: var(--bg-tertiary) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: var(--radius-sm) !important;
          padding: 8px 12px !important;
          font-size: 13px !important;
          outline: none;
          width: 100%;
        }

        .municipality-search-input:focus {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15) !important;
        }

        .selected-chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .chip-selected {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: var(--accent-primary);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 500;
        }

        .chip-selected button {
          background: transparent;
          border: none;
          color: var(--accent-primary);
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          padding: 0;
          margin-top: -1px;
        }

        .chip-selected button:hover {
          color: #f87171;
        }

        .municipalities-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 160px;
          overflow-y: auto;
          background: var(--bg-secondary);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: 8px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px !important;
          color: var(--text-primary) !important;
          cursor: pointer;
          font-weight: normal !important;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .checkbox-label:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .checkbox-label input[type="checkbox"] {
          width: auto;
        }
          cursor: pointer;
        }

        .map-card {
          padding: 6px;
          height: 412px;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }
        
        .results-table-card {
          padding: 25px;
          min-height: 600px;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }
        .results-table-card .card-header {
          margin-bottom: 20px;
        }
        .results-table-card h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 3px;
        }
        .results-table-card p {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* CRM Tab layout grid */
        .crm-layout-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 20px;
          align-items: start;
        }
        .crm-content-section {
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .crm-map-section {
          padding: 20px;
          height: 575px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          position: sticky;
          top: 20px;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }
        .map-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 3px;
        }
        .map-header p {
          font-size: 11px;
          color: var(--text-secondary);
        }
        
        @media (max-width: 1100px) {
          .search-layout-grid {
            grid-template-columns: 1fr;
          }
          .crm-layout-grid {
            grid-template-columns: 1fr;
          }
          .crm-map-section {
            position: relative;
            top: 0;
            height: 400px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-layout {
            padding: 12px;
            padding-bottom: calc(80px + env(safe-area-inset-bottom));
            gap: 15px;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            padding: 14px 16px;
            gap: 12px;
            border-radius: var(--radius-md);
          }
          
          .header-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            width: 100%;
          }
          
          .token-input-wrapper {
            width: 100%;
            justify-content: center;
          }
          
          .token-input {
            flex: 1;
            width: 100%;
          }
          
          .btn-small {
            text-align: center;
            padding: 10px;
            width: 100%;
          }
          
          .dashboard-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid var(--panel-border);
            border-radius: 0;
            padding: 8px 12px calc(8px + env(safe-area-inset-bottom)) 12px;
            margin: 0;
            box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.6);
          }
          
          .nav-tab-btn {
            padding: 12px 10px;
            font-size: 13px;
          }
          
          .search-layout-grid {
            gap: 15px;
          }
          
          .filters-map-column {
            gap: 15px;
          }
          
          .map-card {
            height: 280px;
          }
          
          .results-table-card {
            padding: 15px;
            min-height: auto;
            border-radius: var(--radius-md);
          }
          
          .crm-layout-grid {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .crm-map-section {
            height: 280px;
            order: -1; /* Place map at the top of the CRM list on mobile */
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
