import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trash2, Undo2, X } from "lucide-react";
import toast from "react-hot-toast";
import { getSolicitudesEliminacion, resolverSolicitudEliminacion } from "../../api/eliminaciones.api";
import { mensajeDeError } from "../../utils/mensajeDeError";
import Paginacion from "../../components/ui/Paginacion";
import { usePaginacion } from "../../hooks/usePaginacion";
import "../../styles/pages/admin/AdminSolicitudesEliminacionView.css";

const MODULOS = {
  noticia: "Noticias",
  documento: "Documentación",
  profesional: "Profesionales",
  especialidad: "Especialidades",
  servicio: "Servicios",
  residencia: "Residencias",
  capacitacion: "Capacitaciones",
};

const formatearFecha = (fecha) => {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/**
 * Contenido publicado que un CM pidió borrar. Sigue visible en el portal hasta que el administrador
 * aprueba (se borra definitivamente) o rechaza (queda como estaba).
 */
const AdminSolicitudesEliminacionView = ({ onPendingCountChange } = {}) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enProceso, setEnProceso] = useState(null);
  const [aConfirmar, setAConfirmar] = useState(null); // { solicitud, accion: "aprobar" | "rechazar" }
  const [motivo, setMotivo] = useState("");

  const aplicarLista = useCallback(
    (data) => {
      const lista = Array.isArray(data) ? data : [];
      setSolicitudes(lista);
      onPendingCountChange?.(lista.length);
    },
    [onPendingCountChange]
  );

  const avisarError = (error) =>
    toast.error(mensajeDeError(error, "No se pudieron cargar las solicitudes de eliminación."));

  // Recarga manual (botón Actualizar y después de aprobar o rechazar).
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      aplicarLista(await getSolicitudesEliminacion());
    } catch (error) {
      avisarError(error);
    } finally {
      setLoading(false);
    }
  }, [aplicarLista]);

  // Carga inicial: el estado solo se actualiza cuando llega la respuesta.
  useEffect(() => {
    let vigente = true;
    getSolicitudesEliminacion()
      .then((data) => vigente && aplicarLista(data))
      .catch((error) => vigente && avisarError(error))
      .finally(() => vigente && setLoading(false));
    return () => {
      vigente = false;
    };
  }, [aplicarLista]);

  const paginacion = usePaginacion(solicitudes, 10);

  const cerrarConfirmacion = () => {
    setAConfirmar(null);
    setMotivo("");
  };

  const resolver = async () => {
    if (!aConfirmar) return;
    const { solicitud, accion } = aConfirmar;
    const clave = `${solicitud.entidad}-${solicitud.id}`;
    setEnProceso(clave);
    try {
      const respuesta = await resolverSolicitudEliminacion(
        solicitud.entidad,
        solicitud.id,
        accion === "aprobar",
        motivo.trim()
      );
      toast.success(respuesta?.message || "Solicitud resuelta.");
      cerrarConfirmacion();
      await cargar();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo resolver la solicitud."));
    } finally {
      setEnProceso(null);
    }
  };

  return (
    <div className="admin-elim-page">
      <header className="admin-elim-header admin-view-heading">
        <div>
          <span className="admin-elim-overtitle">PANEL DE CONTROL DIRECTIVO</span>
          <h1>Solicitudes de eliminación</h1>
          <p>
            Contenido publicado que el equipo del CMS pidió borrar. Sigue visible en el portal hasta que lo
            apruebes o lo rechaces.
          </p>
        </div>
        <button
          type="button"
          className="admin-refresh-btn"
          onClick={cargar}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </header>

      <section className="admin-elim-card">
        <div className="admin-elim-card-heading">
          <h2>Pendientes de revisión</h2>
          <span className="admin-elim-count">
            {solicitudes.length} {solicitudes.length === 1 ? "solicitud" : "solicitudes"}
          </span>
        </div>

        <div className="admin-elim-table-wrap">
          <table className="admin-elim-table">
            <thead>
              <tr>
                <th scope="col">Módulo</th>
                <th scope="col">Contenido</th>
                <th scope="col">Pedido por</th>
                <th scope="col">Fecha</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="admin-elim-empty">Cargando solicitudes...</td>
                </tr>
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-elim-empty">No hay solicitudes de eliminación pendientes.</td>
                </tr>
              ) : (
                paginacion.itemsPagina.map((s) => {
                  const clave = `${s.entidad}-${s.id}`;
                  const ocupado = enProceso === clave;
                  return (
                    <tr key={clave}>
                      <td>
                        <span className="admin-elim-modulo">{MODULOS[s.entidad] || s.entidad}</span>
                      </td>
                      <td className="admin-elim-titulo">{s.titulo}</td>
                      <td>{s.solicitadoPor}</td>
                      <td>{formatearFecha(s.fecha)}</td>
                      <td>
                        <div className="admin-elim-acciones">
                          <button
                            type="button"
                            className="admin-elim-btn is-danger"
                            disabled={ocupado}
                            onClick={() => setAConfirmar({ solicitud: s, accion: "aprobar" })}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            className="admin-elim-btn"
                            disabled={ocupado}
                            onClick={() => setAConfirmar({ solicitud: s, accion: "rechazar" })}
                          >
                            <Undo2 size={15} aria-hidden="true" />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Paginacion {...paginacion} etiqueta="solicitudes" />
      </section>

      {aConfirmar && (
        <div className="admin-elim-overlay" role="presentation" onClick={cerrarConfirmacion}>
          <div
            className="admin-elim-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-elim-modal-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="admin-elim-modal-cerrar" aria-label="Cerrar" onClick={cerrarConfirmacion}>
              <X size={18} />
            </button>
            {aConfirmar.accion === "aprobar" ? (
              <>
                <h3 id="admin-elim-modal-titulo">¿Eliminar definitivamente?</h3>
                <p>
                  Se va a borrar <strong>{aConfirmar.solicitud.titulo}</strong> (
                  {MODULOS[aConfirmar.solicitud.entidad] || aConfirmar.solicitud.entidad}) del portal y de la base de
                  datos. Esta acción no se puede deshacer.
                </p>
              </>
            ) : (
              <>
                <h3 id="admin-elim-modal-titulo">Rechazar la eliminación</h3>
                <p>
                  <strong>{aConfirmar.solicitud.titulo}</strong> va a seguir publicado como está.
                </p>
                <label htmlFor="admin-elim-motivo">Motivo (opcional)</label>
                <textarea
                  id="admin-elim-motivo"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej.: la información sigue vigente."
                />
              </>
            )}
            <div className="admin-elim-modal-acciones">
              <button type="button" className="admin-elim-btn" onClick={cerrarConfirmacion} disabled={!!enProceso}>
                Cancelar
              </button>
              <button
                type="button"
                className={`admin-elim-btn ${aConfirmar.accion === "aprobar" ? "is-danger" : "is-primary"}`}
                onClick={resolver}
                disabled={!!enProceso}
              >
                {enProceso ? "Procesando..." : aConfirmar.accion === "aprobar" ? "Sí, eliminar" : "Rechazar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSolicitudesEliminacionView;
