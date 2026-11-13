import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, Undo2, X } from "lucide-react";
import toast from "react-hot-toast";
import { resolverSolicitudEliminacion } from "../../api/eliminaciones.api";
import { mensajeDeError } from "../../utils/mensajeDeError";
import "../../styles/components/admin/SolicitudEliminacion.css";

/**
 * Se muestra en la fila de un contenido publicado que el CM pidió borrar.
 * Aprobar lo borra definitivamente; rechazar descarta el pedido y el contenido sigue publicado.
 */
const SolicitudEliminacionAcciones = ({ solicitud, entidad, id, titulo, onResuelto }) => {
  const [accion, setAccion] = useState(null); // "aprobar" | "rechazar" | null
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!solicitud) return null;

  const abrir = (event, tipo) => {
    event.stopPropagation(); // la fila suele abrir el detalle al hacer clic
    setAccion(tipo);
  };

  const cerrar = () => {
    if (enviando) return;
    setAccion(null);
    setMotivo("");
  };

  const confirmar = async () => {
    setEnviando(true);
    try {
      const respuesta = await resolverSolicitudEliminacion(entidad, id, accion === "aprobar", motivo.trim());
      toast.success(respuesta?.message || "Solicitud resuelta.");
      setAccion(null);
      setMotivo("");
      await onResuelto?.();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo resolver la solicitud de eliminación."));
    } finally {
      setEnviando(false);
    }
  };

  const fecha = new Date(solicitud.fecha);
  const fechaTexto = Number.isNaN(fecha.getTime()) ? "" : ` · ${fecha.toLocaleDateString("es-AR")}`;

  return (
    <div className="solelim" onClick={(event) => event.stopPropagation()}>
      <span className="solelim-badge">
        <Trash2 size={13} aria-hidden="true" />
        Pide eliminación
      </span>
      <small className="solelim-quien">
        por {solicitud.solicitadoPor}
        {fechaTexto}
      </small>
      <div className="solelim-acciones">
        <button type="button" className="solelim-btn is-danger" onClick={(e) => abrir(e, "aprobar")}>
          Aprobar
        </button>
        <button type="button" className="solelim-btn" onClick={(e) => abrir(e, "rechazar")}>
          Rechazar
        </button>
      </div>

      {accion &&
        createPortal(
          <div className="solelim-overlay" role="presentation" onClick={cerrar}>
            <div
              className="solelim-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="solelim-modal-titulo"
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="solelim-cerrar" aria-label="Cerrar" onClick={cerrar}>
                <X size={18} />
              </button>
              {accion === "aprobar" ? (
                <>
                  <h3 id="solelim-modal-titulo">¿Eliminar definitivamente?</h3>
                  <p>
                    Se va a borrar <strong>{titulo}</strong> del portal y de la base de datos. Esta acción no se puede
                    deshacer.
                  </p>
                </>
              ) : (
                <>
                  <h3 id="solelim-modal-titulo">Rechazar la eliminación</h3>
                  <p>
                    <strong>{titulo}</strong> va a seguir publicado como está.
                  </p>
                  <label htmlFor="solelim-motivo">Motivo (opcional)</label>
                  <textarea
                    id="solelim-motivo"
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej.: la información sigue vigente."
                  />
                </>
              )}
              <div className="solelim-modal-acciones">
                <button type="button" className="solelim-btn" onClick={cerrar} disabled={enviando}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`solelim-btn ${accion === "aprobar" ? "is-danger" : "is-primary"}`}
                  onClick={confirmar}
                  disabled={enviando}
                >
                  {accion === "aprobar" ? <Trash2 size={15} aria-hidden="true" /> : <Undo2 size={15} aria-hidden="true" />}
                  {enviando ? "Procesando..." : accion === "aprobar" ? "Sí, eliminar" : "Rechazar solicitud"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SolicitudEliminacionAcciones;
