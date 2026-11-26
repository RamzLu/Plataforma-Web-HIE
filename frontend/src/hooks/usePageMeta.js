import { useEffect } from "react";

const SITIO = "Hospital Interdistrital Evita";
const DESCRIPCION_POR_DEFECTO =
  "Portal oficial del Hospital Interdistrital Evita de Formosa: especialidades, profesionales, turnos, noticias, residencias y capacitación.";

/**
 * Título de la pestaña y meta descripción de cada página (los usan los buscadores y al compartir el link).
 * usePageMeta("Noticias", "Últimas noticias del hospital...") → "Noticias | Hospital Interdistrital Evita"
 */
export const usePageMeta = (titulo, descripcion = DESCRIPCION_POR_DEFECTO) => {
  useEffect(() => {
    document.title = titulo ? `${titulo} | ${SITIO}` : SITIO;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = descripcion;
  }, [titulo, descripcion]);
};
