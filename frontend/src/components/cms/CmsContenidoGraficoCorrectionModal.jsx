import React from "react";
import defaultImg1 from "../../assets/fondoHospitalCarrusel1.jpg";

/**
 * CmsContenidoGraficoCorrectionModal
 * Componente modular para la corrección y subsanación de contenidos gráficos rechazados.
 * Diseñado conforme a la especificación Stitch para Hospital Interdistrital Evita (WCAG 2.1 AA).
 */
export const CmsContenidoGraficoCorrectionModal = ({
  isOpen,
  onClose,
  recurso,
  correctionData,
  setCorrectionData,
  fileInputRef,
  onFileChange,
  onSaveDraft,
  onResubmitApproval,
}) => {
  if (!isOpen || !recurso) return null;

  const resourceCode = recurso.id?.startsWith("cg-")
    ? `#CG-0${recurso.id.replace("cg-", "")}`
    : `#CG-${recurso.id || "0142"}`;

  return (
    <div
      className="cg-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-correction-headline"
    >
      <div
        className="cg-modal-correction-container"
        onClick={(e) => e.stopPropagation()}
        data-purpose="modal-container"
      >
        {/* Modal Header */}
        <header className="cg-correction-header">
          <div className="cg-correction-header-content">
            <div className="cg-correction-title-row">
              <h2 className="cg-correction-title" id="modal-correction-headline">
                Corregir Contenido Gráfico Rechazado
              </h2>
              <span className="cg-correction-pill">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ width: "14px", height: "14px", color: "#dc2626" }}
                >
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  />
                </svg>
                <span>Estado: Rechazado</span>
              </span>
            </div>
            <p className="cg-correction-meta">
              ID Recurso: <strong>{resourceCode}</strong> • Expediente Editorial N° {correctionData.expediente || "3418/25"}
            </p>
          </div>

          <button
            type="button"
            className="cg-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </header>

        {/* Scrollable Modal Body */}
        <main className="cg-correction-body cg-custom-scroll">
          {/* Alert Box (Rejection Details) */}
          <div className="cg-correction-alert" role="alert">
            <div className="cg-correction-alert-header">
              <svg
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                style={{ width: "16px", height: "16px", color: "#dc2626" }}
              >
                <path
                  clipRule="evenodd"
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                />
              </svg>
              <span>Motivo del rechazo (Revisión Editorial):</span>
            </div>
            <p className="cg-correction-alert-text">
              {correctionData.rejectionReason ||
                recurso.rejectionReason ||
                "La imagen adjunta no cuenta con resolución adecuada para la cabecera y el texto alternativo es insuficiente para accesibilidad WCAG. Por favor, actualizar el recurso y detallar el atributo ALT antes de reenviar."}
            </p>
          </div>

          {/* Section 1 - Multimedia y Accesibilidad */}
          <section className="cg-correction-section" data-purpose="section-multimedia-accessibility">
            <h3 className="cg-section-subtitle">
              1. Archivo Multimedia y Accesibilidad
            </h3>

            {/* Image Preview & Replacement Box */}
            <div className="cg-image-replace-box">
              {/* Thumbnail 16:9 */}
              <div className="cg-replace-thumb-container">
                <img
                  alt={correctionData.altText || recurso.titulo || "Recurso gráfico"}
                  className="cg-replace-thumb-img"
                  src={correctionData.imageUrl || recurso.imageUrl || defaultImg1}
                />
                <div className="cg-replace-ratio-tag">16:9</div>
              </div>

              {/* Details & Replace Actions */}
              <div className="cg-replace-info-col">
                <div className="cg-replace-info-top">
                  <div>
                    <h4 className="cg-replace-filename">
                      {correctionData.fileName || "previa_campana_vacunacion.jpg"}
                    </h4>
                    <p className="cg-replace-filesize">
                      {correctionData.fileMeta || "1.8 MB • 1920×1080 px • WEBP/JPG progresivo"}
                    </p>
                  </div>

                  {/* Hidden input for replacing file */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    className="cg-btn-replace-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ width: "14px", height: "14px", color: "#475569" }}
                    >
                      <path
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>Reemplazar archivo</span>
                  </button>
                </div>

                <p className="cg-replace-guideline-note">
                  Formatos admitidos: JPG, PNG, WEBP. Peso máximo: 5MB. Proporción obligatoria para Cabecera Principal: 16:9 horizontal.
                </p>
              </div>
            </div>

            {/* WCAG Alt Text Input Container */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.375rem",
                }}
              >
                <label
                  className="cg-label"
                  htmlFor="campo-texto-alternativo"
                  style={{ display: "flex", alignItems: "center", gap: "0.375rem", margin: 0 }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ width: "16px", height: "16px", color: "#0369a1" }}
                  >
                    <path d="M10 2a2 2 0 100 4 2 2 0 000-4zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm3 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-1 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
                  </svg>
                  <span>Texto Alternativo (Accesibilidad WCAG 2.1 AA)</span>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <span className="cg-wcag-badge-tag">Obligatorio WCAG</span>
              </div>

              <textarea
                id="campo-texto-alternativo"
                className="cg-textarea"
                rows="3"
                placeholder="Describa la imagen para lectores de pantalla..."
                value={correctionData.altText}
                onChange={(e) =>
                  setCorrectionData((prev) => ({ ...prev, altText: e.target.value }))
                }
              />
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                Describa la imagen de manera concisa para personas con disminución visual o conexiones lentas. No incluya frases como "foto de" o "imagen de".
              </p>
            </div>
          </section>

          {/* Section 2 - Datos Principales y Enlace */}
          <section className="cg-correction-section bordered" data-purpose="section-content-metadata">
            <h3 className="cg-section-subtitle">
              2. Datos Principales y Enlace
            </h3>

            {/* Graphic Title */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <label className="cg-label" htmlFor="titulo-contenido">
                Título del Contenido Gráfico{" "}
                <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
              </label>
              <input
                id="titulo-contenido"
                type="text"
                className="cg-input"
                value={correctionData.titulo}
                onChange={(e) =>
                  setCorrectionData((prev) => ({ ...prev, titulo: e.target.value }))
                }
                placeholder="Título del recurso gráfico"
              />
            </div>

            {/* Institutional Description */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <label className="cg-label" htmlFor="descripcion-interna">
                Descripción Institucional
              </label>
              <textarea
                id="descripcion-interna"
                className="cg-textarea"
                rows="2"
                value={correctionData.descripcion}
                onChange={(e) =>
                  setCorrectionData((prev) => ({ ...prev, descripcion: e.target.value }))
                }
                placeholder="Resumen del contenido y contexto institucional..."
              />
            </div>

            {/* Associated Link (URL) */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <label className="cg-label" htmlFor="enlace-asociado">
                Enlace Asociado (URL de destino opcional)
              </label>
              <div className="cg-link-input-wrapper">
                <div className="cg-link-prefix-icon">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ width: "16px", height: "16px" }}
                  >
                    <path
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <input
                  id="enlace-asociado"
                  type="text"
                  className="cg-input cg-input-with-icon"
                  value={correctionData.enlaceUrl}
                  onChange={(e) =>
                    setCorrectionData((prev) => ({ ...prev, enlaceUrl: e.target.value }))
                  }
                  placeholder="https://hospitalevita.formosa.gob.ar/campanas/..."
                />
              </div>
            </div>
          </section>

          {/* Section 3 - Asignación y Publicación */}
          <section className="cg-correction-section bordered" data-purpose="section-placement-availability">
            <h3 className="cg-section-subtitle">
              3. Asignación y Publicación
            </h3>

            <div className="cg-grid-two-cols">
              {/* Dropdown: Portal Page */}
              <div className="cg-form-group" style={{ margin: 0 }}>
                <label className="cg-label" htmlFor="select-pagina-portal">
                  Página del Portal Público{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <select
                  id="select-pagina-portal"
                  className="cg-select"
                  value={
                    correctionData.page?.includes("Inicio")
                      ? "Inicio"
                      : correctionData.page?.includes("Especialidades")
                      ? "Especialidades"
                      : correctionData.page?.includes("Capacitación")
                      ? "Capacitación"
                      : correctionData.page?.includes("Institucional")
                      ? "Institucional"
                      : correctionData.page || "Inicio"
                  }
                  onChange={(e) =>
                    setCorrectionData((prev) => ({ ...prev, page: e.target.value }))
                  }
                >
                  <option value="Inicio">Inicio (Página Principal)</option>
                  <option value="Especialidades">Especialidades y Servicios</option>
                  <option value="Capacitación">Capacitación y Docencia</option>
                  <option value="Institucional">Institucional / Autoridades</option>
                </select>
              </div>

              {/* Dropdown: Section Location */}
              <div className="cg-form-group" style={{ margin: 0 }}>
                <label className="cg-label" htmlFor="select-ubicacion-seccion">
                  Ubicación en la Página{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <select
                  id="select-ubicacion-seccion"
                  className="cg-select"
                  value={
                    correctionData.ubicacion?.includes("Cabecera")
                      ? "Cabecera Principal"
                      : correctionData.ubicacion?.includes("Media")
                      ? "Sección Media"
                      : correctionData.ubicacion?.includes("Lateral")
                      ? "Columna Lateral"
                      : correctionData.ubicacion?.includes("Pie")
                      ? "Pie"
                      : correctionData.ubicacion || "Cabecera Principal"
                  }
                  onChange={(e) =>
                    setCorrectionData((prev) => ({ ...prev, ubicacion: e.target.value }))
                  }
                >
                  <option value="Cabecera Principal">Cabecera Principal</option>
                  <option value="Sección Media">Sección Media Informativa</option>
                  <option value="Columna Lateral">Columna Lateral Institucional</option>
                  <option value="Pie">Pie Institucional</option>
                </select>
              </div>

              {/* Number Input: Order Priority */}
              <div className="cg-form-group" style={{ margin: 0 }}>
                <label className="cg-label" htmlFor="input-orden-visualizacion">
                  Orden de Visualización{" "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    id="input-orden-visualizacion"
                    type="number"
                    min="1"
                    max="99"
                    className="cg-input"
                    style={{ width: "96px" }}
                    value={correctionData.orden}
                    onChange={(e) =>
                      setCorrectionData((prev) => ({ ...prev, orden: e.target.value }))
                    }
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Prioridad relativa en cabecera
                  </span>
                </div>
              </div>

              {/* Toggle Switch: Availability */}
              <div className="cg-form-group" style={{ margin: 0 }}>
                <label className="cg-label">Disponibilidad en el Portal</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    paddingTop: "0.25rem",
                  }}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={correctionData.activo}
                    className={`cg-correction-switch-btn ${correctionData.activo ? "active" : ""}`}
                    onClick={() =>
                      setCorrectionData((prev) => ({ ...prev, activo: !prev.activo }))
                    }
                  >
                    <span className="cg-correction-switch-knob" />
                  </button>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                    {correctionData.activo
                      ? "Activo (Visible al publicarse)"
                      : "Inactivo (Oculto en el portal)"}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Modal Footer */}
        <footer className="cg-correction-footer">
          <button
            type="button"
            className="cg-btn-cancel-flat"
            onClick={onClose}
          >
            Cancelar y cerrar
          </button>

          <div className="cg-correction-footer-actions">
            <button
              type="button"
              className="cg-btn-save-draft"
              onClick={onSaveDraft}
            >
              Guardar Cambios como Borrador
            </button>
            <button
              type="button"
              className="cg-btn-resubmit-approval"
              onClick={onResubmitApproval}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ width: "16px", height: "16px", color: "#bfdbfe" }}
              >
                <path
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Guardar y Reenviar para Aprobación</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CmsContenidoGraficoCorrectionModal;
