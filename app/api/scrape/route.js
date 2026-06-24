import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Expresión regular robusta para correos electrónicos
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/g;

// Palabras clave comunes para encontrar subpáginas de contacto
const CONTACT_KEYWORDS = ['contacto', 'contact', 'about', 'nosotros', 'quienes', 'escribenos', 'ayuda', 'info'];

// Extensiones de archivos comunes a ignorar para evitar falsos positivos
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.css', '.js'];

export async function POST(request) {
  try {
    let { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'La URL es requerida.' }, { status: 400 });
    }

    // Limpiar y asegurar protocolo en la URL
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }

    // Configuración base de Axios para simular un navegador
    const axiosConfig = {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      }
    };

    const emails = new Set();
    const visitedUrls = new Set();

    // 1. Scrapear la página principal (Home)
    const homepageHtml = await fetchHtml(url, axiosConfig);
    if (homepageHtml) {
      extractEmailsFromHtml(homepageHtml, emails);
      visitedUrls.add(url);

      // Buscar enlaces de contacto para una segunda pasada
      const contactLinks = findContactLinks(homepageHtml, url);
      
      // Limitar a scrapear máximo las 2 subpáginas de contacto más probables para evitar lentitud
      const subpagesToScrape = contactLinks.slice(0, 2);

      for (const subpageUrl of subpagesToScrape) {
        if (!visitedUrls.has(subpageUrl)) {
          visitedUrls.add(subpageUrl);
          const subpageHtml = await fetchHtml(subpageUrl, axiosConfig);
          if (subpageHtml) {
            extractEmailsFromHtml(subpageHtml, emails);
          }
        }
      }
    }

    // Limpiar y filtrar la lista de correos
    const emailList = Array.from(emails)
      .map(email => email.toLowerCase().trim())
      .filter(email => {
        // Filtrar si termina en una extensión de imagen común (falso positivo de imágenes/assets)
        return !IGNORE_EXTENSIONS.some(ext => email.endsWith(ext));
      });

    return NextResponse.json({
      success: true,
      url,
      emailsFound: emailList,
      count: emailList.length
    });

  } catch (error) {
    console.error('Error al ejecutar el scraper:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al ejecutar el raspado de web' },
      { status: 500 }
    );
  }
}

// Función auxiliar para descargar el HTML de una página
async function fetchHtml(targetUrl, config) {
  try {
    const response = await axios.get(targetUrl, config);
    if (typeof response.data === 'string') {
      return response.data;
    }
    return '';
  } catch (err) {
    console.warn(`No se pudo descargar la URL: ${targetUrl} - Razón: ${err.message}`);
    return '';
  }
}

// Extrae correos electrónicos del HTML (tanto de enlaces mailto como del texto plano)
function extractEmailsFromHtml(html, emailsSet) {
  if (!html) return;
  const $ = cheerio.load(html);

  // A. Extraer de enlaces "mailto:" (Es el método más confiable)
  $('a[href^="mailto:"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const cleanMail = href.replace(/^mailto:/i, '').split('?')[0].trim();
    if (cleanMail && cleanMail.includes('@')) {
      emailsSet.add(cleanMail);
    }
  });

  // B. Extraer del texto completo del HTML
  const bodyText = $('body').text() || '';
  const matches = bodyText.match(EMAIL_REGEX);
  if (matches) {
    matches.forEach(email => emailsSet.add(email));
  }

  // C. Buscar correos incluso en el HTML crudo (comentarios o scripts que expongan emails)
  const rawMatches = html.match(EMAIL_REGEX);
  if (rawMatches) {
    rawMatches.forEach(email => emailsSet.add(email));
  }
}

// Identifica y resuelve enlaces de contacto relativos/absolutos dentro del mismo dominio
function findContactLinks(html, baseUrl) {
  const contactLinks = [];
  if (!html) return contactLinks;
  
  try {
    const $ = cheerio.load(html);
    const parsedBaseUrl = new URL(baseUrl);
    const baseHost = parsedBaseUrl.hostname.replace('www.', '');

    $('a').each((_, element) => {
      let href = $(element).attr('href') || '';
      href = href.trim();

      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }

      // Evaluar si el texto del enlace o el href contiene palabras clave de contacto
      const linkText = $(element).text().toLowerCase();
      const lowerHref = href.toLowerCase();
      
      const matchesKeyword = CONTACT_KEYWORDS.some(kw => 
        linkText.includes(kw) || lowerHref.includes(kw)
      );

      if (matchesKeyword) {
        try {
          // Resolver URL relativa a absoluta
          const resolvedUrl = new URL(href, baseUrl).toString();
          const resolvedHost = new URL(resolvedUrl).hostname.replace('www.', '');

          // Solo seguir enlaces que correspondan al mismo dominio
          if (resolvedHost === baseHost) {
            if (!contactLinks.includes(resolvedUrl)) {
              contactLinks.push(resolvedUrl);
            }
          }
        } catch (e) {
          // URL inválida ignorada
        }
      }
    });
  } catch (err) {
    console.error('Error buscando enlaces de contacto:', err);
  }

  return contactLinks;
}
