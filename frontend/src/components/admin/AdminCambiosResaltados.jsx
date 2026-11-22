import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronLeft, ChevronRight, FileEdit, X } from 'lucide-react';
import '../../styles/components/admin/AdminCambiosResaltados.css';
import { sanitizeUrl } from '../../utils/sanitizeUrl';

/**
 * Visor de imagen que se abre encima del modal de revisión (sin salir de la pantalla ni abrir otra pestaña).
 * Esc lo cierra sin cerrar el modal de abajo, y las flechas del teclado pasan entre las imágenes del grupo.
 */
const VisorImagen = ({ urls, indice, onCambiar, onCerrar }) => {
  const botonCerrar = useRef(null);
  const hayVarias = urls.length > 1;

  const mover = useCallback(
    (paso) => onCambiar((indice + paso + urls.length) % urls.length),
    [indice, urls.length, onCambiar]
  );

  useEffect(() => {
    botonCerrar.current?.focus();
  }, []);

  useEffect(() => {
    // En fase de captura, para atender la tecla antes que los modales de abajo (que también cierran con Esc).
    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCerrar();
      } else if (hayVarias && e.key === 'ArrowRight') {
        e.stopPropagation();
        mover(1);
      } else if (hayVarias && e.key === 'ArrowLeft') {
        e.stopPropagation();
        mover(-1);
      }
    };
    window.addEventListener('keydown', alTeclear, true);
    return () => window.removeEventListener('keydown', alTeclear, true);
  }, [hayVarias, mover, onCerrar]);

  // Los clics no tienen que llegar al modal de abajo (los eventos de un portal suben por el árbol de React).
  const detener = (e) => e.stopPropagation();
  const cerrar = (e) => {
    e.stopPropagation();
    onCerrar();
  };

  return (
    <div className="admin-visor-imagen" role="dialog" aria-modal="true" aria-label="Imagen ampliada" onClick={cerrar}>
      <button ref={botonCerrar} type="button" className="admin-visor-cerrar" onClick={cerrar} aria-label="Cerrar imagen ampliada">
        <X size={26} aria-hidden="true" />
      </button>
      {hayVarias && (
        <button
          type="button"
          className="admin-visor-flecha is-izquierda"
          onClick={(e) => {
            detener(e);
            mover(-1);
          }}
          aria-label="Imagen anterior"
        >
          <ChevronLeft size={30} aria-hidden="true" />
        </button>
      )}
      <img
        src={urls[indice]}
        alt={`Imagen ampliada ${indice + 1} de ${urls.length}`}
        className="admin-visor-img"
        onClick={detener}
      />
      {hayVarias && (
        <button
          type="button"
          className="admin-visor-flecha is-derecha"
          onClick={(e) => {
            detener(e);
            mover(1);
          }}
          aria-label="Imagen siguiente"
        >
          <ChevronRight size={30} aria-hidden="true" />
        </button>
      )}
      {hayVarias && (
        <span className="admin-visor-contador">
          {indice + 1} / {urls.length}
        </span>
      )}
    </div>
  );
};

/**
 * Miniaturas de las imágenes de un cambio. Las que solo están de un lado (agregadas o quitadas) se marcan;
 * al hacer clic se abre el visor (onAbrir recibe las imágenes del grupo y cuál se tocó).
 */
const MiniaturasCambio = ({ urls = [], otras = [], marca, onAbrir }) => {
  const seguras = urls.map((url) => sanitizeUrl(url)).filter(Boolean);
  if (seguras.length === 0) return null;
  return (
    <ul className="admin-diff-imagenes">
      {seguras.map((url, indice) => {
        const esDiferencia = !otras.includes(url);
        return (
          <li key={`${url}-${indice}`}>
            <button
              type="button"
              onClick={() => onAbrir(seguras, indice)}
              className={`admin-diff-miniatura${esDiferencia ? ` is-${marca.clase}` : ''}`}
              title={esDiferencia ? `${marca.texto}: ver imagen ampliada` : 'Ver imagen ampliada'}
            >
              <img src={url} alt={`Imagen ${indice + 1}`} loading="lazy" />
              {esDiferencia && <span className="admin-diff-miniatura-marca">{marca.texto}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

const MARCA_QUITADA = { clase: 'quitada', texto: 'Quitada' };
const MARCA_NUEVA = { clase: 'nueva', texto: 'Nueva' };

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
  const raiz = useRef(null);
  const [visor, setVisor] = useState(null);
  const cerrarVisor = useCallback(() => setVisor(null), []);
  const cambiarImagen = useCallback((indice) => setVisor((actual) => (actual ? { ...actual, indice } : actual)), []);
  // El visor se dibuja dentro de .panel-scope (de donde salen los estilos del panel) pero fuera del modal,
  // para que quede por encima y no lo recorte. El contenedor se busca al hacer clic, no al dibujar.
  const abrirVisor = (urls, indice) =>
    setVisor({ urls, indice, contenedor: raiz.current?.closest('.panel-scope') || document.body });

  if (lista.length === 0 && !esActualizacion) {
    return null;
  }

  return (
    <section className="admin-cambios-card" aria-label="Campos modificados en esta actualización" ref={raiz}>
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
                  {c.imagenes && (
                    <MiniaturasCambio urls={c.imagenes.antes} otras={c.imagenes.despues} marca={MARCA_QUITADA} onAbrir={abrirVisor} />
                  )}
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
                  {c.imagenes && (
                    <MiniaturasCambio urls={c.imagenes.despues} otras={c.imagenes.antes} marca={MARCA_NUEVA} onAbrir={abrirVisor} />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {visor &&
        createPortal(
          <VisorImagen urls={visor.urls} indice={visor.indice} onCambiar={cambiarImagen} onCerrar={cerrarVisor} />,
          visor.contenedor
        )}
    </section>
  );
};

export default AdminCambiosResaltados;

