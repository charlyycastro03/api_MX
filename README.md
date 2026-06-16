# ProspectaMX - CRM & Visualizador DENUE (INEGI)

Una aplicación web moderna, responsiva y de alto impacto estético, diseñada para buscar unidades económicas en México a través de la API oficial de **DENUE (INEGI)**, visualizar sus ubicaciones en un mapa interactivo y gestionar portafolios de prospectos con un CRM integrado para realizar llamadas de ventas, guardar estatus y agregar notas de seguimiento.

---

## 🚀 Características Principales

*   **Buscador Integrado:** Filtrado geográfico por entidad federativa (32 estados) y por tamaño de empresa (Estrato).
*   **Bypass de CORS Seguro:** Un proxy backend de Next.js se encarga de retransmitir las llamadas de la API de INEGI evitando problemas de CORS y protegiendo tu token de acceso.
*   **Mapa Interactivo Premium:** Integración fluida con Leaflet.js y capas oscuras (CartoDB Dark Matter) para ubicar geográficamente cada negocio en tiempo real.
*   **CRM de Ventas / Portafolios:**
    *   Creación, edición y eliminación de portafolios personalizados (ej. "Hoteles en Cancún", "Fábricas en NL").
    *   Añadir prospectos desde el buscador a portafolios con un solo clic.
    *   Marcación telefónica directa con enlaces rápidos (`tel:`).
    *   Gestión de estatus de llamadas mediante colores: *Pendiente*, *No contestó*, *Sin interés* e *Interesado*.
    *   Editor de notas y comentarios de seguimiento para cada prospecto.
*   **Persistencia en MySQL:** Conexión a base de datos MySQL local para registrar y resguardar toda la actividad del CRM.

---

## ✨ Últimas Mejoras e Innovaciones (UX/UI & Rendimiento)

Recientemente se han implementado mejoras críticas para llevar la aplicación a un nivel de madurez de software de producción:

*   **Buscador Multi-Giro y Multi-Municipio:**
    *   Soporte para seleccionar múltiples giros (sectores de actividad) y múltiples municipios simultáneamente.
    *   Ejecución paralela de peticiones al backend para recolectar información de múltiples criterios de forma ágil.
*   **Resiliencia ante Errores de la API del INEGI (Bypass de Error 500):**
    *   La API del INEGI (`BuscarEntidad`) tiende a fallar con códigos `500` o expirar si la consulta contiene nombres complejos de giros o municipios concatenados en texto plano.
    *   **Solución:** Implementamos un algoritmo de búsqueda robusto que simplifica las consultas enviadas a INEGI (ej. *"comercio al por menor"* lo reduce a *"comercio"*). Luego, en el cliente, se realiza un filtro JS exacto e instantáneo sobre la respuesta. Esto evita errores 500 y garantiza que el buscador sea infalible.
*   **UI/UX Premium y Moderna (SaaS de Alto Impacto):**
    *   **Navbar de Vidrio Esmerilado (Glassmorphism):** Barra de navegación fija con desenfoque de fondo (`backdrop-filter`) y bordes estilizados.
    *   **Controles de Selección por Chips (`.chip-checkbox`):** Eliminación de listas desplegables rígidas. Los giros y municipios seleccionados se gestionan visualmente mediante botones interactivos con transiciones suaves.
    *   **Estilo del Token en Navbar:** El campo de configuración del token de INEGI se integró discretamente como un elemento interactivo en la barra superior.
*   **Resolución de Advertencia de Hidratación (Hydration Mismatch):**
    *   Se resolvió la inconsistencia de hidratación HTML de React causada por extensiones de navegador que inyectaban atributos en el DOM, agregando `suppressHydrationWarning`.

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router, React 19)
*   **Base de Datos:** [MySQL](https://www.mysql.com/) (usando el conector nativo `mysql2`)
*   **Mapas:** [Leaflet.js](https://leafletjs.com/) & [OpenStreetMap](https://www.openstreetmap.org/)
*   **Estilos:** Vanilla CSS (CSS Variables, Flexbox, Grid y Glassmorphism)

---

## 💻 Configuración e Instalación

### 1. Requisitos Previos

*   **Node.js** v18 o superior instalado en tu equipo.
*   **MySQL Server** en ejecución (el instalador local o vía Docker).

### 2. Configurar Variables de Entorno

Crea o edita el archivo `.env` en la raíz del proyecto. El archivo ya ha sido preconfigurado con tus credenciales:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Leoluis03
DB_NAME=api_mx

# Opcional: Escribe aquí tu token de INEGI por defecto
DENUE_API_TOKEN=
```

### 3. Inicializar la Base de Datos

La aplicación cuenta con una **inicialización automática**. La primera vez que el servidor se ejecute y reciba una solicitud (o visites la página), el sistema:
1.  Se conectará a tu servidor de MySQL local.
2.  Creará automáticamente la base de datos `api_mx` si no existe.
3.  Creará las tablas `portfolios` y `companies` e instalará las relaciones necesarias.

*Si prefieres inicializarla manualmente, puedes ejecutar el script SQL localizado en [lib/schema.sql](file:///z:/obsidian/api/lib/schema.sql) en MySQL Workbench o tu gestor de base de datos preferido.*

### 4. Obtención del Token de INEGI DENUE

1.  Regístrate de forma gratuita en el portal del INEGI: [Generar Token DENUE](https://www.inegi.org.mx/app/api/denue/v1/token/).
2.  El token será enviado de inmediato a tu correo electrónico.
3.  Puedes ingresarlo directamente en la interfaz web (se guardará en tu navegador) o guardarlo en tu variable de entorno `DENUE_API_TOKEN` en el archivo `.env`.

### 5. Ejecutar Localmente

Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000) para ver la aplicación web en funcionamiento.

---

## 🚢 Despliegue en Vercel

Dado que la aplicación está construida sobre Next.js, se despliega de forma nativa en **Vercel**:

1.  Sube el código a tu repositorio de GitHub: `https://github.com/charlyycastro03/api_MX.git`.
2.  Importa el proyecto en Vercel.
3.  Configura las Variables de Entorno en el panel de Vercel con las credenciales de tu base de datos de producción (por ejemplo, usando Railway, Aiven o Supabase MySQL) y tu token de INEGI:
    *   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
    *   `DENUE_API_TOKEN`.
4.  ¡Haz clic en **Deploy**!
