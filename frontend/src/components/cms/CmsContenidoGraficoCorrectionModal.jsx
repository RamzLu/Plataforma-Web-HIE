import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { CmsUnsavedChangesModal } from "./CmsModals";
import {
  PORTAL_INTERNAL_ROUTES,
  resolveGraphicImageUrl,
} from "../../utils/contenidoGraficoPresets.js";

const CARRUSEL_INICIO_ASPECT = 1501 / 641;
const MAX_OUTPUT_WIDTH = 1920;

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
  fileName = "carrusel-inicio.jpg"
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx || !pixelCrop) return null;

  const scale =
    pixelCrop.width > MAX_OUTPUT_WIDTH
      ? MAX_OUTPUT_WIDTH / pixelCrop.width
      : 1;

  canvas.width = Math.round(pixelCrop.width * scale);
  canvas.height = Math.round(pixelCrop.height * scale);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const baseName = fileName.replace(/\.[^/.]+$/, "") || "carrusel-imagen";
  const safeJpgName = `${baseName}.jpg`;

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], safeJpgName, { type: "image/jpeg" });
        resolve({ file, url: URL.createObjectURL(blob), fileName: safeJpgName });
      },
      "image/jpeg",
      0.92
    );
  });
}

const getAspectRatioFromEspacio = (espacio) => {
  if (espacio?.id === "espacio-banner-inicio") {
    return CARRUSEL_INICIO_ASPECT;
  }
  if (typeof espacio?.aspectRatio === "number" && espacio.aspectRatio > 0) {
    return espacio.aspectRatio;
  }
  const match = String(espacio?.dimensiones || "").match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (match) {
    const width = parseFloat(match[1]);
    const height = parseFloat(match[2]);
    if (width > 0 && height > 0) return width / height;
  }
  return 16 / 9;
};

/**
 * Réplica visual exacta del Carrusel de Inicio tal como se renderiza en el portal público (`Carousel.jsx`).
 * Se reutiliza tanto en el modal de edición como en el modal de vista previa rápida.
 */
export const PortalCarouselPreview = ({
  imagenes = [],
  activeIndex = 0,
  onChangeSlide,
  textoSuperpuesto = "",
  textoBoton = "",
  altText = "",
}) => {
  const total = imagenes.length;
  const safeIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;
  const currentImg = imagenes[safeIndex] || null;
  const currentImgUrl = resolveGraphicImageUrl(currentImg);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (total <= 1 || !onChangeSlide) return;
    onChangeSlide((safeIndex - 1 + total) % total);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (total <= 1 || !onChangeSlide) return;
    onChangeSlide((safeIndex + 1) % total);
  };

  const lineasTexto = String(textoSuperpuesto || "").split("\n");
  const botonLimpio = String(textoBoton || "").trim();

  return (
    <div
      className="cg-portal-carousel-preview"
      role="region"
      aria-label={altText || "Vista previa del carrusel de inicio"}
    >
      {currentImgUrl ? (
        <div className="cg-portal-carousel-slide">
          <img
            src={currentImgUrl}
            alt={altText || `Imagen ${safeIndex + 1}`}
            className="cg-portal-carousel-img"
          />
        </div>
      ) : (
        <div className="cg-portal-carousel-empty">
          No hay imágenes cargadas en el carrusel
        </div>
      )}

      {/* Capa estática idéntica a .carousel-static-overlay del portal */}
      <div className="cg-portal-static-overlay">
        <div className="cg-portal-content-box">
          {textoSuperpuesto && textoSuperpuesto.trim() !== "" && (
            <div
              className="cg-portal-title"
              style={{ marginBottom: botonLimpio ? undefined : 0 }}
            >
              {lineasTexto.map((linea, i) => (
                <React.Fragment key={i}>
                  {linea}
                  {i < lineasTexto.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          )}

          {botonLimpio && (
            <span className="cg-portal-btn-conocenos">{botonLimpio}</span>
          )}
        </div>
      </div>

      {/* Flechas laterales e indicadores inferiores idénticos al portal */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="cg-portal-arrow cg-portal-arrow-left"
            onClick={handlePrev}
            aria-label="Imagen anterior"
          >
            &#10094;
          </button>
          <button
            type="button"
            className="cg-portal-arrow cg-portal-arrow-right"
            onClick={handleNext}
            aria-label="Siguiente imagen"
          >
            &#10095;
          </button>

          <div className="cg-portal-indicators">
            {imagenes.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                className={`cg-portal-indicator ${
                  idx === safeIndex ? "active" : ""
                }`}
                onClick={() => onChangeSlide && onChangeSlide(idx)}
                aria-label={`Ver imagen ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const CmsContenidoGraficoEditModal = ({
  isOpen,
  onClose,
  espacio,
  onSaveEspacio,
  isSaving = false,
}) => {
  const [imagenes, setImagenes] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [altText, setAltText] = useState("");
  const [textoSuperpuesto, setTextoSuperpuesto] = useState("");
  const [textoBoton, setTextoBoton] = useState("");
  const [enlaceUrl, setEnlaceUrl] = useState("");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const fileInputRef = useRef(null);

  // Estados de la herramienta de recorte al seleccionar una imagen nueva
  const [imageSrc, setImageSrc] = useState(null);
  const [pendingFileName, setPendingFileName] = useState("imagen-carrusel.jpg");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const isCarruselInicio = espacio?.id === "espacio-banner-inicio";
  const dimensionesRequeridas =
    espacio?.dimensiones || (isCarruselInicio ? "1920x820px" : "1920x1080px");
  const cropAspect = getAspectRatioFromEspacio(espacio);
  const isRejected =
    espacio?.estado === "RECHAZADO" || Boolean(espacio?.rejectionReason);

  useEffect(() => {
    if (isOpen && espacio) {
      const listaInicial = Array.isArray(espacio.imagenes)
        ? espacio.imagenes.map((img, i) => ({
            ...img,
            id: img.id || `img-init-${i}`,
          }))
        : [];

      setImagenes(listaInicial);
      setAltText(espacio.altText || "");
      setTextoSuperpuesto(espacio.textoSuperpuesto ?? "");
      setTextoBoton(espacio.textoBoton ?? "");
      setEnlaceUrl(espacio.enlaceUrl ?? "");
      setActiveIndex(0);
      setHasUnsavedChanges(false);
      setShowUnsavedModal(false);
      setIsCropping(false);
      setImageSrc(null);
    }
  }, [isOpen, espacio]);

  if (!isOpen || !espacio) return null;

  const safeIndex =
    imagenes.length > 0 ? Math.min(activeIndex, imagenes.length - 1) : 0;
  const activeImage = imagenes[safeIndex] || null;
  const tieneBoton = textoBoton.trim().length > 0;

  const handleCloseAttempt = () => {
    if (isSaving) return;
    if (hasUnsavedChanges) {
      setShowUnsavedChangesConfirm();
    } else {
      onClose();
    }
  };

  const setShowUnsavedChangesConfirm = () => {
    setShowUnsavedModal(true);
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSelectNewImage = (e) => {
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
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setImageSrc(reader.result);
      setIsCropping(true);
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onCropComplete = (_croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  };

  const handleConfirmCropAndAdd = async () => {
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

      const { file, url, fileName } = result;
      const nuevaImagen = {
        id: `new-${Date.now()}`,
        url,
        fileObj: file,
        fileName,
        presetKey: null,
        isNewUpload: true,
      };

      setImagenes((prev) => {
        const updated = [...prev, nuevaImagen];
        setActiveIndex(updated.length - 1);
        return updated;
      });

      setHasUnsavedChanges(true);
      setIsCropping(false);
      setImageSrc(null);
      toast.success("Imagen recortada y añadida al carrusel.");
    } catch (e) {
      console.error(e);
      toast.error("Error al recortar la imagen seleccionada.");
    }
  };

  const handleRemoveImage = (indexToRemove, e) => {
    if (e) e.stopPropagation();

    if (imagenes.length <= 1) {
      toast.error("El carrusel debe conservar al menos una imagen.");
      return;
    }

    setImagenes((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (safeIndex >= next.length) {
        setActiveIndex(Math.max(0, next.length - 1));
      } else if (indexToRemove < safeIndex) {
        setActiveIndex(Math.max(0, safeIndex - 1));
      }
      return next;
    });

    setHasUnsavedChanges(true);
  };

  // Soporte para reordenar las imágenes arrastrándolas en la tira del carrusel
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      return;
    }

    setImagenes((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(draggedIdx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
    setActiveIndex(targetIdx);
    setDraggedIdx(null);
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (imagenes.length === 0) {
      toast.error("El carrusel debe tener al menos una imagen.");
      return;
    }

    if (!altText.trim()) {
      toast.error(
        "El Texto Alternativo (ALT) es obligatorio para describir la sección."
      );
      return;
    }

    if (isCarruselInicio && !textoSuperpuesto.trim()) {
      toast.error("El texto superpuesto del carrusel es obligatorio.");
      return;
    }

    if (tieneBoton && !enlaceUrl.trim()) {
      toast.error(
        "Seleccione a qué sección del portal debe redireccionar el botón."
      );
      return;
    }

    // Construir FormData real con archivos recortados y orden de slides
    const formData = new FormData();
    formData.append("altText", altText.trim());
    formData.append("textoSuperpuesto", textoSuperpuesto.trim());
    formData.append("textoBoton", tieneBoton ? textoBoton.trim() : "");
    formData.append("enlaceUrl", tieneBoton ? enlaceUrl.trim() : "");

    const slidesDescriptor = [];
    let fileCounter = 0;

    for (const img of imagenes) {
      if (img.fileObj instanceof File) {
        formData.append("imagenes", img.fileObj, img.fileName || "carrusel.jpg");
        slidesDescriptor.push({
          kind: "new",
          fileIndex: fileCounter,
        });
        fileCounter += 1;
      } else if (img.presetKey && String(img.id || "").startsWith("preset-")) {
        slidesDescriptor.push({
          kind: "preset",
          presetKey: img.presetKey,
          fileName: img.fileName || `${img.presetKey}.jpg`,
        });
      } else if (img.id && /^\d+$/.test(String(img.id))) {
        slidesDescriptor.push({
          kind: "existing",
          id: String(img.id),
        });
      } else if (img.presetKey) {
        slidesDescriptor.push({
          kind: "preset",
          presetKey: img.presetKey,
          fileName: img.fileName || `${img.presetKey}.jpg`,
        });
      }
    }

    formData.append("slides", JSON.stringify(slidesDescriptor));

    await onSaveEspacio(espacio.id, formData);
  };

  return (
    <div className="modal-overlay" onClick={handleCloseAttempt}>
      <div
        className="modal-content-esp esp-modal-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA UNIFICADA DEL CMS */}
        <div className="modal-header-esp">
          <h2>
            {isRejected
              ? `Corregir: ${espacio.nombre || espacio.titulo}`
              : `Modificar: ${espacio.nombre || espacio.titulo}`}
          </h2>
          <button
            type="button"
            className="btn-close-modal"
            onClick={handleCloseAttempt}
            disabled={isSaving}
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

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div className="esp-modal-body">
            <div className="esp-form-grid">
              {isRejected && espacio.rejectionReason && (
                <div className="esp-full-width">
                  <div className="cg-simple-rejection-box" role="alert">
                    <strong>Motivo del rechazo:</strong> {espacio.rejectionReason}
                  </div>
                </div>
              )}

              {/* 1. PREVISUALIZACIÓN FIEL AL PORTAL PÚBLICO */}
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
                    (Medida recomendada: {dimensionesRequeridas} aprox.)
                  </span>
                </label>

                {isCarruselInicio ? (
                  <PortalCarouselPreview
                    imagenes={imagenes}
                    activeIndex={safeIndex}
                    onChangeSlide={setActiveIndex}
                    textoSuperpuesto={textoSuperpuesto}
                    textoBoton={textoBoton}
                    altText={altText}
                  />
                ) : (
                  <div className="cg-mockup-stage">
                    {activeImage && resolveGraphicImageUrl(activeImage) ? (
                      <img
                        src={resolveGraphicImageUrl(activeImage)}
                        alt={altText || "Vista previa"}
                        className="cg-mockup-image"
                      />
                    ) : (
                      <div className="cg-mockup-empty-state">
                        No hay imágenes cargadas en este espacio ({dimensionesRequeridas})
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. TEXTO ALTERNATIVO DE LA SECCIÓN (ALT) */}
              <div className="esp-full-width">
                <label className="esp-form-label" htmlFor="cg-input-alt">
                  Texto Alternativo de la Sección (ALT){" "}
                  <span className="esp-asterisk">*</span>
                </label>
                <input
                  id="cg-input-alt"
                  type="text"
                  className="esp-form-input"
                  placeholder="Descripción general de la sección para lectores de pantalla (personas ciegas)..."
                  value={altText}
                  onChange={(e) => {
                    setAltText(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  disabled={isSaving}
                  required
                />
              </div>

              {/* 3. TEXTO SUPERPUESTO EN EL CARRUSEL */}
              {isCarruselInicio && (
                <div className="esp-full-width">
                  <label className="esp-form-label" htmlFor="cg-input-overlay-text">
                    Texto Superpuesto en el Carrusel{" "}
                    <span className="esp-asterisk">*</span>
                    <span
                      style={{
                        textTransform: "none",
                        color: "#94a3b8",
                        fontWeight: "normal",
                        marginLeft: "6px",
                      }}
                    >
                      (Presione Enter para dividir en renglones como en la portada)
                    </span>
                  </label>
                  <textarea
                    id="cg-input-overlay-text"
                    className="esp-form-input"
                    rows={3}
                    placeholder={"Ej.\n6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL"}
                    value={textoSuperpuesto}
                    onChange={(e) => {
                      setTextoSuperpuesto(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    disabled={isSaving}
                    required
                    style={{ resize: "vertical", lineHeight: "1.4" }}
                  />
                </div>
              )}

              {/* 4. TEXTO DEL BOTÓN Y REDIRECCIÓN INTERNA DEL PORTAL */}
              {isCarruselInicio && (
                <>
                  <div>
                    <label className="esp-form-label" htmlFor="cg-input-btn-text">
                      Texto del Botón{" "}
                      <span
                        style={{
                          textTransform: "none",
                          color: "#94a3b8",
                          fontWeight: "normal",
                        }}
                      >
                        (Opcional)
                      </span>
                    </label>
                    <input
                      id="cg-input-btn-text"
                      type="text"
                      className="esp-form-input"
                      placeholder="Ej. CONOCENOS (dejar vacío sin botón)"
                      value={textoBoton}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTextoBoton(val);
                        if (!val.trim()) {
                          setEnlaceUrl("");
                        }
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="esp-form-label" htmlFor="cg-select-redirect">
                      Redirección del Botón{" "}
                      {tieneBoton ? (
                        <span className="esp-asterisk">*</span>
                      ) : (
                        <span
                          style={{
                            textTransform: "none",
                            color: "#94a3b8",
                            fontWeight: "normal",
                          }}
                        >
                          (Se activa al escribir texto en el botón)
                        </span>
                      )}
                    </label>
                    <select
                      id="cg-select-redirect"
                      className="esp-form-input"
                      value={tieneBoton ? enlaceUrl : ""}
                      onChange={(e) => {
                        setEnlaceUrl(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={!tieneBoton || isSaving}
                      required={tieneBoton}
                    >
                      <option value="">-- Seleccione una sección del portal --</option>
                      {PORTAL_INTERNAL_ROUTES.map((route) => (
                        <option key={route.value} value={route.value}>
                          {route.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 5. GESTOR DE IMÁGENES DEL CARRUSEL */}
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
                    {imagenes.length === 1 ? "imagen" : "imágenes"} • puede arrastrar para cambiar el orden)
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
                  {/* Tira de miniaturas ubicadas por orden */}
                  <div className="cg-carousel-strip" role="list">
                    {imagenes.map((img, idx) => {
                      const isSelected = idx === safeIndex;
                      const thumbUrl = resolveGraphicImageUrl(img);
                      return (
                        <div
                          key={img.id || idx}
                          role="listitem"
                          draggable={!isSaving}
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(idx)}
                          className={`cg-carousel-thumb-item ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => setActiveIndex(idx)}
                          title={`Imagen #${idx + 1} (clic para previsualizar, arrastrar para reordenar)`}
                        >
                          {thumbUrl && (
                            <img
                              src={thumbUrl}
                              alt={`Miniatura ${idx + 1}`}
                              className="cg-carousel-thumb-img"
                            />
                          )}
                          <span className="cg-carousel-thumb-number">
                            #{idx + 1}
                          </span>
                          {imagenes.length > 1 && (
                            <button
                              type="button"
                              className="cg-carousel-delete-btn"
                              onClick={(e) => handleRemoveImage(idx, e)}
                              disabled={isSaving}
                              title="Eliminar esta imagen"
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "15px" }}
                              >
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Acciones debajo: únicamente Agregar y Eliminar */}
                  <div className="cg-carousel-under-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleSelectNewImage}
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      className="cg-prof-style-btn"
                      disabled={isSaving}
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
                      className="cg-prof-style-btn danger"
                      disabled={!activeImage || imagenes.length <= 1 || isSaving}
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

          {/* PIE DEL MODAL */}
          <div className="modal-footer-esp">
            <button
              type="button"
              className="btn-cancelar-gris"
              onClick={handleCloseAttempt}
              disabled={isSaving}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="btn-cerrar-rojo"
              style={{ backgroundColor: "#2b5b94" }}
              disabled={isSaving}
            >
              {isSaving ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className="cms-spinner"
                    style={{
                      width: "16px",
                      height: "16px",
                      borderWidth: "2px",
                      borderTopColor: "#ffffff",
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  />
                  ACTUALIZANDO...
                </span>
              ) : (
                "ACTUALIZAR"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RECORTADOR EMERGENTE AUTOMÁTICO AL SELECCIONAR UNA IMAGEN NUEVA */}
      {isCropping && imageSrc && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            zIndex: 100000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <h2
            style={{
              color: "#fff",
              marginBottom: "8px",
              fontWeight: "400",
              letterSpacing: "0.5px",
              fontSize: "1.25rem",
              textAlign: "center",
            }}
          >
            Recortar imagen al tamaño del carrusel
          </h2>
          <p
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "0.85rem",
              textAlign: "center",
            }}
          >
            Ajuste el encuadre a la proporción exacta en la que se verá en el portal ({dimensionesRequeridas} aprox.)
          </p>

          <div
            style={{
              position: "relative",
              width: "92%",
              maxWidth: "740px",
              height: "380px",
              backgroundColor: "#0c2340",
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

          <div
            style={{
              width: "90%",
              maxWidth: "420px",
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
              step={0.05}
              aria-label="Zoom de imagen"
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, cursor: "pointer" }}
            />
          </div>

          <div style={{ marginTop: "28px", display: "flex", gap: "15px" }}>
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
              onClick={handleConfirmCropAndAdd}
              style={{
                padding: "12px 28px",
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
              Recortar y Agregar
            </button>
          </div>
        </div>
      )}

      {/* ADVERTENCIA DE CAMBIOS SIN GUARDAR */}
      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        message="¿Deseas descartar los cambios realizados en este espacio gráfico?"
      />
    </div>
  );
};

export const CmsContenidoGraficoCorrectionModal = CmsContenidoGraficoEditModal;

export default CmsContenidoGraficoEditModal;
