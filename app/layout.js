import "./globals.css";

export const metadata = {
  title: "CRM Prospectos MX - Portal de Llamadas DENUE",
  description: "Buscador y CRM inteligente de empresas de México alimentado por la API DENUE de INEGI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
