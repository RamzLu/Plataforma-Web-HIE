// Cómo se le muestra un profesional al panel y al portal.

import { supabase } from "../../../config/supabase.js";
import { BUCKET_FOTOS } from "./foto.js";

export const formatearFecha = (fecha) => {
  if (!fecha) return "Reciente";
  try {
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } catch {
    // Fecha inválida: se muestra el texto por defecto.
  }
  return "Reciente";
};

// Estado tal como lo entiende el CMS: APROBADO cuenta como publicado y BORRADOR como archivado.
export const estadoDe = (prof) => {
  const estado = (prof?.estado || "").toUpperCase();
  if (estado === "APROBADO") return "PUBLICADO";
  if (estado === "BORRADOR") return "ARCHIVADO";
  return estado || "PENDIENTE_APROBACION";
};

/** URL pública de la foto de un profesional ("" si no tiene). */
export const urlFoto = (archivo) =>
  archivo ? supabase.storage.from(BUCKET_FOTOS).getPublicUrl(archivo.nombreArchivo).data.publicUrl : "";

/** Un profesional tal como lo lee el panel y el portal. `servicios` sirve para ubicar el área de los servicios clave. */
export const construirItemProfesional = (prof, servicios, options = {}) => {
  const pubUrl = urlFoto(prof.archivo);

  // Lógica Puente: Verificamos si está guardado como un Servicio en la tabla Area
  const isServicio = prof.especialidad?.nombre === "Servicio Clave";
  let nombreMostrar = prof.especialidad?.nombre || "Sin Asignar";
  let realIdForFrontend = prof.especialidadId ? prof.especialidadId.toString() : "";

  if (isServicio && prof.profesional_area && prof.profesional_area.length > 0) {
    nombreMostrar = prof.profesional_area[0].area.nombre;
    const matchedServicio = servicios.find((s) => s.nombre === nombreMostrar);
    if (matchedServicio) {
      realIdForFrontend = matchedServicio.id.toString();
    }
  }

  const estado = options.estado || estadoDe(prof);
  const editor = options.editor || "Editor CMS";
  const fechaCarga = formatearFecha(prof.createdAt);
  const fechaActualizacion = formatearFecha(options.updatedAt || prof.updatedAt || prof.createdAt);

  return {
    id: prof.id.toString(),
    nombre: prof.nombre,
    apellido: prof.apellido,
    matricula: prof.matricula || "",
    cargo: prof.cargo || "",
    descripcion: prof.descripcion || "",
    especialidadNombre: nombreMostrar,
    esServicioClave: isServicio,
    especialidadId: realIdForFrontend,
    estado,
    publicado: estado === "PUBLICADO",
    activo: prof.activo !== false,
    visibleEnPortal: Boolean(options.visibleEnPortal),
    tituloPublicado: options.tituloPublicado || null,
    rejectionReason: options.rejectionReason || null,
    editor,
    fechaCarga,
    fechaActualizacion,
    imagenUrl: pubUrl,
    cambios: options.cambios || [],
    esActualizacion: Boolean(options.esActualizacion),
    requestedEstado: options.requestedEstado || null,
    createdAt: prof.createdAt,
    updatedAt: prof.updatedAt,
  };
};

/** Lo que se devuelve al crear o editar un profesional (sin recalcular el área desde la base). */
export const armarRespuestaGuardado = ({ prof, areaNombre, esServicio, especialidadId, estado, activo, editor, nowIso, visibleEnPortal = false }) => ({
  id: prof.id.toString(),
  nombre: prof.nombre,
  apellido: prof.apellido,
  matricula: prof.matricula || "",
  cargo: prof.cargo || "",
  descripcion: prof.descripcion || "",
  especialidadNombre: areaNombre || prof.especialidad.nombre,
  esServicioClave: esServicio,
  especialidadId: especialidadId.toString(),
  estado: estadoDe({ estado }),
  publicado: false,
  activo,
  visibleEnPortal,
  rejectionReason: null,
  editor,
  fechaCarga: formatearFecha(prof.createdAt),
  fechaActualizacion: formatearFecha(nowIso),
  imagenUrl: urlFoto(prof.archivo),
});
