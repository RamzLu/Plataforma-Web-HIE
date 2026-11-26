// Utilidades para la publicación programada de contenidos (noticias y residencias).

const UN_MINUTO_MS = 60 * 1000;

/**
 * Devuelve el límite hasta el cual el cron debe publicar contenidos programados: el último
 * milisegundo del minuto actual.
 *
 * El cron corre al segundo 0 de cada minuto y en el CMS la hora se elige por minuto (sin segundos),
 * pero la fecha guardada puede traer milisegundos (por ejemplo 21:30:00.450). Si se comparara con la
 * hora exacta del cron (21:30:00.002), esa noticia quedaría para la vuelta siguiente y se publicaría
 * un minuto tarde. Se redondea al minuto más cercano por si el cron se dispara unos milisegundos antes.
 */
export const limitePublicacionProgramada = (ahoraMs = Date.now()) => {
  const minutoActual = Math.round(ahoraMs / UN_MINUTO_MS) * UN_MINUTO_MS;
  return new Date(minutoActual + UN_MINUTO_MS - 1);
};
