import { RefreshCw } from "lucide-react";
import EtiquetaEstado from "../ui/EtiquetaEstado";
import { esEdicionSobrePublicado } from "../../utils/publicacion";

/**
 * Se muestra en la lista de "Publicados" cuando lo publicado tiene una versión nueva en revisión o rechazada:
 * aclara que el portal sigue mostrando la versión publicada y qué pasó con la actualización.
 * `activo` indica si la lista que se está viendo es la de publicados (en las otras pestañas no hace falta).
 * Usa la etiqueta común en su variante de nota: mismos colores que "Pendiente de aprobación" y "Rechazado".
 */
const SiguePublicado = ({ item, activo = true }) => {
  if (!activo || !esEdicionSobrePublicado(item)) return null;
  const rechazada = String(item.estado).toUpperCase() === "RECHAZADO";
  return (
    <div style={{ marginTop: "4px" }} title="El portal sigue mostrando la versión publicada.">
      <EtiquetaEstado
        tipo={rechazada ? "rechazado" : "pendiente"}
        texto={rechazada ? "Actualización rechazada" : "Actualización pendiente"}
        Icono={RefreshCw}
        nota
      />
    </div>
  );
};

export default SiguePublicado;
