// Qué está viendo hoy el público del portal.
//
// Cuando se edita algo publicado, el registro pasa a "pendiente" (o "rechazado"), pero el portal sigue mostrando
// la versión anterior hasta que se apruebe el cambio. El servidor lo informa en "visibleEnPortal" y, si el
// título cambió, el nombre con el que sigue publicado en "tituloPublicado".

const PUBLICADOS = ["PUBLICADO", "APROBADO"];
const EDICION_EN_CURSO = ["PENDIENTE_APROBACION", "PENDIENTE", "RECHAZADO"];

const estadoDe = (item) => String(item?.estado || "").toUpperCase();

/** ¿Está publicado según su estado? */
export const estaPublicadoPorEstado = (item) => PUBLICADOS.includes(estadoDe(item));

/** ¿El portal lo está mostrando ahora? Incluye lo publicado que tiene una nueva versión pendiente o rechazada. */
export const estaPublicadoEnPortal = (item) => Boolean(item?.visibleEnPortal) || estaPublicadoPorEstado(item);

/** Una versión nueva (pendiente o rechazada) sobre algo que sigue publicado. */
export const esEdicionSobrePublicado = (item) => Boolean(item?.visibleEnPortal) && EDICION_EN_CURSO.includes(estadoDe(item));

/**
 * Título para mostrar en una lista. En la lista de "Publicados" (`activo`), si hay una versión nueva en revisión
 * o rechazada, se muestra el nombre con el que está publicado hoy y no el de la edición; en las demás listas, el actual.
 */
export const tituloEnLista = (item, activo, actual) => {
  const publicado = String(item?.tituloPublicado || "").trim();
  return activo && publicado && esEdicionSobrePublicado(item) ? publicado : actual;
};

/**
 * Para la lista de "Publicados": lo publicado que tiene una actualización pendiente o rechazada se muestra como
 * publicado (es lo que ve el portal). Se agrega "estadoVista" / "statusVista" sin tocar el estado real, para que
 * editar, revisar o eliminar sigan trabajando sobre la actualización.
 */
export const vistaPublicados = (lista, activo) =>
  !activo
    ? lista
    : lista.map((item) => {
        if (!esEdicionSobrePublicado(item)) return item;
        const status = typeof item.status === "string" ? (item.status === item.status.toUpperCase() ? "PUBLICADO" : "Publicado") : undefined;
        return { ...item, estadoVista: "PUBLICADO", ...(status ? { statusVista: status } : {}) };
      });

/**
 * ¿Eliminarlo requiere que lo apruebe el administrador? Sí si está a la vista del público (o programado).
 * Coincide con la regla del servidor: lo que ya es público no se borra directo, queda una solicitud.
 */
export const requiereAprobacionParaEliminar = (item) => estaPublicadoEnPortal(item) || estadoDe(item) === "PROGRAMADO";
