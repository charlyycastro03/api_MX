import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'searchEntidad'; // 'searchEntidad' or 'searchProximity'
  const query = searchParams.get('query') || 'todos';
  const stateCode = searchParams.get('stateCode') || '00';
  const start = searchParams.get('start') || '1';
  const end = searchParams.get('end') || '100';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '1000';
  
  // Get token from header, query param, or env
  const token = request.headers.get('x-denue-token') || searchParams.get('token') || process.env.DENUE_API_TOKEN;

  if (!token) {
    return NextResponse.json({ 
      error: 'Token de INEGI DENUE es requerido. Por favor regístrate en INEGI y agrégalo en la configuración.' 
    }, { status: 400 });
  }

  let url = '';
  if (action === 'searchProximity') {
    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitud y Longitud son requeridas para la búsqueda por proximidad.' }, { status: 400 });
    }
    // Clean condition: keep spaces as they are, INEGI API prefers URL encoded spaces over commas
    const cleanedQuery = encodeURIComponent(query.trim() === '' ? 'todos' : query.trim());
    url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/${cleanedQuery}/${lat},${lng}/${radius}/${token}`;
  } else {
    // State search: BuscarEntidad/[Búsqueda]/[Entidad]/[RegistroInicial]/[RegistroFinal]/[Token]
    const cleanedQuery = encodeURIComponent(query.trim() === '' ? 'todos' : query.trim());
    url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/BuscarEntidad/${cleanedQuery}/${stateCode}/${start}/${end}/${token}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error de INEGI: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in DENUE Proxy API Route:', error);
    return NextResponse.json({ error: 'Error al consultar la API de INEGI. Verifica tu token y conexión.' }, { status: 500 });
  }
}
