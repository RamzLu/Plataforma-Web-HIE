# Plataforma Web HIE

Portal institucional del Hospital Interdistrital Evita, con un **CMS** para cargar contenido y un **panel de administración** que lo revisa antes de publicarlo.

| Parte | Tecnología | Carpeta |
|---|---|---|
| Portal público, CMS y Admin | React 19 + Vite | `frontend/` |
| API | Node.js + Express 5 | `backend/` |
| Base de datos | PostgreSQL (Supabase) con Prisma 7 | `backend/prisma/` |
| Archivos (imágenes, PDF) | Supabase Storage | — |
| Inicio de sesión | Keycloak | — |

## Puesta en marcha

Requisitos: Node.js 22 o superior, acceso a la base de Supabase y un Keycloak con el realm configurado.

```bash
npm install                      # concurrently (raíz)
npm install --prefix backend
npm install --prefix frontend

cp backend/.env.example backend/.env     # completar los valores
cp frontend/.env.example frontend/.env

npm run db-generate --prefix backend     # genera el cliente de Prisma
npm run dev                              # backend (3000) + frontend (5173)
```

- Portal: http://localhost:5173
- CMS: http://localhost:5173/cms
- Admin: http://localhost:5173/admin
- Estado de la API: http://localhost:3000/api/health

## Base de datos y migraciones

El esquema está en `backend/prisma/schema.prisma` y los cambios se aplican con migraciones (`backend/prisma/migrations`).

```bash
npm run migrate-status --prefix backend   # qué migraciones faltan aplicar
npm run migrate-deploy --prefix backend   # aplica las pendientes
```

> **No usar `prisma migrate dev` ni `prisma db push` contra la base compartida.** La base tiene historial previo a las migraciones del repo y `migrate dev` ofrece resetearla (borra todos los datos). Para crear una migración nueva, generar el SQL con `prisma migrate diff` y aplicarlo con `migrate-deploy`.

## API

| Prefijo | Uso | Autenticación |
|---|---|---|
| `/api/portal/...` | Lectura de contenido publicado para el sitio público | No |
| `/api/cms/...` | Todo lo del CMS y del Admin (borradores, edición, revisión) | Token de Keycloak |
| `/api/health` | Estado del servidor y de la base | No |

En el frontend, todas las llamadas pasan por `src/api/*.api.js`; el cliente de `src/api/axiosConfig.js` agrega el token a las rutas `/cms` automáticamente.

### Módulos con flujo editorial

Noticias (`noticias`), documentación (`documentacion`), profesionales (`profesionales`), especialidades y servicios (`especialidades`), residencias (`residencias`) y capacitaciones (`capacitaciones`) exponen **las mismas rutas**. El CM pide y el Admin revisa:

| Ruta | Quién | Qué hace |
|---|---|---|
| `GET /api/portal/<módulo>` | Público | Solo lo publicado |
| `GET /api/cms/<módulo>` | CM y Admin | Todo (borradores, pendientes, rechazados...) |
| `POST /api/cms/<módulo>` | CM | Crea. El campo `estado` pide qué hacer: `BORRADOR`, `PUBLICADO`, `PROGRAMADO` o `ARCHIVADO` |
| `PUT /api/cms/<módulo>/:id` | CM | Edita o pide un cambio de estado (con `estado`). Si estaba publicado, queda pendiente |
| `PATCH /api/cms/<módulo>/:id/revision` | Admin | `{ "decision": "APROBAR" \| "RECHAZAR", "motivo": "..." }` (el rechazo exige motivo) |
| `DELETE /api/cms/<módulo>/:id` | CM | Elimina. Si está publicado responde `202` y queda una solicitud para el Admin |

`POST`, `PUT` y `PATCH` responden `{ message, data }`, con el registro en `data`. Especialidades y servicios comparten ruta: se distinguen con `esServicio` (en el cuerpo, o como parámetro de la URL al eliminar).

Cada cuerpo se valida con [zod](https://zod.dev) antes de llegar al controlador (`backend/src/validation/editorial.schemas.js`): tipos, largos de la base, estados permitidos, fechas y campos obligatorios. Si algo no es válido responde `400` con `{ success: false, error: { code: "VALIDATION_ERROR", message, details: [{ campo, mensaje }] } }`, con el mensaje ya en español para mostrarlo tal cual. Los campos que el esquema no menciona pasan sin tocarse.

Las rutas se arman en un solo lugar (`backend/src/routes/cms.routes.js`) a partir de la lista de `backend/src/services/cms/editorial.modulos.js`, y el frontend las usa con `src/api/editorial.api.js`. Para sumar un módulo se agrega una entrada a esa lista.

### Cómo está organizado el backend

Los servicios de cada módulo están en `backend/src/services/cms/`. El archivo `cms.<módulo>.service.js` tiene la lógica del flujo (crear, editar, revisar, eliminar, listar) y lo demás vive en una carpeta con el nombre del módulo, siempre con la misma forma:

| Archivo | Qué tiene |
|---|---|
| `formato.js` | Cómo se le muestra el registro al panel y al portal |
| `cambios.js` | Qué campos cambiaron al editar (lo que ve el Admin al revisar) |
| `archivos.js` / `foto.js` / `imagenes.js` | Subida, reemplazo y protección de los archivos del módulo |
| `datos.js`, `categoria.js`, `area.js`, `seed.js` | Datos propios de cada módulo |

Lo que es común a varios módulos está en `backend/src/utils/`: `flujoEditorial.utils.js` (las reglas de qué pasa al pedir y al decidir), `almacenamiento.utils.js` (subir archivos), `archivos.utils.js` (borrar los que ya no usa nadie al aprobar), `editor.utils.js` (quién editó) y `cambios.utils.js`.

Contenido gráfico (`cms.contenidoGrafico.service.js`) tiene un flujo por tipo de espacio en `contenidoGrafico/flujos/` y su formato por tipo en `contenidoGrafico/formatos/`.

## Roles y flujo editorial

Los roles salen del token de Keycloak (realm o cliente):

- **CM** (`cm`, `editor-cms`, `cms`): crea y edita contenido. Lo que pide publicar queda *pendiente de aprobación*.
- **Administrador** (`admin-hie`, `admin-hief`, `admin`, ...): aprueba o rechaza, y resuelve los pedidos de eliminación de contenido publicado.

Las listas de roles están duplicadas en `backend/src/middlewares/auth.middleware.js` y `frontend/src/utils/roles.js`: si se cambia una, hay que cambiar la otra.

Para probar el circuito completo en una misma computadora, usar dos perfiles del navegador (uno con un usuario CM y otro con un administrador): Keycloak mantiene una sola sesión por navegador.

## Almacenamiento

Buckets de Supabase Storage que usa el backend: `noticias-imagenes`, `documentos`, `banners-imagenes`, `autoridades-imagenes`, `capacitaciones-imagenes-videos`, `capacitaciones-documentos`.

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` (raíz) | Levanta backend y frontend juntos |
| `npm test --prefix backend` | Tests del backend (`node --test`) |
| `npm run lint --prefix frontend` | ESLint del frontend |
| `npm run build --prefix frontend` | Build de producción del frontend |

## Despliegue

- El frontend es una SPA: el servidor que la publique tiene que devolver `index.html` para cualquier ruta (por ejemplo `/cms/noticias`), si no los links directos a secciones dan 404.
- En el backend, definir `NODE_ENV=production`, `CORS_ORIGINS` con el dominio del frontend y, si hay proxy delante, `TRUST_PROXY`.
