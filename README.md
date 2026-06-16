# ProspectaMX - CRM y Visualizador DENUE (INEGI)

Aplicación web para la búsqueda de unidades económicas en México a través de la API de DENUE (INEGI), visualización geográfica en un mapa interactivo y gestión de portafolios de prospectos mediante un CRM local.

---

## Características Principales

*   **Buscador Integrado:** Filtrado geográfico por entidad federativa y por tamaño de empresa (estrato).
*   **Proxy de API:** Backend en Next.js para retransmitir las llamadas a la API del INEGI, resolviendo problemas de CORS y evitando exponer el token de acceso en el cliente.
*   **Visualización en Mapa:** Integración con Leaflet.js para ubicar geográficamente cada negocio en tiempo real sobre capas de mapas optimizadas.
*   **CRM y Portafolios:**
    *   Creación, edición y eliminación de portafolios de prospectos.
    *   Asociación directa de prospectos desde el buscador a portafolios específicos.
    *   Enlaces directos de marcación telefónica (`tel:`).
    *   Gestión y actualización del estatus de llamada (Pendiente, No contestó, Sin interés, Interesado).
    *   Registro de notas y comentarios de seguimiento por empresa.
*   **Persistencia Local:** Conexión a base de datos MySQL local para registrar y resguardar la actividad del CRM.

---

## Mejoras de Arquitectura y Rendimiento

*   **Buscador Multi-Giro y Multi-Municipio:**
    *   Permite seleccionar múltiples giros de actividad y municipios de forma simultánea.
    *   Implementación de peticiones paralelas en el backend para agilizar la obtención de resultados agregados.
*   **Resiliencia ante Errores de la API del INEGI (Bypass de Error 500):**
    *   La API del INEGI (`BuscarEntidad`) presenta fallas internas o tiempos de espera elevados al procesar cadenas de búsqueda complejas que combinan nombres de giros y municipios.
    *   **Solución:** Se diseñó un esquema que simplifica la consulta del lado del servidor (utilizando la raíz léxica del giro, ej: *"comercio"* en lugar de *"comercio al por menor"*). Posteriormente, el cliente aplica un filtro exacto en JavaScript sobre los campos `Clase_actividad` y `Nombre`. Esto previene respuestas fallidas de la API y asegura la disponibilidad de la búsqueda.
*   **Interfaz de Usuario Optimizada:**
    *   **Efecto de Desenfocado (Glassmorphism):** Barra de navegación con desenfoque de fondo mediante propiedades CSS estándar (`backdrop-filter`).
    *   **Interfaz de Selección basada en Chips:** Reemplazo de menús desplegables por controles tipo chip interactivos con transiciones dinámicas para facilitar la selección múltiple.
    *   **Integración del Token:** El campo para configurar el token de acceso al INEGI se encuentra integrado directamente en la barra de navegación superior.
*   **Corrección de Error de Hidratación:**
    *   Se implementó `suppressHydrationWarning` en la plantilla principal para evitar discrepancias de renderizado generadas por extensiones del navegador del usuario.

---

## Tecnologías Utilizadas

*   **Frontend y Backend:** Next.js (App Router, React 19)
*   **Base de Datos:** MySQL (conector nativo `mysql2`)
*   **Mapas:** Leaflet.js y OpenStreetMap
*   **Estilos:** CSS Vanilla (Variables CSS, Flexbox, Grid)

---

## Configuración e Instalación

### 1. Requisitos Previos

*   Node.js v18 o superior.
*   Servidor MySQL en ejecución.

### 2. Variables de Entorno

Cree un archivo `.env` en la raíz del proyecto basándose en la siguiente plantilla:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=api_mx

# Token de acceso a la API del INEGI
DENUE_API_TOKEN=
```

### 3. Inicialización de la Base de Datos

La aplicación cuenta con inicialización automática. Al iniciar el servidor y recibir la primera petición, el backend:
1.  Verificará la conexión con el servidor MySQL.
2.  Creará la base de datos `api_mx` en caso de no existir.
3.  Ejecutará el esquema de base de datos para generar las tablas `portfolios` y `companies`.

*Nota: Si requiere inicializar manualmente la base de datos, ejecute el archivo SQL ubicado en `lib/schema.sql`.*

### 4. Obtención del Token de INEGI DENUE

1.  Regístrese en el portal de desarrolladores de INEGI para obtener un token de acceso: [Portal INEGI](https://www.inegi.org.mx/app/api/denue/v1/token/).
2.  El token será enviado a su correo electrónico.
3.  Ingrese el token en el campo de configuración del sitio web o guárdelo directamente en la variable de entorno `DENUE_API_TOKEN` en el archivo `.env`.

### 5. Ejecución en Desarrollo

Instale dependencias y ejecute el servidor local:

```bash
npm install
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Despliegue en Vercel

Para desplegar la aplicación en Vercel:

1.  Suba el código al repositorio de GitHub: `https://github.com/charlyycastro03/api_MX.git`.
2.  Importe el proyecto desde la consola de Vercel.
3.  Configure las variables de entorno en Vercel con los datos de producción de su base de datos y su token del INEGI (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DENUE_API_TOKEN`).
4.  Ejecute el despliegue.
