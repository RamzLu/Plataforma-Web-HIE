import { BookOpen, Globe, Users } from "lucide-react";
import "../../styles/ui/EtiquetaCategoria.css";

// Etiqueta de clasificación de los listados (categoría, clasificación, área, modalidad): mismo tamaño y estilo
// en todos los módulos, en el CMS y en el Admin. El color sale de `tono` o, si no se indica, de la categoría.
const COLORES = {
  "información institucional": "azul",
  "guías clínicas": "verde",
  protocolos: "violeta",
  administración: "ambar",
  general: "gris",
};

const EtiquetaCategoria = ({ categoria, tono, Icono }) => {
  const texto = String(categoria || "").trim() || "Información institucional";
  const color = tono || COLORES[texto.toLowerCase()] || "azul";
  return (
    <span className={`etiqueta-categoria is-${color}`}>
      {Icono && <Icono size={13} aria-hidden="true" />}
      {texto}
    </span>
  );
};

/** Especialidad o servicio clave: igual en Especialidades y en Profesionales. */
export const EtiquetaTipo = ({ esServicio }) => (
  <EtiquetaCategoria categoria={esServicio ? "Servicio clave" : "Especialidad"} tono={esServicio ? "azul" : "violeta"} />
);

const MODALIDADES = {
  virtual: { tono: "violeta", Icono: Globe },
  "híbrida": { tono: "turquesa", Icono: Users },
  hibrida: { tono: "turquesa", Icono: Users },
};

/** Modalidad de una capacitación. */
export const EtiquetaModalidad = ({ modalidad }) => {
  const texto = String(modalidad || "").trim() || "Presencial";
  const { tono, Icono } = MODALIDADES[texto.toLowerCase()] || { tono: "azul", Icono: BookOpen };
  return <EtiquetaCategoria categoria={texto} tono={tono} Icono={Icono} />;
};

export default EtiquetaCategoria;
