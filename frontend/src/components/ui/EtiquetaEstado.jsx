import { AlertTriangle, Archive, BadgeCheck, CalendarClock, Pencil, Trash2, XCircle } from "lucide-react";
import "../../styles/ui/EtiquetaEstado.css";

// Una sola etiqueta de estado para todo el panel: mismo tamaño, forma y tipografía en cada módulo.
// Solo cambian el color y el ícono según el tipo.
const ICONOS = {
  pendiente: AlertTriangle,
  programado: CalendarClock,
  publicado: BadgeCheck,
  rechazado: XCircle,
  archivado: Archive,
  borrador: Pencil,
  eliminacion: Trash2,
};

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

const EtiquetaEstado = ({ estado, texto, tipo }) => {
  const variante = tipo || tipoDeEstado(estado);
  const Icono = ICONOS[variante] || AlertTriangle;
  return (
    <span className={`etiqueta-estado is-${variante}`}>
      <Icono size={14} strokeWidth={2.25} aria-hidden="true" />
      {texto}
    </span>
  );
};

export default EtiquetaEstado;
