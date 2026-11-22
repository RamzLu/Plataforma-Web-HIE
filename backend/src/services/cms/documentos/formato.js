// Cómo se le muestra un documento al panel y al portal.

import { supabase } from "../../../config/supabase.js";
import { nombreDeUsuario } from "../../../utils/user.utils.js";
import { cambiosParaCliente } from "../../../utils/cambios.utils.js";
import { estaVisibleEnPortal, nombreDeLaVersionPublica, conservaVersionPublica } from "../../../utils/eliminacion.utils.js";
import { BUCKET_DOCUMENTOS } from "./archivo.js";

export const CATEGORIA_POR_DEFECTO = "Información institucional";

const ESTADO_EN_PANEL = {
  PUBLICADO: "publicado",
  APROBADO: "aprobado",
  PENDIENTE_APROBACION: "pendiente",
  RECHAZADO: "rechazado",
  PROGRAMADO: "programado",
  ARCHIVADO: "archivado",
};

/** URL pública del archivo de un documento ("" si no tiene). */
export const urlDocumento = (archivo) =>
  archivo ? supabase.storage.from(BUCKET_DOCUMENTOS).getPublicUrl(archivo.nombreArchivo).data.publicUrl : "";

/** Los datos del archivo adjunto tal como se muestran (nombre, tipo, tamaño y URL). */
export const datosDeArchivo = (archivo) => ({
  fileName: archivo?.nombreOriginal || "",
  fileType: archivo?.extension ? archivo.extension.toUpperCase() : "PDF",
  fileSize: archivo?.tamanioBytes ? `${(Number(archivo.tamanioBytes) / (1024 * 1024)).toFixed(1)} MB` : "",
  fileUrl: urlDocumento(archivo),
});

/** Un documento tal como lo lee el panel y el portal. */
export const formatearDocumento = (doc, motivoRechazo = null, pendingMeta = null) => {
  const estadoUpper = (doc.estado || "PENDIENTE_APROBACION").toUpperCase();
  const creatorName = doc.creador ? nombreDeUsuario(doc.creador) : pendingMeta?.editor || "Editor CMS";
  // Con una edición pendiente o rechazada sobre algo publicado, el Admin sigue viendo qué se quería cambiar
  // y puede abrir la versión publicada (la que ve el portal).
  const conserva = conservaVersionPublica(doc, pendingMeta);

  return {
    id: doc.id.toString(),
    title: doc.titulo,
    description: doc.descripcion || "",
    category: doc.categoria_documento?.nombre || CATEGORIA_POR_DEFECTO,
    status: ESTADO_EN_PANEL[estadoUpper] || "borrador",
    estado: estadoUpper,
    visibleEnPortal: estaVisibleEnPortal(doc, pendingMeta),
    tituloPublicado: nombreDeLaVersionPublica(doc, pendingMeta, "titulo"),
    creator: creatorName,
    editor: creatorName,
    editedBy: doc.editor ? nombreDeUsuario(doc.editor) : null,
    ...datosDeArchivo(doc.archivo),
    rejectionReason: motivoRechazo,
    requestedEstado: pendingMeta?.targetEstado || null,
    previousEstado: pendingMeta?.previousEstado || null,
    cambios: estadoUpper === "PENDIENTE_APROBACION" || conserva ? cambiosParaCliente(pendingMeta?.cambios) : [],
    esActualizacion: (estadoUpper === "PENDIENTE_APROBACION" || conserva) && Boolean(pendingMeta?.esActualizacion),
    versionPublicada: conserva ? formatearVersionPublicada(doc, pendingMeta) : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt || doc.createdAt,
  };
};

/** La versión publicada (guardada) de un documento que tiene una edición en revisión: es lo que ve el portal. */
export const formatearVersionPublicada = (doc, meta) => {
  const publica = meta.snapshotPublico;
  const actual = datosDeArchivo(doc.archivo);
  return {
    id: doc.id.toString(),
    title: publica.titulo || doc.titulo,
    description: publica.descripcion || doc.descripcion || "",
    category: publica.category || doc.categoria_documento?.nombre || CATEGORIA_POR_DEFECTO,
    status: "publicado",
    estado: "PUBLICADO",
    visibleEnPortal: true,
    creator: meta.editor || "Editor CMS",
    editor: meta.editor || "Editor CMS",
    editedBy: null,
    fileName: publica.fileName || doc.archivo?.nombreOriginal || "",
    fileType: publica.fileType || actual.fileType,
    fileSize: publica.fileSize || actual.fileSize,
    fileUrl: publica.fileUrl || actual.fileUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt || doc.createdAt,
  };
};
