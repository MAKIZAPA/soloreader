<div align="center">

  <h1>SOLOREADER</h1>

  <p><b>La Suite de Lectura Web & Local para Manhwas, Mangas y Webtoons</b></p>
  <p><i>Arquitectura abierta inspirada en Tachiyomi y Mihon. Scraping en tiempo real para Olympus Scan, Dragon Translation, MangaDex y Rncalation. Autenticación ligera serverless para Vercel, tracking con AniList y lector offline sin publicidad.</i></p>

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

  <img src="assets/banner.svg" alt="SoloReader Banner" width="100%" />

  <br/><br/>

  <sub>
    <a href="#características">Características</a> •
    <a href="#marco-legal--dmca">Legal & DMCA</a> •
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

* **Lector Cascada Continuo**: Modo vertical gapless optimizado para Manhwas, Webtoons y Mangas en móvil y escritorio.
* **Multi-Fuente & Búsqueda Global**: Catálogo unificado con buscador en tiempo real y filtros por estado y formato.
* **Sincronización con AniList**: Vinculación de biblioteca y actualización automática del progreso de capítulos leídos.
* **Ecosistema Mihon & Tachiyomi**: Importador y exportador nativo de copias de seguridad (`.tachibk` y `.json`).
* **Biblioteca & Estadísticas**: Guardado automático en el navegador y sincronización opcional con cuentas en la nube.
* **Lector Offline**: Soporte para abrir carpetas e imágenes locales directamente desde tu dispositivo.

---

## Marco Legal & DMCA

1. **Cero Alojamiento**: Este software no aloja, almacena ni distribuye imágenes, capítulos ni contenido con derechos de autor.
2. **Visualizador Neutral**: Funciona como un navegador especializado e indexador local a petición exclusiva del usuario.
3. **Respeto a los Creadores**: Todos los derechos comerciales pertenecen a sus autores originales y grupos de scanlation.

---

## Instalación

### Prerrequisitos
- **Node.js**: v20.0.0 o superior (verificado en v26+)
- **npm** o gestor de paquetes preferido

```bash
# 1. Clonar el repositorio
git clone https://github.com/MAKIZAPA/soloreader.git

# 2. Entrar al directorio del proyecto
cd soloreader

# 3. Instalar las dependencias
npm install

# 4. Iniciar el servidor de desarrollo local
npm run dev

# 5. Abrir en el navegador
# -> http://localhost:3000
```

---

## Despliegue en Vercel

SoloReader está completamente optimizado para ejecutarse en la infraestructura serverless de **Vercel**:

### 1. Variables de Entorno (Opcional para Cuentas en la Nube)
Para que los usuarios puedan guardar sus cuentas, biblioteca e historial en la nube de Vercel de forma permanente:
1. Crea una base de datos PostgreSQL gratuita en [Neon.tech](https://neon.tech) o [Supabase.com](https://supabase.com) (toma menos de 1 minuto y no requiere tarjeta).
2. En el panel de tu proyecto en Vercel (**Settings &gt; Environment Variables**), agrega:
   - `DATABASE_URL`: La URL de conexión PostgreSQL (ej. `postgresql://usuario:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).
   - `SESSION_SECRET`: Una cadena de texto aleatoria de al menos 32 caracteres para firmar las cookies de sesión.

*Nota:* Si no configuras `DATABASE_URL`, la aplicación funcionará de manera normal utilizando la biblioteca local del navegador (`localStorage`) para cada dispositivo.

### 2. Despliegue con un Clic vía GitHub
1. Haz un push de este repositorio a tu cuenta de GitHub: `https://github.com/MAKIZAPA/lector-manga` (o renómbralo a `soloreader`).
2. En [vercel.com](https://vercel.com), selecciona **Add New Project** e importa tu repositorio.
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
