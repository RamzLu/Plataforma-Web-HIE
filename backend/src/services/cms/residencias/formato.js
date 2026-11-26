// Cómo se le muestra una residencia al panel y al portal (a partir del registro y su contenido en JSON).

import { supabase } from "../../../config/supabase.js";
import { sanitizarUrlLectura } from "../../../utils/sanitize.utils.js";
import { cambiosParaCliente } from "../../../utils/cambios.utils.js";
import { estaVisibleEnPortal, nombreDeLaVersionPublica, conservaVersionPublica } from "../../../utils/eliminacion.utils.js";
import { BUCKET_BANNER } from "./archivos.js";

export const formatearResidencia = (res, motivoRechazo = null, pendingMeta = null, editor = null, updatedAtCustom = null) => {
  let extra = {
    categoria: "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
    descripcionPrograma: "",
    cupos: "",
    duracion: "",
    requisitos: "",
    reglamentoRotacion: "",
    fechaInicio: "",
    fechaPublicacion: null,
    documento: null,
  };

  if (res.contenido) {
    try {
      const parsed = JSON.parse(res.contenido);
      if (typeof parsed === "object" && parsed !== null) {
        extra = { ...extra, ...parsed };
      }
    } catch {
      // JSON inválido: se ignora y se usa el valor por defecto.
    }
  }

  let bannerUrl = "";
  let bannerNombre = "";
  if (res.archivo) {
    bannerNombre = res.archivo.nombreOriginal || "";
    const { data } = supabase.storage
      .from(BUCKET_BANNER)
      .getPublicUrl(res.archivo.nombreArchivo);
    bannerUrl = data?.publicUrl || "";
  }

  const doc = extra.documento || {};
  const documentoUrl = sanitizarUrlLectura(doc.documentoUrl, "");
  const documentoNombre = doc.documentoNombre || "";
  const documentoTamano = doc.documentoTamano || "";
  const documentoTipo = doc.documentoTipo || (documentoNombre ? documentoNombre.split(".").pop().toUpperCase() : "PDF");

  const editorResolved = editor || pendingMeta?.editor || "Editor CMS";
  const rawUpdatedAt = updatedAtCustom || pendingMeta?.updatedAt || res.updatedAt || res.createdAt;
  let fechaActualizacion = "Reciente";
  if (rawUpdatedAt) {
    try {
      const d = new Date(rawUpdatedAt);
      if (!isNaN(d.getTime())) {
        fechaActualizacion = d.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      // Fecha inválida: se muestra el texto por defecto.
    }
  }

  let fechaCarga = "Reciente";
  if (res.createdAt) {
    try {
      const d = new Date(res.createdAt);
      if (!isNaN(d.getTime())) {
        fechaCarga = d.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      // Fecha inválida: se muestra el texto por defecto.
    }
  }

  const cambios = pendingMeta?.cambios ? cambiosParaCliente(pendingMeta.cambios) : [];
  const esActualizacion = Boolean(pendingMeta?.esActualizacion);

  return {
    id: res.id.toString(),
    nombre: res.nombre,
    descripcion: res.descripcion || "",
    convocatoria: res.convocatoria || "Convocatoria Abierta",
    fechaInicio: extra.fechaInicio || "",
    fechaInicioVigencia: extra.fechaInicio || "",
    fechaConvocatoria: res.fechaConvocatoria
      ? res.fechaConvocatoria.toISOString().split("T")[0]
      : "",
    fechaPublicacion: extra.fechaPublicacion || null,
    fechaProgramada: extra.fechaPublicacion || null,
    estado: res.estado,
    visibleEnPortal: estaVisibleEnPortal(res, pendingMeta),
    tituloPublicado: nombreDeLaVersionPublica(res, pendingMeta, "nombre"),
    // La versión publicada (la que ve el portal) mientras la actualización está en revisión o rechazada.
    versionPublicada: conservaVersionPublica(res, pendingMeta)
      ? formatearResidencia(
          {
            ...res,
            ...pendingMeta.snapshotPublico,
            estado: "PUBLICADO",
            // La versión guardada vuelve de la base con las fechas como texto.
            fechaConvocatoria: pendingMeta.snapshotPublico.fechaConvocatoria ? new Date(pendingMeta.snapshotPublico.fechaConvocatoria) : null,
          },
          null,
          null,
          editor,
          updatedAtCustom
        )
      : null,
    activo: res.activo,
    createdAt: res.createdAt ? res.createdAt.toISOString() : "",
    updatedAt: res.updatedAt ? res.updatedAt.toISOString() : "",

    categoria: extra.categoria || "Formación Médica de Posgrado - Ministerio de Desarrollo Humano",
    descripcionPrograma: extra.descripcionPrograma || "",
    cupos: extra.cupos || "",
    duracion: extra.duracion || "",
    requisitos: extra.requisitos || "",
    reglamentoRotacion: extra.reglamentoRotacion || "",

    bannerId: res.imagenId ? res.imagenId.toString() : null,
    bannerNombre,
    bannerUrl,

    documentoId: doc.documentoId || null,
    documentoNombre,
    documentoTamano,
    documentoTipo,
    documentoUrl,

    archivoNombre: documentoNombre,
    archivoUrl: documentoUrl,
    archivoTamano: documentoTamano,
    archivoTipo: documentoTipo,

    editor: editorResolved,
    fechaActualizacion,
    fechaCarga,
    cambios,
    esActualizacion,

    requestedEstado: (res.estado || "").toUpperCase() === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
    motivoRechazo: motivoRechazo || null,
    rejectionReason: motivoRechazo || null,
  };
};
