/** Fecha válida (Date) o null: acepta lo que `new Date()` entienda; vacío o inválido da null. */
export const parsearFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};
