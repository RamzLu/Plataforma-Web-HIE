import { AlertTriangle } from "lucide-react";

/**
 * Aviso en el modal de revisión cuando lo que se abre es la versión publicada (la que ve el portal)
 * y existe una actualización pendiente o rechazada.
 */
const AvisoVersionPublicada = ({ item }) => {
  if (!item?.actualizacionEnRevision) return null;
  const rechazada = String(item.actualizacionEnRevision).toUpperCase() === "RECHAZADO";
  return (
    <div className="admin-rev-alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <div>
        Esta es la versión publicada, la que ve el portal.{" "}
        {rechazada ? "La actualización enviada por el CMS fue rechazada." : "Hay una actualización pendiente de aprobación."}{" "}
        Para verla, buscala en el filtro {rechazada ? "Rechazados" : "Pendientes"}.
      </div>
    </div>
  );
};

export default AvisoVersionPublicada;
