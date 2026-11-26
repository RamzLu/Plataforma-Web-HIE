// Cómo se le muestra una noticia al panel y al portal.

import { nombreDeUsuario } from "../../../utils/user.utils.js";

/** Quién la creó ("editor") y quién la editó por última vez ("editedBy", puede no haber). */
export const nombresDeEditores = (noticia) => ({
  editor: noticia.creador ? nombreDeUsuario(noticia.creador) : "Editor CMS",
  editedBy: noticia.editor ? nombreDeUsuario(noticia.editor) : null,
});

const fechaDeCarga = (noticia) => new Date(noticia.createdAt).toLocaleDateString("es-AR");

/**
 * La noticia tal como la lee el panel (listado y resultado de una revisión).
 * `extra` suma campos propios de cada caso (cambios pendientes, etc.).
 */
export const formatearNoticia = (noticia, { imagenes, categoria, requestedEstado, previousEstado, rejectionReason, visibleEnPortal = false, tituloPublicado = null, extra = {} }) => ({
  id: noticia.id.toString(),
  title: noticia.titulo,
  titulo: noticia.titulo,
  body: [noticia.contenido],
  contenido: noticia.contenido,
  date: fechaDeCarga(noticia),
  fechaPublicacion: noticia.fechaPublicacion,
  createdAt: noticia.createdAt,
  updatedAt: noticia.updatedAt,
  category: categoria,
  estado: noticia.estado,
  requestedEstado,
  previousEstado,
  isDraft: noticia.estado === "BORRADOR",
  visibleEnPortal,
  tituloPublicado,
  images: imagenes,
  ...nombresDeEditores(noticia),
  rejectionReason,
  ...extra,
});

/** La versión publicada (guardada) de una noticia que tiene una edición en revisión: es lo que ve el portal. */
export const formatearVersionPublicada = (noticia, versionPublica) => ({
  id: noticia.id.toString(),
  title: versionPublica.titulo,
  titulo: versionPublica.titulo,
  body: [versionPublica.contenido],
  contenido: versionPublica.contenido,
  date: fechaDeCarga(noticia),
  fechaPublicacion: noticia.fechaPublicacion,
  createdAt: noticia.createdAt,
  updatedAt: noticia.updatedAt,
  category: versionPublica.category || "General",
  estado: "PUBLICADO",
  visibleEnPortal: true,
  isDraft: false,
  images: versionPublica.images || [],
  editor: noticia.creador ? nombreDeUsuario(noticia.creador) : "Editor CMS",
  editedBy: null,
  rejectionReason: null,
});

/** Lo que se devuelve al crear o editar una noticia (el registro tal cual, más los campos que usa el panel). */
export const formatearNoticiaGuardada = (noticia, { categoria, requestedEstado, previousEstado, imagenes, editor, editedBy, rejectionReason, visibleEnPortal = false }) => ({
  ...noticia,
  id: noticia.id.toString(),
  categoriaId: noticia.categoriaId.toString(),
  category: categoria,
  estado: noticia.estado,
  requestedEstado,
  previousEstado,
  isDraft: noticia.estado === "BORRADOR",
  visibleEnPortal,
  images: imagenes,
  editor,
  editedBy,
  rejectionReason,
});
