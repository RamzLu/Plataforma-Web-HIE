// Tipos y textos de los estados editoriales, compartidos por las etiquetas y los filtros del panel.

/** Acepta el estado del backend (PENDIENTE_APROBACION, PUBLICADO...) o la etiqueta ya traducida ("Publicada"...). */
export const tipoDeEstado = (estado = "") => {
  const valor = String(estado).toUpperCase();
  if (valor.includes("ELIMINA")) return "eliminacion";
  if (valor.includes("PENDIENTE")) return "pendiente";
  if (valor.includes("RECHAZAD")) return "rechazado";
  if (valor.includes("PUBLICAD")) return "publicado";
  if (valor.includes("APROBAD") || valor.includes("PROGRAMAD")) return "programado";
  if (valor.includes("ARCHIVAD")) return "archivado";
  if (valor.includes("BORRADOR")) return "borrador";
  return "pendiente";
};

const TEXTOS = {
  pendiente: "Pendiente de aprobación",
  programado: "Programado",
  publicado: "Publicado",
  rechazado: "Rechazado",
  archivado: "Archivado",
  borrador: "Borrador",
  eliminacion: "Eliminación solicitada",
};

/** El texto de siempre para un estado del backend, igual en el panel del CMS y en el del Admin. */
export const textoDeEstado = (estado) => TEXTOS[tipoDeEstado(estado)];
