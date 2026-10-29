import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import defaultImg1 from "../../assets/fondoHospitalCarrusel1.jpg";

// Funciones auxiliares de recorte (idénticas al módulo de Profesionales)
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc,
  pixelCrop,
  fileName = "contenido-grafico.jpg"
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      resolve({ file, url: URL.createObjectURL(blob) });
    }, "image/jpeg");
  });
}

const getAspectRatioFromDimensions = (dimStr) => {
  if (!dimStr) return 16 / 9;
  const match = String(dimStr).match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (match) {
    const width = parseFloat(match[1]);
    const height = parseFloat(match[2]);
    if (width > 0 && height > 0) return width / height;
  }
  return 16 / 9;
};

/**
 * CmsContenidoGraficoEditModal
 * Respeta el estilo unificado de los modales del CMS (.esp-modal-wrapper, .modal-header-esp,
 * .esp-modal-body, .esp-form-label, .esp-form-input, .modal-footer-esp).
 */
export const CmsContenidoGraficoEditModal = ({
  isOpen,
  onClose,
  espacio,
  onSaveEspacio,
}) => {
  const [imagenes, setImagenes] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fileInputRef = useRef(null);

  // Estados de la herramienta de recorte (react-easy-crop)
  const [imageSrc, setImageSrc] = useState(null);
  const [pendingFileName, setPendingFileName] = useState("imagen-carrusel.jpg");
  const [cropMode, setCropMode] = useState("add");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const isBannerPrincipal =
    espacio?.tipo === "Banner Principal" ||
    espacio?.ubicacion?.toLowerCase().includes("banner principal") ||
    espacio?.nombre?.toLowerCase().includes("banner principal") ||
    espacio?.titulo?.toLowerCase().includes("banner principal");

  const dimensionesRequeridas = espacio?.dimensiones || "1920x1080px";
  const cropAspect = getAspectRatioFromDimensions(dimensionesRequeridas);
  const isRejected =
    espacio?.estado === "RECHAZADO" || Boolean(espacio?.rejectionReason);

  useEffect(() => {
    if (isOpen && espacio) {
      if (Array.isArray(espacio.imagenes) && espacio.imagenes.length > 0) {
        setImagenes(espacio.imagenes.map((img) => ({ ...img })));
      } else if (espacio.imageUrl) {
        setImagenes([
          {
            id: `img-${espacio.id}-1`,
            url: espacio.imageUrl || defaultImg1,
            altText: espacio.altText || "",
            titulo: espacio.titulo || "",
            enlaceTexto: espacio.enlaceTexto || "",
            enlaceUrl: espacio.enlaceUrl || "",
            fileName: espacio.fileName || "imagen_actual.jpg",
          },
        ]);
      } else {
        setImagenes([]);
      }
      setActiveIndex(0);
      setIsCropping(false);
      setImageSrc(null);
    }
  }, [isOpen, espacio]);

  if (!isOpen || !espacio) return null;

  const safeIndex =
    imagenes.length > 0 ? Math.min(activeIndex, imagenes.length - 1) : 0;
  const activeImage = imagenes[safeIndex] || null;

  const handleMetadataChange = (field, value) => {
    setImagenes((prev) =>
      prev.map((img, idx) =>
        idx === safeIndex ? { ...img, [field]: value } : img
      )
    );
  };

  const handleAddImageFiles = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seleccione un archivo de imagen válido (JPG, PNG o WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setPendingFileName(file.name || "imagen-carrusel.jpg");
      setCropMode("add");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setImageSrc(reader.result);
      setIsCropping(true);
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenCropExisting = () => {
    if (!activeImage?.url) return;
    setPendingFileName(activeImage.fileName || "imagen-recortada.jpg");
    setCropMode("edit");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setImageSrc(activeImage.url);
    setIsCropping(true);
  };

  const onCropComplete = (croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  };

  const handleSaveCrop = async () => {
    try {
      const result = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        pendingFileName
      );
      if (!result) {
        toast.error("No se pudo procesar el recorte de la imagen.");
        return;
      }

      const { file, url } = result;

      if (cropMode === "edit" && activeImage) {
        setImagenes((prev) =>
          prev.map((img, idx) =>
            idx === safeIndex
              ? { ...img, url, fileObj: file, fileName: pendingFileName }
              : img
          )
        );
        toast.success("Imagen recortada correctamente.");
      } else {
        const nuevaImagen = {
          id: `img-${Date.now()}`,
          url,
          fileObj: file,
          fileName: pendingFileName,
          altText: "",
          titulo: isBannerPrincipal ? espacio.nombre || "" : "",
          enlaceTexto: "",
          enlaceUrl: "",
        };

        setImagenes((prev) => {
          const updated = [...prev, nuevaImagen];
          setActiveIndex(updated.length - 1);
          return updated;
        });
        toast.success("Imagen añadida al carrusel.");
      }

      setIsCropping(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
      toast.error("Error al recortar la imagen.");
    }
  };

  const handleRemoveImage = (indexToRemove, e) => {
    if (e) e.stopPropagation();

    setImagenes((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (safeIndex >= next.length) {
        setActiveIndex(Math.max(0, next.length - 1));
      } else if (indexToRemove < safeIndex) {
        setActiveIndex(Math.max(0, safeIndex - 1));
      }
      return next;
    });
    toast.success("Imagen eliminada del carrusel.");
  };

  const handlePrevSlide = () => {
    if (imagenes.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  const handleNextSlide = () => {
    if (imagenes.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % imagenes.length);
  };

  const handleSubmit = (e, targetStatus = null) => {
    if (e) e.preventDefault();

    if (imagenes.length === 0) {
      toast.error("El espacio debe tener al menos una imagen.");
      return;
    }

    const missingAltIndex = imagenes.findIndex(
      (img) => !img.altText || !img.altText.trim()
    );
    if (missingAltIndex !== -1) {
      setActiveIndex(missingAltIndex);
      toast.error(
        `El Texto Alternativo es obligatorio en la imagen #${missingAltIndex + 1}.`
      );
      return;
    }

    if (isBannerPrincipal) {
      const missingTitleIndex = imagenes.findIndex(
        (img) => !img.titulo || !img.titulo.trim()
      );
      if (missingTitleIndex !== -1) {
        setActiveIndex(missingTitleIndex);
        toast.error(
          `El Título es obligatorio en la imagen #${missingTitleIndex + 1}.`
        );
        return;
      }
    }

    const primaryImage = imagenes[0];
    const nuevoEstado =
      targetStatus ||
      (isRejected ? "PENDIENTE_APROBACION" : espacio.estado || "APROBADO");

    onSaveEspacio({
      ...espacio,
      imagenes,
      imageUrl: primaryImage.url,
      altText: primaryImage.altText,
      titulo: isBannerPrincipal
        ? primaryImage.titulo || espacio.nombre || espacio.titulo
        : espacio.nombre || espacio.titulo,
      enlaceTexto: primaryImage.enlaceTexto || "",
      enlaceUrl: primaryImage.enlaceUrl || "",
      estado: nuevoEstado,
      rejectionReason:
        nuevoEstado === "PENDIENTE_APROBACION" || nuevoEstado === "APROBADO"
          ? null
          : espacio.rejectionReason,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-esp esp-modal-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA UNIFICADA DEL CMS (.modal-header-esp) */}
        <div className="modal-header-esp">
          <h2>
            {isRejected
              ? `Corregir: ${espacio.nombre || espacio.titulo}`
              : `Modificar: ${espacio.nombre || espacio.titulo}`}
          </h2>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* FORMULARIO CON EL ESTILO UNIFICADO (.esp-modal-body y .esp-form-grid) */}
        <form
          onSubmit={(e) => handleSubmit(e)}
          style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div className="esp-modal-body">
            <div className="esp-form-grid">
              {/* MOTIVO DE RECHAZO (Solo si el espacio está rechazado) */}
              {isRejected && espacio.rejectionReason && (
                <div className="esp-full-width">
                  <div className="cg-simple-rejection-box" role="alert">
                    <strong>Motivo del rechazo:</strong> {espacio.rejectionReason}
                  </div>
                </div>
              )}

              {/* 1. ÁREA DE PREVISUALIZACIÓN EN LA PÁGINA */}
              <div className="esp-full-width">
                <label className="esp-form-label">
                  Previsualización en la página{" "}
                  <span
                    style={{
                      textTransform: "none",
                      color: "#94a3b8",
                      fontWeight: "normal",
                    }}
                  >
                    (Medida requerida: {dimensionesRequeridas})
                  </span>
                </label>

                <div className="cg-mockup-stage">
                  {activeImage ? (
                    <>
                      <img
                        src={activeImage.url}
                        alt={activeImage.altText || "Vista previa"}
                        className="cg-mockup-image"
                      />

                      <span className="cg-mockup-measure-pill">
                        {espacio.page} • {dimensionesRequeridas}
                      </span>

                      {imagenes.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="cg-mockup-nav-arrow prev"
                            onClick={handlePrevSlide}
                            aria-label="Imagen anterior"
                          >
                            <span className="material-symbols-outlined">
                              chevron_left
                            </span>
                          </button>
                          <button
                            type="button"
                            className="cg-mockup-nav-arrow next"
                            onClick={handleNextSlide}
                            aria-label="Siguiente imagen"
                          >
                            <span className="material-symbols-outlined">
                              chevron_right
                            </span>
                          </button>
                        </>
                      )}

                      {((isBannerPrincipal && activeImage.titulo) ||
                        activeImage.enlaceTexto ||
                        activeImage.enlaceUrl) && (
                        <div className="cg-mockup-page-overlay">
                          {isBannerPrincipal && activeImage.titulo && (
                            <h3 className="cg-mockup-overlay-title">
                              {activeImage.titulo}
                            </h3>
                          )}
                          {(activeImage.enlaceTexto || activeImage.enlaceUrl) && (
                            <span className="cg-mockup-overlay-cta">
                              {activeImage.enlaceTexto || activeImage.enlaceUrl}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="cg-mockup-empty-state">
                      No hay imágenes cargadas en este espacio ({dimensionesRequeridas})
                    </div>
                  )}
                </div>
              </div>

              {/* 2. FILA DE METADATOS (Estilo .esp-form-label + .esp-form-input) */}
              <div className={isBannerPrincipal ? "" : "esp-full-width"}>
                <label className="esp-form-label" htmlFor="cg-input-alt">
                  Texto Alternativo (ALT) <span className="esp-asterisk">*</span>
                </label>
                <input
                  id="cg-input-alt"
                  type="text"
                  className="esp-form-input"
                  placeholder="Describa la imagen para accesibilidad..."
                  value={activeImage?.altText || ""}
                  onChange={(e) =>
                    handleMetadataChange("altText", e.target.value)
                  }
                  disabled={!activeImage}
                  required
                />
              </div>

              {/* Título condicional: Solo si es tipo "Banner Principal" */}
              {isBannerPrincipal && (
                <div>
                  <label className="esp-form-label" htmlFor="cg-input-titulo">
                    Título <span className="esp-asterisk">*</span>
                  </label>
                  <input
                    id="cg-input-titulo"
                    type="text"
                    className="esp-form-input"
                    placeholder="Ej. Atención Médica de Alta Complejidad..."
                    value={activeImage?.titulo || ""}
                    onChange={(e) =>
                      handleMetadataChange("titulo", e.target.value)
                    }
                    disabled={!activeImage}
                    required
                  />
                </div>
              )}

              {/* Input doble para Enlaces: Texto a mostrar y URL */}
              <div>
                <label className="esp-form-label" htmlFor="cg-input-link-text">
                  Texto del Botón / Enlace (Opcional)
                </label>
                <input
                  id="cg-input-link-text"
                  type="text"
                  className="esp-form-input"
                  placeholder="Ej. Conocer especialidades"
                  value={activeImage?.enlaceTexto || ""}
                  onChange={(e) =>
                    handleMetadataChange("enlaceTexto", e.target.value)
                  }
                  disabled={!activeImage}
                />
              </div>

              <div>
                <label className="esp-form-label" htmlFor="cg-input-link-url">
                  URL del Enlace (Opcional)
                </label>
                <input
                  id="cg-input-link-url"
                  type="text"
                  className="esp-form-input"
                  placeholder="Ej. /especialidades o https://..."
                  value={activeImage?.enlaceUrl || ""}
                  onChange={(e) =>
                    handleMetadataChange("enlaceUrl", e.target.value)
                  }
                  disabled={!activeImage}
                />
              </div>

              {/* 3. GESTOR DE CARRUSEL (Mismo contenedor blanco con borde #cbd5e1 que Profesionales) */}
              <div className="esp-full-width">
                <label className="esp-form-label">
                  Imágenes del Carrusel{" "}
                  <span
                    style={{
                      textTransform: "none",
                      color: "#94a3b8",
                      fontWeight: "normal",
                    }}
                  >
                    ({imagenes.length}{" "}
                    {imagenes.length === 1 ? "imagen" : "imágenes"})
                  </span>
                </label>

                <div
                  style={{
                    background: "#ffffff",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {/* Tira de miniaturas existentes */}
                  <div className="cg-carousel-strip" role="list">
                    {imagenes.map((img, idx) => {
                      const isSelected = idx === safeIndex;
                      return (
                        <div
                          key={img.id || idx}
                          role="listitem"
                          className={`cg-carousel-thumb-item ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => setActiveIndex(idx)}
                          title={`Imagen #${idx + 1}`}
                        >
                          <img
                            src={img.url}
                            alt={img.altText || `Imagen ${idx + 1}`}
                            className="cg-carousel-thumb-img"
                          />
                          <span className="cg-carousel-thumb-number">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            className="cg-carousel-delete-btn"
                            onClick={(e) => handleRemoveImage(idx, e)}
                            title="Eliminar esta imagen"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "15px" }}
                            >
                              delete
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botones debajo de las imágenes (mismo estilo que Profesionales) */}
                  <div className="cg-carousel-under-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAddImageFiles}
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      className="cg-prof-style-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span>Agregar imagen...</span>
                    </button>

                    <button
                      type="button"
                      className="cg-prof-style-btn"
                      disabled={!activeImage}
                      onClick={handleOpenCropExisting}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px" }}
                      >
                        crop
                      </span>
                      <span>Recortar seleccionada</span>
                    </button>

                    <button
                      type="button"
                      className="cg-prof-style-btn danger"
                      disabled={!activeImage}
                      onClick={(e) => handleRemoveImage(safeIndex, e)}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px" }}
                      >
                        delete
                      </span>
                      <span>Eliminar seleccionada</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PIE DEL MODAL UNIFICADO (.modal-footer-esp) */}
          <div className="modal-footer-esp">
            <button
              type="button"
              className="btn-cancelar-gris"
              onClick={onClose}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="btn-cerrar-rojo"
              style={{ backgroundColor: "#2b5b94" }}
            >
              {isRejected ? "GUARDAR Y REENVIAR" : "ACTUALIZAR"}
            </button>
          </div>
        </form>
      </div>

      {/* OVERLAY DEL CROPPER DE IMAGEN (Idéntico al de Profesionales) */}
      {isCropping && imageSrc && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            zIndex: 100000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              color: "#fff",
              marginBottom: "20px",
              fontWeight: "300",
              letterSpacing: "1px",
            }}
          >
            Encuadra la imagen del espacio ({dimensionesRequeridas})
          </h2>

          <div
            style={{
              position: "relative",
              width: "90%",
              maxWidth: "640px",
              height: "380px",
              backgroundColor: "#333",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controles de Zoom */}
          <div
            style={{
              width: "90%",
              maxWidth: "400px",
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, cursor: "pointer" }}
            />
          </div>

          <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
            <button
              type="button"
              onClick={() => {
                setIsCropping(false);
                setImageSrc(null);
              }}
              style={{
                padding: "12px 24px",
                borderRadius: "50px",
                backgroundColor: "#334155",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                textTransform: "uppercase",
                fontSize: "12px",
                letterSpacing: "1px",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              style={{
                padding: "12px 24px",
                borderRadius: "50px",
                backgroundColor: "#0284c7",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                textTransform: "uppercase",
                fontSize: "12px",
                letterSpacing: "1px",
              }}
            >
              Recortar y Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const CmsContenidoGraficoCorrectionModal = CmsContenidoGraficoEditModal;

export default CmsContenidoGraficoEditModal;
