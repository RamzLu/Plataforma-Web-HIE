import React from 'react';
import { ArrowRight, FileEdit } from 'lucide-react';
import '../../styles/components/admin/AdminCambiosResaltados.css';

/**
 * Píldora para mostrar en las filas de las tablas del Admin cuando un contenido
 * pendiente corresponde a una actualización/edición de un registro existente.
 */
export const AdminCambiosPill = ({ count = 0, esActualizacion = false }) => {
  if (!esActualizacion && (!count || count <= 0)) return null;

  return (
    <span
      className="admin-table-diff-pill"
      title={
        count > 0
          ? `Solicitud de actualización: ${count} ${count === 1 ? 'campo modificado' : 'campos modificados'}`
          : 'Solicitud de actualización de contenido existente'
      }
    >
      <FileEdit size={12} aria-hidden="true" />
      <span>
        Edición{count > 0 ? ` · ${count} ${count === 1 ? 'cambio' : 'cambios'}` : ''}
      </span>
    </span>
  );
};

/**
 * Bloque comparativo visual de cambios (Antes → Nuevo valor) para ubicar
 * dentro de los modales de revisión editorial del Administrador.
 */
export const AdminCambiosResaltados = ({
  cambios = [],
  esActualizacion = false,
  titulo = 'Modificaciones en esta actualización',
}) => {
  const lista = Array.isArray(cambios) ? cambios : [];

  if (lista.length === 0 && !esActualizacion) {
    return null;
  }

  return (
    <section className="admin-cambios-card" aria-label="Campos modificados en esta actualización">
      <div className="admin-cambios-header">
        <div className="admin-cambios-header-text">
          <h4 className="admin-cambios-title">
            {titulo}
            {lista.length > 0 && (
              <span className="admin-cambios-counter">
                {lista.length} {lista.length === 1 ? 'campo' : 'campos'}
              </span>
            )}
          </h4>
          <p className="admin-cambios-desc">
            {lista.length > 0
              ? 'El editor del CMS modificó los siguientes campos respecto a la versión anterior:'
              : 'Esta solicitud proviene de una actualización sobre un registro ya existente.'}
          </p>
        </div>
      </div>

      {lista.length > 0 && (
        <div className="admin-cambios-list">
          {lista.map((c, idx) => (
            <article key={c.campo || idx} className="admin-cambio-item">
              <div className="admin-cambio-label-bar">
                <span className="admin-cambio-label">{c.label || c.campo}</span>
              </div>
              <div className="admin-cambio-diff-grid">
                <div className="admin-diff-box before">
                  <div className="admin-diff-badge-wrap">
                    <span className="admin-diff-badge before">Antes</span>
                  </div>
                  <div className="admin-diff-text">
                    {c.antes ? (
                      c.antes
                    ) : (
                      <em className="admin-diff-empty">(Vacío / Sin información)</em>
                    )}
                  </div>
                </div>

                <div className="admin-diff-arrow" aria-hidden="true">
                  <ArrowRight size={16} />
                </div>

                <div className="admin-diff-box after">
                  <div className="admin-diff-badge-wrap">
                    <span className="admin-diff-badge after">Nuevo valor</span>
                  </div>
                  <div className="admin-diff-text">
                    {c.despues ? (
                      c.despues
                    ) : (
                      <em className="admin-diff-empty">(Eliminado / Vacío)</em>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminCambiosResaltados;

