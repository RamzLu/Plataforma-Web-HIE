import { AlertTriangle, Archive, BadgeCheck, CalendarClock, Pencil, Trash2, XCircle } from "lucide-react";
import { tipoDeEstado } from "./estados.js";
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
