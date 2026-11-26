# Frontend — Plataforma Web HIE

Portal público, CMS (`/cms`) y panel de administración (`/admin`) en React + Vite.

La puesta en marcha, las variables de entorno y la descripción de la API están en el [README principal](../README.md).

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/pages/public` | Páginas del portal |
| `src/pages/cms`, `src/pages/admin` | Secciones de cada panel (`/cms/:seccion`, `/admin/:seccion`) |
| `src/components` | Componentes compartidos, de layout y de cada panel |
| `src/api` | Única capa de acceso a la API (`/portal` sin token, `/cms` con token) |
| `src/styles` | Hojas de estilo por página, sección y componente |
| `src/config/keycloak.js` | Cliente de Keycloak |
