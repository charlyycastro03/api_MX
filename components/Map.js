'use client';
import { useEffect, useRef } from 'react';

export default function Map({ companies = [], activeCompany = null }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    let isMounted = true;
    let LInstance;

    async function initMap() {
      if (typeof window === 'undefined') return;
      
      const Leaflet = await import('leaflet');
      LInstance = Leaflet.default;

      if (!isMounted || !mapRef.current) return;

      // Clean up existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default coordinates: Center of Mexico (23.6345, -102.5528)
      // Check if we have valid coordinates in companies
      const validCompanies = companies.filter(c => c.Latitude || c.latitude || c.Latitud);
      
      let center = [23.6345, -102.5528];
      let zoom = 5;

      if (activeCompany && (activeCompany.latitude || activeCompany.Latitude || activeCompany.Latitud)) {
        const lat = activeCompany.latitude || activeCompany.Latitude || activeCompany.Latitud;
        const lng = activeCompany.longitude || activeCompany.Longitude || activeCompany.Longitud;
        center = [parseFloat(lat), parseFloat(lng)];
        zoom = 15;
      } else if (validCompanies.length > 0) {
        const first = validCompanies[0];
        const lat = first.latitude || first.Latitude || first.Latitud;
        const lng = first.longitude || first.Longitude || first.Longitud;
        center = [parseFloat(lat), parseFloat(lng)];
        zoom = 12;
      }

      mapInstanceRef.current = LInstance.map(mapRef.current).setView(center, zoom);

      // Add dark-themed tiles (using CartoDB Dark Matter tiles which fits our premium dark theme beautifully)
      LInstance.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);

      // Fix default marker icon path issues
      delete LInstance.Icon.Default.prototype._getIconUrl;
      LInstance.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Clear markers
      markersRef.current = [];

      // Add markers
      companies.forEach((company) => {
        const lat = company.latitude || company.Latitude || company.Latitud;
        const lng = company.longitude || company.Longitude || company.Longitud;
        if (!lat || !lng) return;

        const name = company.name || company.Nombre || company.RazonSocial;
        const activity = company.activity || company.ClaseActividad || '';
        const address = company.address || `${company.Calle || ''} ${company.NumExterior || ''}, ${company.Colonia || ''}, ${company.Municipio || ''}`;
        const phone = company.phone || company.Telefono || '';
        const id = company.id || company.denue_id || company.Id || company.ID;

        // Custom icon color or glow can be configured if needed, standard marker works fine
        const marker = LInstance.marker([parseFloat(lat), parseFloat(lng)])
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family: var(--font-sans); color: #f8fafc; padding: 2px;">
              <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #f8fafc;">${name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; line-height: 1.3;">${activity}</p>
              <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; line-height: 1.3;">${address}</p>
              ${phone ? `<a href="tel:${phone}" style="display: inline-block; padding: 4px 8px; background: #6366f1; color: white; text-decoration: none; border-radius: 4px; font-size: 10px; font-weight: 600;">📞 Llamar: ${phone}</a>` : ''}
            </div>
          `);

        markersRef.current.push({ id, marker });
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [companies]);

  // Handle active marker trigger
  useEffect(() => {
    if (!mapInstanceRef.current || !activeCompany) return;
    
    const lat = activeCompany.latitude || activeCompany.Latitude || activeCompany.Latitud;
    const lng = activeCompany.longitude || activeCompany.Longitude || activeCompany.Longitud;
    if (!lat || !lng) return;

    mapInstanceRef.current.flyTo([parseFloat(lat), parseFloat(lng)], 16, {
      duration: 1.2
    });

    const id = activeCompany.id || activeCompany.denue_id || activeCompany.Id || activeCompany.ID;
    const match = markersRef.current.find(m => m.id === id);
    if (match) {
      setTimeout(() => {
        if (match.marker) {
          match.marker.openPopup();
        }
      }, 500);
    }
  }, [activeCompany]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />
    </div>
  );
}
