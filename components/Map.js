'use client';
import { useState, useEffect, useRef } from 'react';

export default function Map({ companies = [], activeCompany = null }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const leafletRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // 1. Initialize Leaflet map once on mount
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined') return;
      if (mapInstanceRef.current) return; // Already initialized

      const Leaflet = await import('leaflet');
      if (!isMounted || !mapRef.current) return;
      
      const L = Leaflet.default || Leaflet;
      leafletRef.current = L;

      // Center of Mexico
      const center = [23.6345, -102.5528];
      const zoom = 5;

      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Dark-themed tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);

      // Fix default marker icon path issues
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Force recalculation of size in case of layout animations
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);

      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle markers updates and flyTo when activeCompany or companies list change
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapReady) return;

    // Clear existing markers from map
    markersRef.current.forEach(({ marker }) => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Get all unique companies to render
    const companiesToRender = [...companies];
    if (activeCompany) {
      const activeId = activeCompany.id || activeCompany.denue_id || activeCompany.Id || activeCompany.ID;
      const alreadyIncluded = companiesToRender.some(c => {
        const cId = c.id || c.denue_id || c.Id || c.ID;
        return cId && activeId && String(cId) === String(activeId);
      });
      if (!alreadyIncluded) {
        companiesToRender.push(activeCompany);
      }
    }

    // Add new markers to map
    companiesToRender.forEach((company) => {
      const lat = company.latitude || company.Latitude || company.Latitud;
      const lng = company.longitude || company.Longitude || company.Longitud;
      if (!lat || !lng) return;

      const name = company.name || company.Nombre || company.RazonSocial;
      const activity = company.activity || company.ClaseActividad || '';
      const address = company.address || `${company.Calle || ''} ${company.NumExterior || ''}, ${company.Colonia || ''}, ${company.Municipio || ''}`;
      const phone = company.phone || company.Telefono || '';
      const id = company.id || company.denue_id || company.Id || company.ID;

      const marker = L.marker([parseFloat(lat), parseFloat(lng)])
        .addTo(map)
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

    // Fly to active company or center to first company
    if (activeCompany) {
      const lat = activeCompany.latitude || activeCompany.Latitude || activeCompany.Latitud;
      const lng = activeCompany.longitude || activeCompany.Longitude || activeCompany.Longitud;
      if (lat && lng) {
        map.flyTo([parseFloat(lat), parseFloat(lng)], 16, {
          duration: 1.2
        });

        const activeId = activeCompany.id || activeCompany.denue_id || activeCompany.Id || activeCompany.ID;
        const match = markersRef.current.find(m => m.id === activeId);
        if (match) {
          setTimeout(() => {
            if (match.marker) {
              match.marker.openPopup();
            }
          }, 1200); // Wait for the flyTo animation to finish before opening popup
        }
      }
    } else if (companies.length > 0) {
      const valid = companies.find(c => c.latitude || c.Latitude || c.Latitud);
      if (valid) {
        const lat = valid.latitude || valid.Latitude || valid.Latitud;
        const lng = valid.longitude || valid.Longitude || valid.Longitud;
        map.setView([parseFloat(lat), parseFloat(lng)], 12);
      }
    }
  }, [companies, activeCompany, mapReady]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />
    </div>
  );
}
