import { useState } from "react";
import { CheckCircle, Trash2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { resolverSolicitudEliminacion } from "../../api/eliminaciones.api";
import { mensajeDeError } from "../../utils/mensajeDeError";
import EtiquetaEstado from "../ui/EtiquetaEstado";
import "../../styles/components/admin/SolicitudEliminacion.css";

const formatearFecha = (valor) => {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "" : fecha.toLocaleDateString("es-AR");
};

/**
 * Etiqueta para el listado: reemplaza a la de estado cuando el CM pidió borrar el contenido.
 * La revisión se hace desde el modal de detalle, igual que el resto de las solicitudes.
 */
export const EtiquetaEliminacion = () => <EtiquetaEstado tipo="eliminacion" texto="Pide eliminación" />;

/**
 * Bloque para el modal de detalle de un contenido publicado que el CM pidió borrar.
 * variante="inline": cuando el bloque va dentro del cuerpo del modal (sin margen lateral).
 * Aprobar lo borra definitivamente; rechazar descarta el pedido y el contenido sigue publicado.
 */
const SolicitudEliminacionAcciones = ({ solicitud, entidad, id, titulo, onResuelto, variante }) => {
  const [accion, setAccion] = useState(null); // "aprobar" | "rechazar" | null
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!solicitud) return null;

  const cancelar = () => {
    setAccion(null);
    setMotivo("");
  };

  const confirmar = async () => {
    setEnviando(true);
    try {
      const respuesta = await resolverSolicitudEliminacion(entidad, id, accion === "aprobar", motivo.trim());
      toast.success(respuesta?.message || "Solicitud resuelta.");
      cancelar();
      await onResuelto?.();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo resolver la solicitud de eliminación."));
    } finally {
      setEnviando(false);
    }
  };

  const fecha = formatearFecha(solicitud.fecha);

  return (
    <div className={`solelim-bloque${variante === "inline" ? " is-inline" : ""}`}>
      <div className="solelim-aviso">
        <Trash2 size={20} aria-hidden="true" />
        <div>
          <strong>Solicitud de eliminación</strong>
          <p>
            {solicitud.solicitadoPor || "El Editor CMS"} pidió eliminar este contenido
            {fecha ? ` el ${fecha}` : ""}. Sigue publicado hasta que lo resuelvas.
          </p>
        </div>
      </div>

      {accion === "aprobar" && (
        <p className="solelim-advertencia">
          Se va a borrar <strong>{titulo}</strong> del portal y de la base de datos. Esta acción no se puede deshacer.
        </p>
      )}

      {accion === "rechazar" && (
        <label className="solelim-motivo">
          Motivo (opcional)
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: la información sigue vigente."
            autoFocus
          />
        </label>
      )}

      <div className="solelim-acciones">
        {!accion ? (
          <>
            <button type="button" className="solelim-btn" onClick={() => setAccion("rechazar")}>
              <XCircle size={17} aria-hidden="true" /> Rechazar
            </button>
            <button type="button" className="solelim-btn is-danger" onClick={() => setAccion("aprobar")}>
              <CheckCircle size={17} aria-hidden="true" /> Aprobar eliminación
            </button>
          </>
        ) : (
          <>
            <button type="button" className="solelim-btn" onClick={cancelar} disabled={enviando}>
              Cancelar
            </button>
            <button
              type="button"
              className={`solelim-btn ${accion === "aprobar" ? "is-danger-solid" : "is-primary"}`}
              onClick={confirmar}
              disabled={enviando}
            >
              {enviando
                ? "Procesando..."
                : accion === "aprobar"
                ? "Sí, eliminar definitivamente"
                : "Confirmar rechazo"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SolicitudEliminacionAcciones;
