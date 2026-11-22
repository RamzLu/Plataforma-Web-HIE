import { Globe2 } from "lucide-react";
import { esEdicionSobrePublicado } from "../../utils/publicacion";
import "../../styles/components/cms/SiguePublicado.css";

/**
 * Se muestra en la lista de "Publicados" cuando lo publicado tiene una versión nueva en revisión o rechazada:
 * aclara que el portal sigue mostrando la versión publicada y qué pasó con la actualización.
 * `activo` indica si la lista que se está viendo es la de publicados (en las otras pestañas no hace falta).
 */
const SiguePublicado = ({ item, activo = true }) => {
  if (!activo || !esEdicionSobrePublicado(item)) return null;
  const rechazada = String(item.estado).toUpperCase() === "RECHAZADO";
  return (
    <div className="cms-sigue-publicado-bloque">
      <span
        className={`cms-sigue-publicado ${rechazada ? "es-rechazada" : "es-pendiente"}`}
        title="El portal sigue mostrando la versión publicada."
      >
        <Globe2 size={12} aria-hidden="true" />
        {rechazada ? "Actualización rechazada" : "Actualización pendiente"}
      </span>
    </div>
  );
};

export default SiguePublicado;
