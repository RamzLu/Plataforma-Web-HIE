import React, { useState } from 'react';
import '../../styles/components/HospitalLocationModal.css';

const HospitalLocationModal = ({
  isOpen = false,
  onClose,
  hospitalName = 'HOSPITAL INTERDISTRITAL EVITA',
  address = 'Av. Dr. Néstor Kirchner / Av. 28 de Junio Nº 250, Formosa, Argentina',
  coordinates = '-26.17724, -58.19932',
  postalCode = 'P3600 Formosa',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(coordinates);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${hospitalName}, Formosa, Argentina`
  )}`;

  return (
    <div
      className="location-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div
        className="location-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <header className="location-modal-header">
          <div className="modal-header-left">
            <div className="hospital-symbol-box" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="modal-header-text">
              <span className="institutional-kicker">{hospitalName}</span>
              <h1 id="location-modal-title" className="modal-header-title">
                Ubicación y Accesos al Hospital
              </h1>
              <div className="modal-header-address">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                </svg>
                <span>{address}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Cerrar ventana de ubicación"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Cuerpo del Modal: 2 Columnas */}
        <div className="location-modal-body">
          {/* Columna Izquierda: Mapa y Geolocalización */}
          <section className="location-column-left" aria-label="Visualización de Mapa">
            <div className="map-card-wrapper">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7160.991248531538!2d-58.19816300000001!3d-26.180551000000005!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945caf5c8f477e01%3A0x3ad3344cf5acca56!2sHospital%20Interdistrital%20Evita!5e0!3m2!1ses-419!2sar!4v1786650025635!5m2!1ses-419!2sar"
                    width="100%"
                    height="100%"
                    loading="eager"
                    title="Mapa del Hospital"
                  ></iframe>

              <div className="map-top-bar">
                <button
                  type="button"
                  className="btn-copy-coords"
                  onClick={handleCopyCoordinates}
                  aria-label="Copiar coordenadas geográficas"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{copied ? '¡Copiadas!' : 'Copiar Coordenadas'}</span>
                </button>
              </div>

              <div className="map-bottom-bar">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-open-gmaps"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Abrir en Google Maps</span>
                </a>
              </div>
            </div>

            <div className="info-subgrid">
              <div className="info-tile">
                <div className="tile-header">
                  <span className="tile-icon" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </span>
                  <span className="tile-title">GEOLOCALIZACIÓN</span>
                </div>
                <span className="tile-bold-value">{coordinates}</span>
                <span className="tile-sub-value">Código Postal: {postalCode}</span>
              </div>

              <div className="info-tile">
                <div className="tile-header">
                  <span className="tile-icon" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 3v18" />
                    </svg>
                  </span>
                  <span className="tile-title">DIFERENCIACIÓN DE ENTRADAS</span>
                </div>
                <div className="access-list">
                  <div className="access-item">
                    <strong>Pabellón Central:</strong> Av. N. Kirchner
                  </div>
                  <div className="access-item emergency">
                    <span className="emergency-dot" aria-hidden="true"></span>
                    <span><strong>Guardia/Urgencias:</strong> Calle Lateral 250</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="location-column-right" aria-label="Medios de Transporte">
            
            {/* 1. Colectivos / Transporte Urbano (NUEVO DISEÑO) */}
            <article className="transit-card">
              <div className="transit-header">
                <div className="transit-title-group">
                  <div className="transit-icon-bubble" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="3" width="16" height="16" rx="2" />
                      <path d="M4 11h16" />
                      <path d="M8 15h.01" />
                      <path d="M16 15h.01" />
                      <path d="M6 19v2" />
                      <path d="M18 19v2" />
                    </svg>
                  </div>
                  <h2 className="transit-title">Transporte Urbano</h2>
                </div>
              </div>

              {/* Información de Línea Directa */}
              <div className="bus-direct-info">
                <div className="bus-pill-primary">Línea B</div>
                <p className="bus-info-text">
                  <strong>Llegada directa:</strong> Única línea con parada y cabecera directa en la puerta del hospital.
                </p>
              </div>

              {/* Información del Sistema de Trasbordo */}
              <div className="bus-transfer-info">
                <span className="transfer-label">SISTEMA DE TRASBORDO</span>
                <p className="bus-info-text">
                  Tomá las líneas <strong>A, C, D, F, G, H o K</strong> desde tu barrio hasta la <strong>Plaza San Martín</strong>. Allí podés hacer combinación directa con la Línea B hacia el hospital.
                </p>
              </div>
            </article>

            {/* 2. Taxis y Remises Autorizados (RECUPERADO) */}
            <article className="transit-card">
              <div className="transit-header">
                <div className="transit-title-group">
                  <div className="transit-icon-bubble" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.7 2 12.2V16c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <path d="M9 17h6" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                  <h2 className="transit-title">Taxis y Remises Autorizados</h2>
                </div>
              </div>
              <p className="transit-description">
                Indíquele al chofer que su destino es el Hospital Interdistrital Evita, ingresando por la entrada principal sobre la Avenida Barberis.
              </p>
            </article>  
          </section>
        </div>

        {/* Footer del Modal */}
        <footer className="location-modal-footer">
          <div className="accessibility-notice">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Acceso adaptado y rampas para personas con movilidad reducida.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HospitalLocationModal;