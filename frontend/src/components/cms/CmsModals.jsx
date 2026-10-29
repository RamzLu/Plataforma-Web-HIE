import React from "react";

/* ----------------------------------------------------------------------------
 * 1. CmsDeleteModal
 * Modal unificado de confirmación permanente para eliminar cualquier elemento.
 * ------------------------------------------------------------------------- */
export const CmsDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Estás a punto de eliminar este elemento",
  message,
  itemName,
  itemType = "este elemento",
  confirmText = "ELIMINAR",
  cancelText = "CANCELAR",
  isDeleting = false,
  loading = false,
}) => {
  if (!isOpen) return null;

  const busy = isDeleting || loading;

  const renderMessage = () => {
    if (message) return message;
    if (itemName) {
      return (
        <>
          Esta acción es <strong>permanente</strong> y quitará {itemType}{" "}
          <strong>"{itemName}"</strong> junto con sus archivos de la base de datos.
        </>
      );
    }
    return (
      <>
        Esta acción es <strong>permanente</strong> y no se puede deshacer. Los
        datos se borrarán de inmediato.
      </>
    );
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => !busy && onClose && onClose()}
      style={{ zIndex: 99999 }}
    >
      <div
        className="modal-content-esp delete-modal-global"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#ffffff" }}
      >
        <button
          type="button"
          className="btn-close-floating"
          onClick={() => !busy && onClose && onClose()}
          disabled={busy}
          title="Cerrar modal"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="delete-modal-body">
          <div className="delete-icon-wrapper">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>

          <h2 className="delete-modal-title">{title}</h2>
          <div className="delete-modal-divider"></div>

          <p className="delete-modal-text">{renderMessage()}</p>
        </div>

        <div className="delete-modal-footer">
          <button
            type="button"
            className="btn-cancelar-gris"
            onClick={() => !busy && onClose && onClose()}
            disabled={busy}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn-cerrar-rojo"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  className="cms-spinner"
                  style={{
                    width: "14px",
                    height: "14px",
                    borderWidth: "2px",
                    borderTopColor: "#ffffff",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                ></div>
                ELIMINANDO...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * 2. CmsConfirmDraftModal
 * Modal de confirmación al guardar o publicar en estado BORRADOR.
 * ------------------------------------------------------------------------- */
export const CmsConfirmDraftModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Guardar como borrador",
  itemType = "este elemento",
  message,
  confirmText = "Sí, guardar borrador",
  cancelText = "Revisar Estado",
  loading = false,
}) => {
  if (!isOpen) return null;

  const defaultMessage = `El estado de ${itemType} es Borrador. No será visible en el portal público hasta que la publiques. ¿Deseas continuar?`;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 11, 32, 0.4)",
        backdropFilter: "blur(2px)",
      }}
      onClick={() => !loading && onClose && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "384px",
          margin: "16px",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(196, 198, 206, 0.3)",
          boxShadow: "0px 10px 30px rgba(13,34,63,0.08)",
          fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
          position: "relative",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "24px 24px 16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#000b20",
              fontSize: "20px",
              fontWeight: "600",
              lineHeight: "28px",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: "#44474d",
              margin: 0,
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "24px",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {message || defaultMessage}
          </p>
        </div>

        <div
          style={{
            padding: "16px 24px 24px 24px",
            backgroundColor: "#f7f9fb",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 24px",
              backgroundColor: "#000b20",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "12px",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.08em",
              lineHeight: "16px",
              transition: "background-color 0.15s ease, transform 0.15s ease",
              fontFamily: "'Manrope', sans-serif",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <div
                  className="cms-spinner"
                  style={{
                    width: "14px",
                    height: "14px",
                    borderWidth: "2px",
                    borderTopColor: "#ffffff",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                ></div>
                GUARDANDO...
              </>
            ) : (
              confirmText
            )}
          </button>

          <button
            type="button"
            onClick={() => !loading && onClose && onClose()}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 24px",
              backgroundColor: "#d8e0ed",
              color: "#000b20",
              border: "none",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "12px",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.08em",
              lineHeight: "16px",
              transition: "background-color 0.15s ease, transform 0.15s ease",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * 3. CmsUnsavedChangesModal
 * Modal de advertencia cuando el usuario intenta cerrar un formulario con cambios.
 * ------------------------------------------------------------------------- */
export const CmsUnsavedChangesModal = ({
  isOpen,
  onClose,
  onKeepEditing,
  onDiscard,
  onSaveDraft,
  title = "Hay cambios sin guardar",
  message = "¿Qué deseas hacer con la publicación actual?",
  saveDraftText = "Guardar como borrador",
  discardText = "Descartar cambios",
  keepEditingText = "Seguir editando",
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleClose = onKeepEditing || onClose;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 11, 32, 0.4)",
        backdropFilter: "blur(2px)",
      }}
      onClick={() => !loading && handleClose && handleClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "384px",
          margin: "16px",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(196, 198, 206, 0.3)",
          boxShadow: "0px 10px 30px rgba(13,34,63,0.08)",
          fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
          position: "relative",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "24px 24px 16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#000b20",
              fontSize: "20px",
              fontWeight: "600",
              lineHeight: "28px",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: "#44474d",
              margin: 0,
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "24px",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {message}
          </p>
        </div>

        <div
          style={{
            padding: "16px 24px 24px 24px",
            backgroundColor: "#f7f9fb",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px 24px",
                backgroundColor: "#000b20",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "800",
                fontSize: "12px",
                textTransform: "uppercase",
                cursor: "pointer",
                letterSpacing: "0.08em",
                lineHeight: "16px",
                transition: "background-color 0.15s ease, transform 0.15s ease",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {saveDraftText}
            </button>
          )}

          <button
            type="button"
            onClick={onDiscard}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 24px",
              backgroundColor: "#ba1a1a",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "12px",
              textTransform: "uppercase",
              cursor: "pointer",
              letterSpacing: "0.08em",
              lineHeight: "16px",
              transition: "background-color 0.15s ease, transform 0.15s ease",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {discardText}
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 24px",
              backgroundColor: "#d8e0ed",
              color: "#000b20",
              border: "none",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "12px",
              textTransform: "uppercase",
              cursor: "pointer",
              letterSpacing: "0.08em",
              lineHeight: "16px",
              transition: "background-color 0.15s ease, transform 0.15s ease",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {keepEditingText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * 4. CmsContenidoGraficoCorrectionModal
 * Modal especializado para corrección editorial y accesibilidad WCAG 2.1 AA.
 * ------------------------------------------------------------------------- */
export { CmsContenidoGraficoEditModal, CmsContenidoGraficoCorrectionModal } from "./CmsContenidoGraficoCorrectionModal";

export default {
  CmsDeleteModal,
  CmsConfirmDraftModal,
  CmsUnsavedChangesModal,
};

