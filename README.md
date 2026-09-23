<div align="center">

  <h1>LECTOR MANGA</h1>

  <p><b>La Suite de Lectura Web & Local para Manhwas, Mangas y Webtoons</b></p>
  <p><i>Arquitectura abierta inspirada en Tachiyomi y Tachimanga. Scraping en tiempo real para Olympus Scan, Dragon Translation, MangaDex y Rncalation. Autenticación ligera serverless para Vercel, tracking con AniList y lector offline sin publicidad.</i></p>

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="License" /></a>
    <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vercel_Ready-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/AniList_Sync-02A9FF?style=for-the-badge&logo=anilist&logoColor=white" alt="AniList" />
  </p>

  <br/>

  <img src="assets/banner.svg" alt="Lector Manga Banner" width="100%" />

  <br/><br/>

  <sub>
    <a href="#características">Características</a> •
    <a href="#arquitectura-legal--dmca">Legal & DMCA</a> •
    <a href="#instalación">Instalación</a> •
    <a href="#despliegue-en-vercel">Despliegue Vercel</a> •
    <a href="#atajos-de-teclado">Atajos</a> •
    <a href="#comandos">Comandos</a> •
    <a href="#aviso-legal">Aviso Legal</a>
  </sub>

  <br/><br/>
</div>

---

## Características

<table>
  <tr>
    <td width="50%">
      <img src="https://img.shields.io/badge/SCRAPING-OLYMPUS_SCAN_API-10b981?style=flat-square" alt="Olympus" /><br/>
      <b>Scraping Dinámico para Olympus Scan</b><br/>
      Integración directa con los endpoints de Olympus Scan. Detección automática del dominio activo mediante <code>olympus.pages.dev</code>, optimización de portadas ultra-ligeras (reducción del 90% en peso) y páginas en alta definición.
    </td>
    <td width="50%">
      <img src="https://img.shields.io/badge/SCRAPING-DRAGON_TRANSLATION-e11d48?style=flat-square" alt="Dragon" /><br/>
      <b>Scraping para Dragon Translation</b><br/>
      Integración completa mediante parsing de DOM y metadatos JSON para el catálogo de Dragon Translation. Rankings por vistas, últimos capítulos y visualización continua gapless.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://img.shields.io/badge/SCRAPING-RNCALATION_ONLINE-8b5cf6?style=flat-square" alt="Rncalation" /><br/>
      <b>Scraping para Rncalation</b><br/>
      Conector especializado para el catálogo de Rncalation (Traducciones Amistosas / Knight No Scan). Búsqueda de manhwas y novelas, selector de capítulos y lectura secuencial de páginas.
    </td>
    <td width="50%">
      <img src="https://img.shields.io/badge/CATALOG-MANGADEX_v5_API-06b6d4?style=flat-square" alt="MangaDex" /><br/>
      <b>Catálogo Global MangaDex v5</b><br/>
      Acceso a millones de títulos con soporte multilingüe (Español Latino, Español España e Inglés), filtrado por popularidad y servidor de imágenes <i>@home</i> sin publicidad intrusiva.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://img.shields.io/badge/SEARCH-GLOBAL_CROSS--SOURCE-00f0ff?style=flat-square" alt="Global Search" /><br/>
      <b>Búsqueda Global Multicanal & Selector Dinámico</b><br/>
      Buscador universal en tiempo real que consulta en paralelo Olympus, Dragon, MangaDex y Rncalation con filtros de fuente instantáneos. Selector dinámico en barra superior con animación hover y anti-parpadeo.
    </td>
    <td width="50%">
      <img src="https://img.shields.io/badge/FILTERS-STATUS_&_FORMATS-10b981?style=flat-square" alt="Filters" /><br/>
      <b>Filtros de Estado & Formato en Catálogo</b><br/>
      Filtra el catálogo entre obras <i>En emisión</i> (ongoing) y <i>Finalizadas</i> (completed), así como entre <i>Manhwas</i> (webtoons a color) y <i>Novelas</i> (traducciones de texto), con contador dinámico de títulos en tiempo real.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://img.shields.io/badge/TRACKER-ANILIST_BULK_SYNC-02a9ff?style=flat-square" alt="AniList" /><br/>
      <b>Auto-Vincular & Sincronización en Masa con AniList</b><br/>
      Escaneo progresivo por lotes con diccionario semántico para más de 120 manhwas traducidos al español, prevención de límites de tasa (HTTP 429), edición de capítulos leídos en vivo y vinculación manual asistida.
    </td>
    <td width="50%">
      <img src="https://img.shields.io/badge/AUTH-VERCEL_SERVERLESS_ACCOUNTS-10b981?style=flat-square" alt="Auth" /><br/>
      <b>Cuentas de Usuario & Sincronización en la Nube</b><br/>
      Sistema de autenticación ligero y seguro sin requerir correo electrónico. Contraseñas protegidas mediante derivación criptográfica <code>scrypt</code> con sal aleatoria y cookies seguras HttpOnly. Compatible con PostgreSQL serverless (Neon, Supabase) en Vercel y almacenamiento local automático en desarrollo.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://img.shields.io/badge/SYNC-MIHON_PROTOBUF_BACKUP-10b981?style=flat-square" alt="Mihon Backup" /><br/>
      <b>Importador de Backups Mihon & Tachiyomi</b><br/>
      Descompresor y decodificador nativo de archivos <code>.tachibk</code>, <code>.proto.gz</code> y <code>.json</code>. Detección semántica automática con normalización NFD de tildes para vincular capítulos leídos a las fuentes activas.
    </td>
    <td width="50%">
      <img src="https://img.shields.io/badge/READER-WEBTOON_CASCADE-8b5cf6?style=flat-square" alt="Webtoon" /><br/>
      <b>Lector Tipo Cascada (Webtoon) Continuo</b><br/>
      Flujo vertical sin cortes (gapless) optimizado para manhwa y webtoon con cálculo dinámico por scroll e IntersectionObserver para tracking automático del progreso de lectura.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://img.shields.io/badge/SECURITY-ANTI--HOTLINK_PROXY-e11d48?style=flat-square" alt="Proxy" /><br/>
      <b>Proxy de Streaming Anti-Hotlink</b><br/>
      Ruta de streaming HTTP dedicada (<code>/api/proxy</code>) que reenvía encabezados User-Agent y Referer específicos, eludiendo bloqueos CORS y bloqueos de dominios de imágenes en servidores remotos.
    </td>
    <td width="50%">
      <img src="https://img.shields.io/badge/OFFLINE-LOCAL_READER_SANDBOX-00f0ff?style=flat-square" alt="Offline" /><br/>
      <b>Lector de Archivos Locales 100% Offline</b><br/>
      Módulo idéntico a la fuente local de Tachiyomi. Permite arrastrar o seleccionar imágenes desde el disco local para lectura inmediata en memoria, sin conexión a Internet y con privacidad absoluta.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://img.shields.io/badge/STATS-MIHON_&_TACHIMANGA-f59e0b?style=flat-square" alt="Stats" /><br/>
      <b>Estadísticas de Biblioteca & Tiempo de Lectura</b><br/>
      Contador de series en biblioteca, capítulos totales leídos, desglose por estado y ranking descendente por tiempo activo con detección de inactividad (60s).
    </td>
    <td width="50%">
      <img src="https://img.shields.io/badge/DEPLOY-VERCEL_&_NODEJS-1e40af?style=flat-square" alt="Deploy" /><br/>
      <b>Compatibilidad Total con Vercel</b><br/>
      Construido sobre Next.js 16 App Router con Route Handlers serverless. Funciona tanto de forma local con Node.js como desplegado con un clic en Vercel sin límites de imágenes.
    </td>
  </tr>
</table>

---

## Arquitectura Legal & DMCA

Para garantizar que el proyecto pueda ser alojado con seguridad en **GitHub** y desplegado en plataformas como **Vercel** sin riesgo de reclamos o suspensión, Lector Manga implementa el mismo estándar legal que **Tachiyomi**, **Mihon**, **Paperback** y **Suwayomi**:

1. **Política de Cero Alojamiento (Zero-Hosting Policy)**: El repositorio y el servidor no alojan, almacenan ni distribuyen ningún archivo de manga, imagen o traducción protegida por derechos de autor.
2. **Framework de Visualización Neutral**: El software actúa como un navegador especializado o lector RSS, interpretando datos públicos a petición exclusiva del usuario.
3. **Mecanismo de Desacople**: Las fuentes son tratadas como proveedores modulares externos y no forman parte de una base de datos propietaria.
4. **Respeto a los Creadores**: Todos los derechos pertenecen a los autores, editoriales originales y equipos de scanlation.

---

## Seguridad & Privacidad en Git

Para subir este proyecto a **GitHub** sin comprometer tu información personal o secretos:

- El archivo `.gitignore` excluye estrictamente:
  - Archivos de respaldo personal: `*.tachibk`, `*.proto.gz`, `*.backup`, `backups/`.
  - Bases de datos locales: `*.sqlite`, `*.sqlite3`, `*.db`, `.local-data/`.
  - Secretos y variables de entorno: `.env`, `.env*.local`.
  - Datos de compilación y temporales: `.next/`, `build/`, `.vercel/`.
- Puedes hacer `git push` a tu repositorio público o privado en GitHub con total tranquilidad; ningún historial de lectura local ni archivo de backup se subirá al repositorio.

---

## Instalación

### Prerrequisitos
- **Node.js**: v20.0.0 o superior (verificado en v26+)
- **npm** o gestor de paquetes preferido

```bash
# 1. Clonar el repositorio
git clone https://github.com/MAKIZAPA/lector-manga.git

# 2. Entrar al directorio del proyecto
cd lector-manga

# 3. Instalar las dependencias
npm install

# 4. Iniciar el servidor de desarrollo local
npm run dev

# 5. Abrir en el navegador
# -> http://localhost:3000
```

---

## Despliegue en Vercel

Lector Manga está completamente optimizado para ejecutarse en la infraestructura serverless de **Vercel**:

### 1. Variables de Entorno (Opcional para Cuentas en la Nube)
Para que los usuarios puedan guardar sus cuentas, biblioteca e historial en la nube de Vercel de forma permanente:
1. Crea una base de datos PostgreSQL gratuita en [Neon.tech](https://neon.tech) o [Supabase.com](https://supabase.com) (toma menos de 1 minuto y no requiere tarjeta).
2. En el panel de tu proyecto en Vercel (**Settings &gt; Environment Variables**), agrega:
   - `DATABASE_URL`: La URL de conexión PostgreSQL (ej. `postgresql://usuario:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).
   - `SESSION_SECRET`: Una cadena de texto aleatoria de al menos 32 caracteres para firmar las cookies de sesión.

*Nota:* Si no configuras `DATABASE_URL`, la aplicación funcionará de manera normal utilizando la biblioteca local del navegador (`localStorage`) para cada dispositivo.

### 2. Despliegue con un Clic vía GitHub
1. Haz un push de este repositorio a tu cuenta de GitHub: `https://github.com/MAKIZAPA/lector-manga`.
2. En [vercel.com](https://vercel.com), selecciona **Add New Project** e importa el repositorio `lector-manga`.
3. En **Environment Variables**, añade `DATABASE_URL` y `SESSION_SECRET` (si deseas persistencia multi-dispositivo).
4. Haz clic en **Deploy**. ¡Tu lector estará en línea en segundos con dominio y SSL gratuitos!

### 3. Despliegue mediante Vercel CLI
```bash
# 1. Instalar la CLI de Vercel
npm i -g vercel

# 2. Iniciar sesión y desplegar a producción
vercel --prod
```

---

## Atajos de Teclado

| Tecla | Función |
| :---: | :--- |
| <kbd>→</kbd> / <kbd>K</kbd> | **Siguiente página** o avanzar en el scroll de lectura |
| <kbd>←</kbd> / <kbd>J</kbd> | **Página anterior** o retroceder en el scroll |
| <kbd>F</kbd> | Alternar modo **Pantalla Completa** |
| <kbd>M</kbd> | Cambiar entre modos de lectura (**Cascada / Simple / Doble**) |
| <kbd>/</kbd> o <kbd>Ctrl</kbd> + <kbd>K</kbd> | Abrir modal de **Búsqueda Instantánea** |
| <kbd>Esc</kbd> | Cerrar modales o restaurar barras de navegación (HUD) |

---

## Comandos

<details>
<summary><b>Haz clic aquí para ver todos los scripts y comandos de desarrollo</b></summary>
<br/>

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el entorno de desarrollo local con recarga rápida en el puerto 3000 |
| `npm run build` | Compila la aplicación de forma optimizada para producción con Next.js Turbopack |
| `npm run start` | Arranca el servidor de producción compilado |
| `npm test` | Ejecuta la suite de pruebas unitarias y de integración con Vitest |
| `npm run lint` | Ejecuta el análisis estático de código con ESLint |

</details>

---

## Autor & Agradecimientos

- **Desarrollado y mantenido por:** [@makizapa](https://github.com/MAKIZAPA)
- **Inspiración arquitectónica:** Ecosistemas de código abierto [Tachiyomi](https://github.com/tachiyomiorg), [Mihon](https://github.com/mihonapp) y [Suwayomi](https://github.com/Suwayomi).

---

## Aviso Legal

<details>
<summary><b>Haz clic aquí para leer el descargo de responsabilidad legal y términos</b></summary>
<br/>

Este software se proporciona únicamente con fines educativos y de investigación sobre arquitecturas de lectura web. El desarrollador no asume ninguna responsabilidad por el uso que terceros o usuarios individuales hagan de esta herramienta ni por el contenido accesible a través de fuentes o sitios web de terceros. Todas las marcas registradas pertenecen a sus respectivos dueños.

</details>

---

## Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
