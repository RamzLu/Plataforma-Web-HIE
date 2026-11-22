// Cómo se le muestra una capacitación al panel y al portal (a partir del registro y su contenido en JSON).

import { supabase } from "../../../config/supabase.js";
import { sanitizarUrlLectura } from "../../../utils/sanitize.utils.js";
import { cambiosParaCliente } from "../../../utils/cambios.utils.js";
import { estaVisibleEnPortal, nombreDeLaVersionPublica, conservaVersionPublica } from "../../../utils/eliminacion.utils.js";
import { BUCKET_MEDIOS } from "./archivos.js";

export const formatearCapacitacion = (c, motivoRechazo = null, pendingMeta = null) => {
  let extra = {
    temario: "",
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    horario: "10:00",
    ubicacion: "Hospital Interdistrital Evita",
    disertantes: "",
    archivoTipo: "",
    archivoNombre: "",
    archivoTamano: "",
    archivoUrl: "",
    videoUrl: "",
    imagenUrl: "",
  };

  if (c.contenido) {
    try {
      const parsed = JSON.parse(c.contenido);
      if (typeof parsed === "object" && parsed !== null) {
        extra = { ...extra, ...parsed };
      }
    } catch {
      extra.temario = c.contenido;
    }
  }

  let bannerUrl = extra.bannerUrl || extra.imagenUrl || "";
  let bannerNombre = extra.bannerNombre || "";

  if (c.archivo && !bannerUrl) {
    const { data: pubData } = supabase.storage.from(BUCKET_MEDIOS).getPublicUrl(c.archivo.nombreArchivo);
    bannerUrl = pubData?.publicUrl || "";
    if (!bannerNombre) bannerNombre = c.archivo.nombreOriginal || "";
  }
  if (bannerUrl && bannerUrl.startsWith("blob:")) {
    bannerUrl = "";
  }

  let archivoUrl = extra.archivoUrl || "";
  let archivoNombre = extra.archivoNombre || "";
  let archivoTamano = extra.archivoTamano || "";
  let archivoTipo = extra.archivoTipo || "";

  if (archivoUrl && archivoUrl.startsWith("blob:")) {
    archivoUrl = "";
  }

  if (!archivoTipo && archivoUrl) {
    if (archivoUrl.match(/\.(mp4|webm|mov|mkv)$/i)) archivoTipo = "video";
    else if (archivoUrl.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) archivoTipo = "imagen";
    else if (archivoUrl.match(/\.(pdf|doc|docx)$/i)) archivoTipo = "documento";
  }

  let rawVideo;
  if (archivoTipo === "documento" || archivoTipo === "imagen") {
    rawVideo = "";
  } else if (archivoTipo === "video") {
    rawVideo = extra.videoUrl || archivoUrl || c.videoUrl || "";
  } else {
    rawVideo = c.videoUrl || extra.videoUrl || "";
  }
  if (rawVideo && rawVideo.startsWith("blob:")) {
    rawVideo = "";
  }
  const finalVideoUrl = sanitizarUrlLectura(rawVideo, "");
  const safeArchivoUrl = sanitizarUrlLectura(archivoUrl, "");
  const safeBannerUrl = sanitizarUrlLectura(bannerUrl, "");

  const resolvedTipoRecurso = archivoTipo === "video"
    ? "video"
    : archivoTipo === "documento"
    ? "pdf"
    : archivoTipo === "imagen"
    ? "imagen"
    : (extra.tipoRecurso || "presencial");

  return {
    id: c.id.toString(),
    titulo: c.titulo,
    descripcion: c.descripcion || "",
    contenido: extra.temario || c.descripcion || "",
    temario: extra.temario || "",
    modalidad: extra.modalidad || "Presencial",
    tipoRecurso: resolvedTipoRecurso,
    fechaInicio: c.fechaInicio ? c.fechaInicio.toISOString().split("T")[0] : "",
    fechaFin: c.fechaFin ? c.fechaFin.toISOString().split("T")[0] : "",
    horario: extra.horario || "10:00",
    ubicacion: extra.ubicacion || "Hospital Interdistrital Evita",
    disertantes: extra.disertantes || "",
    videoUrl: finalVideoUrl,
    archivoTipo,
    archivoNombre,
    archivoTamano,
    archivoUrl: safeArchivoUrl,
    bannerUrl: safeBannerUrl,
    bannerNombre,
    imagenUrl: safeBannerUrl,
    estado: c.estado,
    visibleEnPortal: estaVisibleEnPortal(c, pendingMeta),
    tituloPublicado: nombreDeLaVersionPublica(c, pendingMeta, "titulo"),
    activo: c.activo,
    createdAt: c.createdAt ? c.createdAt.toISOString() : "",
    updatedAt: c.updatedAt ? c.updatedAt.toISOString() : "",

    requestedEstado: (c.estado || "").toUpperCase() === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
    cambios: (c.estado || "").toUpperCase() === "PENDIENTE_APROBACION" || conservaVersionPublica(c, pendingMeta) ? cambiosParaCliente(pendingMeta?.cambios) : [],
    esActualizacion: ((c.estado || "").toUpperCase() === "PENDIENTE_APROBACION" || conservaVersionPublica(c, pendingMeta)) && Boolean(pendingMeta?.esActualizacion),
    // La versión publicada (la que ve el portal) mientras la actualización está en revisión o rechazada.
    versionPublicada: conservaVersionPublica(c, pendingMeta)
      ? formatearCapacitacion(
          {
            ...c,
            ...pendingMeta.snapshotPublico,
            estado: "PUBLICADO",
            fechaInicio: pendingMeta.snapshotPublico.fechaInicio ? new Date(pendingMeta.snapshotPublico.fechaInicio) : null,
            fechaFin: pendingMeta.snapshotPublico.fechaFin ? new Date(pendingMeta.snapshotPublico.fechaFin) : null,
          },
          null,
          null
        )
      : null,
    editor: pendingMeta?.editor || null,
    motivoRechazo: motivoRechazo || null,
    rejectionReason: motivoRechazo || null,
  };
};
