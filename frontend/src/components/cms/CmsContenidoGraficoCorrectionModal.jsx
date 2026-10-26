import React from "react";
import defaultImg1 from "../../assets/fondoHospitalCarrusel1.jpg";

/**
 * CmsContenidoGraficoCorrectionModal
 * Modal simplificado, limpio y amigable para la corrección de contenidos rechazados.
 * Enfocado en la usabilidad práctica sin datos burocráticos ni IDs innecesarios.
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

  return (
    <div
      className="cg-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-correction-title"
    >
      <div
        className="cg-modal-correction-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
      >
        {/* Cabecera limpia: sin IDs de recursos ni números de expediente */}
        <header className="cg-correction-header">
          <div className="cg-correction-header-content">
            <div className="cg-correction-title-row">
              <h2 className="cg-correction-title" id="modal-correction-title">
                Corregir Contenido
              </h2>
              <span className="cg-correction-pill">
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#dc2626" }}>
                  error
                </span>
                <span>Rechazado</span>
              </span>
            </div>
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

        {/* Cuerpo del Modal */}
        <main className="cg-correction-body cg-custom-scroll" style={{ padding: "1.25rem 1.5rem" }}>
          {/* Motivo del Rechazo / Observaciones */}
          {(correctionData.rejectionReason || recurso.rejectionReason) && (
            <div className="cg-correction-alert" role="alert" style={{ marginBottom: "1.25rem" }}>
              <div className="cg-correction-alert-header">
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#dc2626" }}>
                  feedback
                </span>
                <span>Motivo del rechazo:</span>
              </div>
              <p className="cg-correction-alert-text">
                {correctionData.rejectionReason || recurso.rejectionReason}
              </p>
            </div>
          )}

          {/* Vista previa y cambio de imagen simplificado */}
          <div className="cg-image-replace-box" style={{ marginBottom: "1.25rem", padding: "0.875rem" }}>
            <div className="cg-replace-thumb-container" style={{ width: "160px", height: "90px" }}>
              <img
                alt={correctionData.altText || correctionData.titulo || "Imagen"}
                className="cg-replace-thumb-img"
                src={correctionData.imageUrl || recurso.imageUrl || defaultImg1}
              />
            </div>

            <div className="cg-replace-info-col" style={{ gap: "0.35rem" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                {correctionData.fileName || "Imagen actual"}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                Formatos permitidos: JPG, PNG o WEBP
              </p>

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
                style={{ marginTop: "0.25rem", alignSelf: "flex-start" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  photo_camera
                </span>
                <span>Cambiar imagen</span>
              </button>
            </div>
          </div>

          {/* Formulario simple y directo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Título */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <label className="cg-label" htmlFor="titulo-contenido">
                Título del Contenido
              </label>
              <input
                id="titulo-contenido"
                type="text"
                className="cg-input"
                value={correctionData.titulo}
                onChange={(e) =>
                  setCorrectionData((prev) => ({ ...prev, titulo: e.target.value }))
                }
                placeholder="Ingresa el título..."
              />
            </div>

            {/* Descripción */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <label className="cg-label" htmlFor="descripcion-interna">
                Descripción
              </label>
              <textarea
                id="descripcion-interna"
                className="cg-textarea"
                rows="2"
                value={correctionData.descripcion}
                onChange={(e) =>
                  setCorrectionData((prev) => ({ ...prev, descripcion: e.target.value }))
                }
                placeholder="Breve descripción o detalle..."
              />
            </div>

            {/* Ubicación y Página en 2 columnas limpias */}
            <div className="cg-grid-two-cols" style={{ gap: "0.875rem" }}>
              <div className="cg-form-group" style={{ margin: 0 }}>
                <label className="cg-label" htmlFor="select-pagina-portal">
                  Página
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
                  <option value="Especialidades">Especialidades</option>
                  <option value="Capacitación">Capacitaciones</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </div>

              <div className="cg-form-group" style={{ margin: 0 }}>
                <label className="cg-label" htmlFor="select-ubicacion-seccion">
                  Ubicación
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
                  <option value="Sección Media">Sección Media</option>
                  <option value="Columna Lateral">Columna Lateral</option>
                  <option value="Pie">Pie de Página</option>
                </select>
              </div>
            </div>

            {/* Enlace opcional */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <label className="cg-label" htmlFor="enlace-asociado">
                Enlace de destino (opcional)
              </label>
              <input
                id="enlace-asociado"
                type="text"
                className="cg-input"
                value={correctionData.enlaceUrl}
                onChange={(e) =>
                  setCorrectionData((prev) => ({ ...prev, enlaceUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            {/* Texto alternativo accesible */}
            <div className="cg-form-group" style={{ margin: 0 }}>
              <label className="cg-label" htmlFor="campo-texto-alternativo">
                Descripción de la imagen (Texto alternativo)
              </label>
              <input
                id="campo-texto-alternativo"
                type="text"
                className="cg-input"
                placeholder="Breve descripción visual de la imagen..."
                value={correctionData.altText}
                onChange={(e) =>
                  setCorrectionData((prev) => ({ ...prev, altText: e.target.value }))
                }
              />
            </div>
          </div>
        </main>

        {/* Modal Footer limpio y ordenado */}
        <footer className="cg-correction-footer" style={{ padding: "1rem 1.5rem" }}>
          <button
            type="button"
            className="cg-btn-cancel-flat"
            onClick={onClose}
          >
            Cancelar
          </button>

          <div className="cg-correction-footer-actions">
            <button
              type="button"
              className="cg-btn-save-draft"
              onClick={onSaveDraft}
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              className="cg-btn-resubmit-approval"
              onClick={onResubmitApproval}
            >
              <span>Guardar y Reenviar</span>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                send
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CmsContenidoGraficoCorrectionModal;
