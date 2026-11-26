import { ArchiveRestore, ArchiveX, Clock3, Trash2 } from "lucide-react";
import EtiquetaEstado from "../ui/EtiquetaEstado";
import { diasEnPapelera } from "../../utils/publicacion";
import "../../styles/components/cms/Papelera.css";

// Piezas de la Papelera de lo rechazado, iguales en todos los módulos del CMS.

/** Botón de la fila de "Rechazados": manda el ítem a la Papelera. */
export const BotonADescartar = ({ onClick, ocupado }) => (
  <button type="button" className="papelera-btn is-descartar" title="Mandar a la Papelera" aria-label="Mandar a la Papelera" onClick={onClick} disabled={ocupado}>
    <ArchiveX size={18} aria-hidden="true" />
  </button>
);

/** Acciones de la fila en la Papelera: restaurar o eliminar definitivamente (no se edita desde ahí). */
export const AccionesPapelera = ({ onRestaurar, onEliminar, ocupado }) => (
  <>
    <button type="button" className="papelera-btn is-restaurar" title="Restaurar" aria-label="Restaurar" onClick={onRestaurar} disabled={ocupado}>
      <ArchiveRestore size={18} aria-hidden="true" />
    </button>
    <button type="button" className="papelera-btn is-eliminar" title="Eliminar definitivamente" aria-label="Eliminar definitivamente" onClick={onEliminar} disabled={ocupado}>
      <Trash2 size={18} aria-hidden="true" />
    </button>
  </>
);

/** Debajo del estado, en la Papelera: cuántos días faltan para que se elimine sola. */
export const NotaPapelera = ({ item, activo = true }) => {
  if (!activo || !item?.enPapelera) return null;
  const dias = diasEnPapelera(item);
  const texto = dias === null ? "En la Papelera" : dias === 0 ? "Se elimina hoy" : dias === 1 ? "Se elimina en 1 día" : `Se elimina en ${dias} días`;
  return (
    <div style={{ marginTop: "4px" }}>
      <EtiquetaEstado tipo="archivado" texto={texto} Icono={Clock3} nota />
    </div>
  );
};

/**
 * Aviso de la pestaña Papelera: se vacía sola, no hay botón para vaciarla.
 * `soloLectura` es la versión para el Admin: ve lo descartado, pero solo el CM lo restaura o lo elimina antes de tiempo.
 */
export const AvisoPapelera = ({ soloLectura = false }) => (
  <div className="papelera-aviso">
    {soloLectura ? (
      <p>
        Lo descartó el CM. Se elimina solo a los <strong>15 días</strong>; hasta entonces solo el CM puede restaurarlo o eliminarlo antes.
      </p>
    ) : (
      <p>
        Lo que descartes se elimina solo a los <strong>15 días</strong>. Hasta entonces podés restaurarlo o eliminarlo antes.
      </p>
    )}
  </div>
);
