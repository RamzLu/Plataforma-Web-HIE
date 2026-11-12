import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { CmsUnsavedChangesModal } from "./CmsModals";
import {
  DEFAULT_APRENDE_INICIO,
  DEFAULT_PACIENTES_INICIO,
  DEFAULT_RESIDENCIAS_HERO,
  PORTAL_INTERNAL_ROUTES,
  normalizeInternalPortalPath,
  resolveGraphicImageUrl,
} from "../../utils/contenidoGraficoPresets.js";

const CARRUSEL_INICIO_ASPECT = 1501 / 641;
const PACIENTES_INICIO_ASPECT = 4 / 3;
const APRENDE_MAIN_ASPECT = 630 / 480;
const APRENDE_CARD_ASPECT = 1;
const RESIDENCIAS_HERO_ASPECT = 1348 / 1181;
const MAX_OUTPUT_WIDTH = 1920;

const COLORES_TARJETA_APRENDE = ["green", "yellow", "blue"];

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
  fileName = "contenido-grafico.jpg",
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx || !pixelCrop) return null;

  const scale =
    pixelCrop.width > MAX_OUTPUT_WIDTH ? MAX_OUTPUT_WIDTH / pixelCrop.width : 1;

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
    canvas.height,
  );

  const baseName = fileName.replace(/\.[^/.]+$/, "") || "imagen-recortada";
  const safeJpgName = `${baseName}.jpg`;

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], safeJpgName, { type: "image/jpeg" });
        resolve({
          file,
          url: URL.createObjectURL(blob),
          fileName: safeJpgName,
        });
      },
      "image/jpeg",
      0.92,
    );
  });
}

const getAspectRatioFromEspacio = (espacio, activeIndex = 0) => {
  if (espacio?.id === "espacio-banner-inicio") {
    return CARRUSEL_INICIO_ASPECT;
  }
  if (espacio?.id === "espacio-seccion-pacientes") {
    return PACIENTES_INICIO_ASPECT;
  }
  if (espacio?.id === "espacio-aprende-inicio") {
    return activeIndex === 0 ? APRENDE_MAIN_ASPECT : APRENDE_CARD_ASPECT;
  }
  if (
    espacio?.id === "espacio-residencias-destacado" ||
    espacio?.id === "espacio-banner-capacitacion" ||
    espacio?.esTarjetaResidencias
  ) {
    return RESIDENCIAS_HERO_ASPECT;
  }
  if (typeof espacio?.aspectRatio === "number" && espacio.aspectRatio > 0) {
    return espacio.aspectRatio;
  }
  const match = String(espacio?.dimensiones || "").match(
    /(\d+)\s*[x×]\s*(\d+)/i,
  );
  if (match) {
    const width = parseFloat(match[1]);
    const height = parseFloat(match[2]);
    if (width > 0 && height > 0) return width / height;
  }
  return 16 / 9;
};

/**
 * Réplica visual exacta del Carrusel de Inicio tal como se renderiza en el portal público (`Carousel.jsx`).
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

/**
 * Réplica visual exacta de la sección "Información para Pacientes" (`PatientInfoSection.jsx`),
 * sin el bloque ni botón de WhatsApp y con los 5 desplegables interactivos sincronizados con su imagen derecha.
 */
export const PortalPatientInfoPreview = ({
  items = [],
  activeIndex = 0,
  onSelectItem,
}) => {
  const safeItems =
    Array.isArray(items) && items.length > 0
      ? items
      : DEFAULT_PACIENTES_INICIO.imagenes;

  const safeIndex =
    safeItems.length > 0
      ? Math.min(Math.max(0, activeIndex), safeItems.length - 1)
      : 0;

  const activeItem = safeItems[safeIndex] || safeItems[0] || null;
  const activeImgUrl = resolveGraphicImageUrl(activeItem);

  return (
    <div
      className="cg-portal-pacientes-preview"
      role="region"
      aria-label="Vista previa de la sección Información para Pacientes"
    >
      <div className="cg-portal-pacientes-header">
        <span className="cg-portal-pacientes-subtitle">INFORMACIÓN PARA</span>
        <h3 className="cg-portal-pacientes-title">PACIENTES</h3>
      </div>

      <div className="cg-portal-pacientes-split">
        <div className="cg-portal-pacientes-accordion">
          {safeItems.map((item, idx) => {
            const isOpen = idx === safeIndex;
            const lineas = String(item.textoDesplegable || "").split("\n");
            return (
              <div
                key={item.id || idx}
                className={`cg-portal-pacientes-item ${isOpen ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="cg-portal-pacientes-item-btn"
                  onClick={() => onSelectItem && onSelectItem(idx)}
                  aria-expanded={isOpen}
                >
                  <span>
                    {item.titulo && item.titulo.trim()
                      ? item.titulo
                      : `DESPLEGABLE #${idx + 1}`}
                  </span>
                  <svg
                    className="cg-portal-pacientes-chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                {isOpen && (
                  <div className="cg-portal-pacientes-item-body">
                    <p>
                      {item.textoDesplegable && item.textoDesplegable.trim() ? (
                        lineas.map((linea, idxLinea) => (
                          <React.Fragment key={idxLinea}>
                            {linea}
                            {idxLinea < lineas.length - 1 && <br />}
                          </React.Fragment>
                        ))
                      ) : (
                        <em style={{ color: "#94a3b8" }}>
                          Escriba el texto informativo para este desplegable...
                        </em>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="cg-portal-pacientes-img-box">
          {activeImgUrl ? (
            <img
              key={activeImgUrl}
              src={activeImgUrl}
              alt={
                activeItem?.altText ||
                activeItem?.titulo ||
                "Información para Pacientes"
              }
              className="cg-portal-pacientes-img"
            />
          ) : (
            <div className="cg-portal-pacientes-img-empty">
              Sin imagen asignada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Réplica visual exacta de la sección "Aprendé con el Evita" (`AprendeSection.jsx`).
 * Permite hacer clic sobre la imagen/encabezado general o sobre cualquiera de las 3 tarjetas
 * para seleccionar esa parte y editarla inmediatamente.
 */
export const PortalAprendePreview = ({
  items = [],
  activeIndex = 0,
  onSelectItem,
}) => {
  const safeItems =
    Array.isArray(items) && items.length >= 4
      ? items
      : DEFAULT_APRENDE_INICIO.imagenes;

  const principal = safeItems[0] || DEFAULT_APRENDE_INICIO.imagenes[0];
  const tarjetas = safeItems.slice(1, 4);

  const mainImgUrl = resolveGraphicImageUrl(principal);
  const isMainSelected = activeIndex === 0;
  const lineasParrafo = String(principal?.parrafoDescripcion || "").split("\n");

  return (
    <div
      className="cg-portal-aprende-preview"
      role="region"
      aria-label="Vista previa de la sección Aprendé con el Evita"
    >
      <div className="cg-portal-aprende-grid">
        {/* Columna izquierda: Imagen editorial grande */}
        <div
          className={`cg-portal-aprende-left ${
            isMainSelected ? "is-selected" : ""
          } ${onSelectItem ? "is-clickable" : ""}`}
          onClick={() => onSelectItem && onSelectItem(0)}
          title={
            onSelectItem
              ? "Clic para editar la imagen principal y el encabezado"
              : undefined
          }
        >
          {mainImgUrl ? (
            <img
              src={mainImgUrl}
              alt={
                principal?.altText || "Educación para la salud - Hospital Evita"
              }
              className="cg-portal-aprende-main-img"
            />
          ) : (
            <div className="cg-portal-aprende-empty">Sin imagen principal</div>
          )}
        </div>

        {/* Columna derecha: Encabezado, párrafo y las 3 tarjetas */}
        <div className="cg-portal-aprende-right">
          <div
            className={`cg-portal-aprende-text-block ${
              isMainSelected ? "is-selected" : ""
            } ${onSelectItem ? "is-clickable" : ""}`}
            onClick={() => onSelectItem && onSelectItem(0)}
            title={
              onSelectItem
                ? "Clic para editar subtítulo, título y párrafo descriptivo"
                : undefined
            }
          >
            <span className="cg-portal-aprende-subtitle">
              {principal?.subtituloEncabezado &&
              principal.subtituloEncabezado.trim()
                ? principal.subtituloEncabezado
                : "EDUCACIÓN PARA LA SALUD"}
            </span>
            <h3 className="cg-portal-aprende-title">
              {principal?.titulo && principal.titulo.trim()
                ? principal.titulo
                : "APRENDÉ CON EL EVITA"}
            </h3>
            <p className="cg-portal-aprende-desc">
              {principal?.parrafoDescripcion &&
              principal.parrafoDescripcion.trim() ? (
                lineasParrafo.map((linea, idxL) => (
                  <React.Fragment key={idxL}>
                    {linea}
                    {idxL < lineasParrafo.length - 1 && <br />}
                  </React.Fragment>
                ))
              ) : (
                <em style={{ color: "#94a3b8" }}>
                  Escriba el párrafo descriptivo de la sección...
                </em>
              )}
            </p>
          </div>

          <div className="cg-portal-aprende-cards">
            {tarjetas.map((card, idx) => {
              const itemIndex = idx + 1;
              const isCardSelected = activeIndex === itemIndex;
              const cardImgUrl = resolveGraphicImageUrl(card);
              const badgeColor =
                card.badgeColor || COLORES_TARJETA_APRENDE[idx] || "blue";

              return (
                <div
                  key={card.id || itemIndex}
                  className={`cg-portal-aprende-card ${
                    isCardSelected ? "is-selected" : ""
                  } ${onSelectItem ? "is-clickable" : ""}`}
                  onClick={() => onSelectItem && onSelectItem(itemIndex)}
                  title={
                    onSelectItem
                      ? `Clic para editar la Tarjeta #${itemIndex}`
                      : undefined
                  }
                >
                  <div className="cg-portal-aprende-card-img-wrap">
                    {cardImgUrl ? (
                      <img
                        src={cardImgUrl}
                        alt={
                          card.altText || card.titulo || `Tarjeta ${itemIndex}`
                        }
                        className="cg-portal-aprende-card-img"
                      />
                    ) : (
                      <div className="cg-portal-aprende-empty">Sin img</div>
                    )}
                  </div>

                  <div className="cg-portal-aprende-card-info">
                    <span className={`cg-portal-aprende-badge ${badgeColor}`}>
                      {card.etiquetaSuperior && card.etiquetaSuperior.trim()
                        ? card.etiquetaSuperior
                        : `ETIQUETA #${itemIndex}`}
                    </span>
                    <h4 className="cg-portal-aprende-card-title">
                      {card.titulo && card.titulo.trim()
                        ? card.titulo
                        : `Título tarjeta #${itemIndex}`}
                    </h4>
                  </div>

                  <div className="cg-portal-aprende-card-link">
                    <span>MÁS INFORMACIÓN</span>
                    <span className="cg-portal-aprende-arrow">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Réplica visual exacta de la tarjeta destacada de Residencias Médicas (`ResidenciasPage.jsx`).
 * Permite previsualizar en tiempo real el título con & estilizado, párrafo, botón y la imagen derecha.
 */
export const PortalResidenciasHeroPreview = ({
  titulo = "Excelencia en Alta Complejidad & Vocación Pública",
  parrafoDescripcion = "",
  textoBoton = "Ver Especialidades Disponibles",
  enlaceUrl = "/especialidades",
  imagen = null,
  altText = "",
  onSelectImage,
}) => {
  const imgUrl = resolveGraphicImageUrl(imagen);
  const lineas = String(parrafoDescripcion || "").split("\n");

  const renderTitulo = (texto) => {
    if (!texto) return "Excelencia en Alta Complejidad & Vocación Pública";
    if (texto.includes("&")) {
      const partes = texto.split("&");
      return (
        <>
          {partes[0]}
          <span style={{ color: "#006eb3", fontWeight: 300 }}>&</span>
          {partes.slice(1).join("&")}
        </>
      );
    }
    return texto;
  };

  return (
    <div
      className="cg-portal-residencias-preview"
      role="region"
      aria-label="Vista previa de la tarjeta destacada de Residencias"
    >
      <div className="cg-portal-residencias-content">
        <h3 className="cg-portal-residencias-title">
          {renderTitulo(titulo)}
        </h3>
        <p className="cg-portal-residencias-desc">
          {parrafoDescripcion && parrafoDescripcion.trim() ? (
            lineas.map((linea, idxL) => (
              <React.Fragment key={idxL}>
                {linea}
                {idxL < lineas.length - 1 && <br />}
              </React.Fragment>
            ))
          ) : (
            <em style={{ color: "#94a3b8" }}>
              Escriba el párrafo descriptivo de la convocatoria...
            </em>
          )}
        </p>

        {textoBoton && textoBoton.trim() ? (
          <div className="cg-portal-residencias-btn">
            <span>{textoBoton}</span>
            <span style={{ fontSize: "1.1em", lineHeight: 1 }}>→</span>
          </div>
        ) : null}
      </div>

      <div
        className={`cg-portal-residencias-media ${
          onSelectImage ? "is-clickable" : ""
        }`}
        onClick={() => onSelectImage && onSelectImage()}
        title={
          onSelectImage
            ? "Clic para cambiar o recortar la imagen de la sección"
            : undefined
        }
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={altText || titulo || "Equipo médico de residencias"}
            className="cg-portal-residencias-img"
          />
        ) : (
          <div className="cg-portal-residencias-empty">
            Sin imagen asignada (1350x1180px aprox.)
          </div>
        )}
      </div>
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
  const [titulo, setTitulo] = useState("");
  const [parrafoDescripcion, setParrafoDescripcion] = useState("");
  const [textoSuperpuesto, setTextoSuperpuesto] = useState("");
  const [textoBoton, setTextoBoton] = useState("");
  const [enlaceUrl, setEnlaceUrl] = useState("");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const fileInputRef = useRef(null);

  // Estados de la herramienta de recorte al seleccionar una imagen nueva
  const [imageSrc, setImageSrc] = useState(null);
  const [pendingFileName, setPendingFileName] = useState("imagen.jpg");
  const [cropMode, setCropMode] = useState("add"); // "add" | "replace"
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const isCarruselInicio = espacio?.id === "espacio-banner-inicio";
  const isSeccionPacientes = espacio?.id === "espacio-seccion-pacientes";
  const isSeccionAprende = espacio?.id === "espacio-aprende-inicio";
  const isTarjetaResidencias =
    espacio?.id === "espacio-residencias-destacado" ||
    espacio?.id === "espacio-banner-capacitacion" ||
    Boolean(espacio?.esTarjetaResidencias);

  const safeIndex =
    imagenes.length > 0 ? Math.min(activeIndex, imagenes.length - 1) : 0;
  const activeImage = imagenes[safeIndex] || null;
  const tieneBoton = textoBoton.trim().length > 0;

  const dimensionesRequeridas = isSeccionAprende
    ? safeIndex === 0
      ? "1260x960px"
      : "600x600px (1:1 cuadrada)"
    : isTarjetaResidencias
      ? "1350x1180px aprox. (~1.15:1)"
      : espacio?.dimensiones ||
        (isCarruselInicio
          ? "1920x820px"
          : isSeccionPacientes
            ? "1200x900px"
            : "1920x1080px");

  const cropAspect = getAspectRatioFromEspacio(espacio, safeIndex);
  const isRejected =
    espacio?.estado === "RECHAZADO" || Boolean(espacio?.rejectionReason);

  useEffect(() => {
    if (isOpen && espacio) {
      let listaInicial = [];

      if (espacio.id === "espacio-seccion-pacientes") {
        const defaultsPacientes = DEFAULT_PACIENTES_INICIO.imagenes;
        const recibidas = Array.isArray(espacio.imagenes)
          ? espacio.imagenes
          : [];

        listaInicial = defaultsPacientes.map((defItem, idx) => {
          const existente = recibidas[idx] || null;
          if (!existente) return { ...defItem };
          return {
            ...defItem,
            ...existente,
            id: existente.id || defItem.id,
            titulo: existente.titulo ?? defItem.titulo,
            textoDesplegable:
              existente.textoDesplegable ?? defItem.textoDesplegable,
            altText: existente.altText ?? defItem.altText,
          };
        });
      } else if (espacio.id === "espacio-aprende-inicio") {
        const defaultsAprende = DEFAULT_APRENDE_INICIO.imagenes;
        const recibidas = Array.isArray(espacio.imagenes)
          ? espacio.imagenes
          : [];

        listaInicial = defaultsAprende.map((defItem, idx) => {
          const existente = recibidas[idx] || null;
          if (!existente) return { ...defItem };

          if (idx === 0) {
            return {
              ...defItem,
              ...existente,
              id: existente.id || defItem.id,
              rolItem: "principal",
              subtituloEncabezado:
                existente.subtituloEncabezado ?? defItem.subtituloEncabezado,
              titulo: existente.titulo ?? defItem.titulo,
              parrafoDescripcion:
                existente.parrafoDescripcion ?? defItem.parrafoDescripcion,
              altText: existente.altText ?? defItem.altText,
            };
          }

          return {
            ...defItem,
            ...existente,
            id: existente.id || defItem.id,
            rolItem: "tarjeta",
            etiquetaSuperior:
              existente.etiquetaSuperior ?? defItem.etiquetaSuperior,
            badgeColor: COLORES_TARJETA_APRENDE[idx - 1] || defItem.badgeColor,
            titulo: existente.titulo ?? defItem.titulo,
            altText: existente.altText ?? defItem.altText,
            enlaceUrl: normalizeInternalPortalPath(
              existente.enlaceUrl ?? defItem.enlaceUrl,
            ),
          };
        });
      } else if (
        espacio.id === "espacio-residencias-destacado" ||
        espacio.id === "espacio-banner-capacitacion" ||
        espacio.esTarjetaResidencias
      ) {
        const defHero = DEFAULT_RESIDENCIAS_HERO;
        const recibidas =
          Array.isArray(espacio.imagenes) && espacio.imagenes.length > 0
            ? espacio.imagenes
            : defHero.imagenes;
        const imgItem = recibidas[0] || defHero.imagenes[0];

        const tituloFinal =
          espacio.titulo ??
          imgItem.titulo ??
          espacio.textoSuperpuesto ??
          defHero.titulo;
        const parrafoFinal =
          espacio.parrafoDescripcion ??
          imgItem.parrafoDescripcion ??
          defHero.parrafoDescripcion;
        const botonFinal =
          espacio.textoBoton ??
          imgItem.textoBoton ??
          defHero.textoBoton;
        const enlaceFinal = normalizeInternalPortalPath(
          espacio.enlaceUrl ??
          imgItem.enlaceUrl ??
          defHero.enlaceUrl,
        );
        const altFinal =
          espacio.altText ??
          imgItem.altText ??
          defHero.altText;

        listaInicial = [
          {
            ...imgItem,
            id: imgItem.id || "residencias-hero-0",
            titulo: tituloFinal,
            parrafoDescripcion: parrafoFinal,
            textoBoton: botonFinal,
            enlaceUrl: enlaceFinal,
            altText: altFinal,
          },
        ];

        setTitulo(tituloFinal);
        setParrafoDescripcion(parrafoFinal);
        setTextoBoton(botonFinal);
        setEnlaceUrl(enlaceFinal);
        setAltText(altFinal);
        setTextoSuperpuesto("");
      } else {
        listaInicial = Array.isArray(espacio.imagenes)
          ? espacio.imagenes.map((img, i) => ({
              ...img,
              id: img.id || `img-init-${i}`,
            }))
          : [];
        setTitulo("");
        setParrafoDescripcion("");
      }

      setImagenes(listaInicial);
      if (
        espacio.id !== "espacio-residencias-destacado" &&
        espacio.id !== "espacio-banner-capacitacion" &&
        !espacio.esTarjetaResidencias
      ) {
        setAltText(espacio.altText || "");
        setTextoSuperpuesto(espacio.textoSuperpuesto ?? "");
        setTextoBoton(espacio.textoBoton ?? "");
        setEnlaceUrl(normalizeInternalPortalPath(espacio.enlaceUrl ?? ""));
      }
      setActiveIndex(0);
      setHasUnsavedChanges(false);
      setShowUnsavedModal(false);
      setIsCropping(false);
      setImageSrc(null);
    }
  }, [isOpen, espacio]);

  if (!isOpen || !espacio) return null;

  const handleCloseAttempt = () => {
    if (isSaving) return;
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleUpdateActiveItemField = (field, value) => {
    setImagenes((prev) =>
      prev.map((item, idx) =>
        idx === safeIndex ? { ...item, [field]: value } : item,
      ),
    );
    setHasUnsavedChanges(true);
  };

  const triggerFilePicker = (mode = "add") => {
    setCropMode(mode);
    fileInputRef.current?.click();
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
      setPendingFileName(file.name || "imagen.jpg");
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

  const handleConfirmCrop = async () => {
    try {
      const result = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        pendingFileName,
      );
      if (!result) {
        toast.error("No se pudo procesar el recorte de la imagen.");
        return;
      }

      const { file, url, fileName } = result;

      if (cropMode === "replace" || isSeccionPacientes || isSeccionAprende || isTarjetaResidencias) {
        setImagenes((prev) =>
          prev.map((item, idx) =>
            idx === safeIndex
              ? {
                  ...item,
                  id: `new-${Date.now()}-${idx}`,
                  url,
                  fileObj: file,
                  fileName,
                  presetKey: null,
                  isNewUpload: true,
                }
              : item,
          ),
        );
        if (isSeccionAprende) {
          toast.success(
            safeIndex === 0
              ? "Imagen principal recortada y actualizada."
              : `Imagen de la Tarjeta #${safeIndex} recortada y actualizada.`,
          );
        } else if (isTarjetaResidencias) {
          toast.success("Imagen de la tarjeta de Residencias recortada y actualizada.");
        } else {
          toast.success(
            `Imagen del desplegable #${safeIndex + 1} recortada y actualizada.`,
          );
        }
      } else {
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
        toast.success("Imagen recortada y añadida al carrusel.");
      }

      setHasUnsavedChanges(true);
      setIsCropping(false);
      setImageSrc(null);
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

  const serializeSlideSource = (img, formData, fileCounterRef, defaultName) => {
    if (img.fileObj instanceof File) {
      formData.append("imagenes", img.fileObj, img.fileName || defaultName);
      const idx = fileCounterRef.current;
      fileCounterRef.current += 1;
      return {
        kind: "new",
        fileIndex: idx,
      };
    }
    if (img.id && /^\d+$/.test(String(img.id))) {
      return {
        kind: "existing",
        id: String(img.id),
      };
    }
    return {
      kind: "preset",
      presetKey: img.presetKey,
      fileName: img.fileName || `${img.presetKey || "imagen"}.jpg`,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!hasUnsavedChanges) {
      toast.error("No se detectaron cambios para actualizar.");
      return;
    }

    // =========================================================================
    // ENVÍO ESPECÍFICO: RESIDENCIAS (TARJETA DESTACADA CON 1 IMAGEN Y BOTÓN)
    // =========================================================================
    if (isTarjetaResidencias) {
      if (!String(titulo || "").trim()) {
        toast.error("Complete el título de la sección.");
        return;
      }
      if (!String(parrafoDescripcion || "").trim()) {
        toast.error("Complete el párrafo descriptivo de la sección.");
        return;
      }
      if (!String(textoBoton || "").trim()) {
        toast.error("Complete el texto del botón de la sección.");
        return;
      }
      if (!String(enlaceUrl || "").trim()) {
        toast.error("Seleccione a qué sección del portal redirige el botón.");
        return;
      }
      if (!String(altText || "").trim()) {
        toast.error("Complete el Texto Alternativo (ALT) de la imagen.");
        return;
      }
      if (!Array.isArray(imagenes) || imagenes.length === 0) {
        toast.error("La sección debe contar con una imagen.");
        return;
      }

      const formData = new FormData();
      const fileCounterRef = { current: 0 };
      const currentImg = imagenes[0];

      const src = serializeSlideSource(
        currentImg,
        formData,
        fileCounterRef,
        "medicos-residencias.jpg",
      );

      const slideDescriptor = [
        {
          ...src,
          titulo: String(titulo).trim(),
          parrafoDescripcion: String(parrafoDescripcion).trim(),
          textoBoton: String(textoBoton).trim(),
          enlaceUrl: normalizeInternalPortalPath(enlaceUrl),
          altText: String(altText).trim(),
        },
      ];

      formData.append("titulo", String(titulo).trim());
      formData.append("parrafoDescripcion", String(parrafoDescripcion).trim());
      formData.append("textoBoton", String(textoBoton).trim());
      formData.append("enlaceUrl", normalizeInternalPortalPath(enlaceUrl));
      formData.append("altText", String(altText).trim());
      formData.append("slides", JSON.stringify(slideDescriptor));

      await onSaveEspacio(espacio.id, formData);
      return;
    }

    // =========================================================================
    // ENVÍO ESPECÍFICO: APRENDÉ CON EL EVITA (1 PRINCIPAL + 3 TARJETAS FIJAS)
    // =========================================================================
    if (isSeccionAprende) {
      if (imagenes.length !== 4) {
        toast.error(
          "La sección Aprendé con el Evita requiere su bloque general y sus 3 tarjetas fijas.",
        );
        return;
      }

      const mainItem = imagenes[0];
      if (!String(mainItem.subtituloEncabezado || "").trim()) {
        setActiveIndex(0);
        toast.error("Complete el subtítulo superior del encabezado.");
        return;
      }
      if (!String(mainItem.titulo || "").trim()) {
        setActiveIndex(0);
        toast.error("Complete el título principal de la sección.");
        return;
      }
      if (!String(mainItem.parrafoDescripcion || "").trim()) {
        setActiveIndex(0);
        toast.error("Complete el párrafo descriptivo de la sección.");
        return;
      }
      if (!String(mainItem.altText || "").trim()) {
        setActiveIndex(0);
        toast.error(
          "Complete el Texto Alternativo (ALT) de la imagen principal izquierda.",
        );
        return;
      }

      for (let c = 1; c < 4; c++) {
        const card = imagenes[c];
        if (!String(card.etiquetaSuperior || "").trim()) {
          setActiveIndex(c);
          toast.error(
            `Complete la etiqueta superior de la Tarjeta #${c} (ej. TIP DE SALUD).`,
          );
          return;
        }
        if (!String(card.titulo || "").trim()) {
          setActiveIndex(c);
          toast.error(`Complete el título de la Tarjeta #${c}.`);
          return;
        }
        if (!String(card.enlaceUrl || "").trim()) {
          setActiveIndex(c);
          toast.error(
            `Seleccione a qué sección redirige "MÁS INFORMACIÓN" en la Tarjeta #${c}.`,
          );
          return;
        }
        if (!String(card.altText || "").trim()) {
          setActiveIndex(c);
          toast.error(
            `Complete el Texto Alternativo (ALT) de la imagen en la Tarjeta #${c}.`,
          );
          return;
        }
      }

      const formData = new FormData();
      const fileCounterRef = { current: 0 };

      const slidesDescriptor = imagenes.map((img, idx) => {
        const src = serializeSlideSource(
          img,
          formData,
          fileCounterRef,
          `aprende_${idx}.jpg`,
        );

        if (idx === 0) {
          return {
            ...src,
            rolItem: "principal",
            subtituloEncabezado: String(img.subtituloEncabezado || "").trim(),
            titulo: String(img.titulo || "").trim(),
            parrafoDescripcion: String(img.parrafoDescripcion || "").trim(),
            altText: String(img.altText || "").trim(),
          };
        }

        return {
          ...src,
          rolItem: "tarjeta",
          etiquetaSuperior: String(img.etiquetaSuperior || "").trim(),
          titulo: String(img.titulo || "").trim(),
          enlaceUrl: String(img.enlaceUrl || "").trim(),
          altText: String(img.altText || "").trim(),
        };
      });

      formData.append("slides", JSON.stringify(slidesDescriptor));
      await onSaveEspacio(espacio.id, formData);
      return;
    }

    // =========================================================================
    // ENVÍO ESPECÍFICO: INFORMACIÓN PARA PACIENTES (5 DESPLEGABLES FIJOS)
    // =========================================================================
    if (isSeccionPacientes) {
      if (imagenes.length !== 5) {
        toast.error(
          "La sección Información para Pacientes debe contener sus 5 desplegables fijos.",
        );
        return;
      }

      for (let i = 0; i < imagenes.length; i++) {
        const item = imagenes[i];
        if (!String(item.titulo || "").trim()) {
          setActiveIndex(i);
          toast.error(`Complete el título del desplegable #${i + 1}.`);
          return;
        }
        if (!String(item.textoDesplegable || "").trim()) {
          setActiveIndex(i);
          toast.error(
            `Complete el texto informativo del desplegable #${i + 1} ("${item.titulo}").`,
          );
          return;
        }
        if (!String(item.altText || "").trim()) {
          setActiveIndex(i);
          toast.error(
            `Complete el Texto Alternativo (ALT) de la imagen en el desplegable #${i + 1} ("${item.titulo}").`,
          );
          return;
        }
      }

      const formData = new FormData();
      const fileCounterRef = { current: 0 };

      const slidesDescriptor = imagenes.map((img, idx) => ({
        ...serializeSlideSource(
          img,
          formData,
          fileCounterRef,
          `pacientes_${idx + 1}.jpg`,
        ),
        titulo: String(img.titulo || "").trim(),
        textoDesplegable: String(img.textoDesplegable || "").trim(),
        altText: String(img.altText || "").trim(),
      }));

      formData.append("slides", JSON.stringify(slidesDescriptor));
      await onSaveEspacio(espacio.id, formData);
      return;
    }

    // =========================================================================
    // ENVÍO DE CARRUSEL PRINCIPAL / BANNERS
    // =========================================================================
    if (imagenes.length === 0) {
      toast.error("El carrusel debe tener al menos una imagen.");
      return;
    }

    if (!altText.trim()) {
      toast.error(
        "El Texto Alternativo (ALT) es obligatorio para describir la sección.",
      );
      return;
    }

    if (isCarruselInicio && !textoSuperpuesto.trim()) {
      toast.error("El texto superpuesto del carrusel es obligatorio.");
      return;
    }

    if (tieneBoton && !enlaceUrl.trim()) {
      toast.error(
        "Seleccione a qué sección del portal debe redireccionar el botón.",
      );
      return;
    }

    const formData = new FormData();
    formData.append("altText", altText.trim());
    formData.append("textoSuperpuesto", textoSuperpuesto.trim());
    formData.append("textoBoton", tieneBoton ? textoBoton.trim() : "");
    formData.append("enlaceUrl", tieneBoton ? enlaceUrl.trim() : "");

    const fileCounterRef = { current: 0 };
    const slidesDescriptor = imagenes.map((img, idx) =>
      serializeSlideSource(
        img,
        formData,
        fileCounterRef,
        `carrusel_${idx + 1}.jpg`,
      ),
    );

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

        {/* INPUT OCULTO COMPARTIDO PARA CARGA Y RECORTE */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleSelectNewImage}
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
        />

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div className="esp-modal-body">
            <div className="esp-form-grid">
              {isRejected && espacio.rejectionReason && (
                <div className="esp-full-width">
                  <div className="cg-simple-rejection-box" role="alert">
                    <strong>Motivo del rechazo:</strong>{" "}
                    {espacio.rejectionReason}
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
                    {isSeccionPacientes
                      ? "(Imagen 4:3 de 1200x900px aprox. • Haga clic en cualquier desplegable para verlo y editarlo)"
                      : isSeccionAprende
                        ? "(Haga clic en el bloque general o en cualquiera de las 3 tarjetas para editarlo)"
                        : isTarjetaResidencias
                          ? "(Tarjeta destacada con imagen de 1350x1180px aprox. • Haga clic en la imagen para cambiarla o recortarla)"
                          : `(Medida recomendada: ${dimensionesRequeridas} aprox.)`}
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
                ) : isSeccionPacientes ? (
                  <PortalPatientInfoPreview
                    items={imagenes}
                    activeIndex={safeIndex}
                    onSelectItem={setActiveIndex}
                  />
                ) : isSeccionAprende ? (
                  <PortalAprendePreview
                    items={imagenes}
                    activeIndex={safeIndex}
                    onSelectItem={setActiveIndex}
                  />
                ) : isTarjetaResidencias ? (
                  <PortalResidenciasHeroPreview
                    titulo={titulo}
                    parrafoDescripcion={parrafoDescripcion}
                    textoBoton={textoBoton}
                    enlaceUrl={enlaceUrl}
                    imagen={activeImage}
                    altText={altText}
                    onSelectImage={() => triggerFilePicker("replace")}
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
                        No hay imágenes cargadas en este espacio (
                        {dimensionesRequeridas})
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ===============================================================
                  CAMPOS ESPECÍFICOS: RESIDENCIAS (TARJETA DESTACADA)
                  =============================================================== */}
              {isTarjetaResidencias ? (
                <div className="esp-full-width cg-pacientes-editor-card">
                  <div className="cg-pacientes-editor-header">
                    <span className="cg-pacientes-editor-badge">
                      Editando Tarjeta Informativa de Residencias
                    </span>
                    <span className="cg-pacientes-editor-hint">
                      Se actualiza en vivo en la previsualización superior
                    </span>
                  </div>

                  <div className="esp-form-grid" style={{ gap: "16px" }}>
                    <div className="esp-full-width">
                      <label className="esp-form-label" htmlFor="cg-res-titulo">
                        Título de la Sección <span className="esp-asterisk">*</span>
                      </label>
                      <input
                        id="cg-res-titulo"
                        type="text"
                        className="esp-form-input"
                        placeholder="Ej. Excelencia en Alta Complejidad & Vocación Pública"
                        value={titulo}
                        onChange={(e) => {
                          setTitulo(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        disabled={isSaving}
                        required
                      />
                    </div>

                    <div className="esp-full-width">
                      <label className="esp-form-label" htmlFor="cg-res-parrafo">
                        Párrafo Descriptivo <span className="esp-asterisk">*</span>
                      </label>
                      <textarea
                        id="cg-res-parrafo"
                        className="esp-form-input"
                        rows={3}
                        placeholder="Descripción y convocatoria de la sección..."
                        value={parrafoDescripcion}
                        onChange={(e) => {
                          setParrafoDescripcion(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        disabled={isSaving}
                        required
                        style={{ resize: "vertical", lineHeight: "1.45" }}
                      />
                    </div>

                    <div>
                      <label className="esp-form-label" htmlFor="cg-res-boton">
                        Texto del Botón <span className="esp-asterisk">*</span>
                      </label>
                      <input
                        id="cg-res-boton"
                        type="text"
                        className="esp-form-input"
                        placeholder="Ej. Ver Especialidades Disponibles"
                        value={textoBoton}
                        onChange={(e) => {
                          setTextoBoton(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        disabled={isSaving}
                        required
                      />
                    </div>

                    <div>
                      <label className="esp-form-label" htmlFor="cg-res-enlace">
                        Redirección del Botón (Sección del Portal){" "}
                        <span className="esp-asterisk">*</span>
                      </label>
                      <select
                        id="cg-res-enlace"
                        className="esp-form-input"
                        value={enlaceUrl}
                        onChange={(e) => {
                          setEnlaceUrl(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        disabled={isSaving}
                        required
                      >
                        <option value="">-- Seleccionar sección del portal --</option>
                        {PORTAL_INTERNAL_ROUTES.map((route) => (
                          <option key={route.value} value={route.value}>
                            {route.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="esp-full-width cg-pacientes-img-row">
                      <div className="cg-pacientes-img-current">
                        {resolveGraphicImageUrl(activeImage) && (
                          <img
                            src={resolveGraphicImageUrl(activeImage)}
                            alt={altText || "Imagen de residencias"}
                            className="cg-pacientes-img-current-thumb"
                            style={{ aspectRatio: "1.15 / 1" }}
                          />
                        )}
                        <div className="cg-pacientes-img-meta">
                          <span className="cg-pacientes-img-meta-title">
                            Imagen de la Tarjeta (1350x1180px aprox.)
                          </span>
                          <span className="cg-pacientes-img-meta-file">
                            {activeImage?.fileName || "medicos-residencias.jpg"}
                            {activeImage?.isNewUpload && (
                              <strong style={{ color: "#0284c7" }}>
                                {" "}• Lista para guardar
                              </strong>
                            )}
                          </span>
                          <button
                            type="button"
                            className="cg-prof-style-btn"
                            disabled={isSaving}
                            onClick={() => triggerFilePicker("replace")}
                            style={{
                              marginTop: "6px",
                              width: "fit-content",
                            }}
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
                            <span>Cambiar imagen / Recortar...</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="esp-full-width">
                      <label className="esp-form-label" htmlFor="cg-res-alt">
                        Texto Alternativo de la Imagen (ALT){" "}
                        <span className="esp-asterisk">*</span>
                      </label>
                      <input
                        id="cg-res-alt"
                        type="text"
                        className="esp-form-input"
                        placeholder="Descripción de la imagen para personas con discapacidad visual..."
                        value={altText}
                        onChange={(e) => {
                          setAltText(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        disabled={isSaving}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : isSeccionAprende ? (
                <>
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Componentes de la Sección{" "}
                      <span
                        style={{
                          textTransform: "none",
                          color: "#94a3b8",
                          fontWeight: "normal",
                        }}
                      >
                        (Seleccione el bloque general o una de las 3 tarjetas
                        fijas)
                      </span>
                    </label>

                    <div className="cg-aprende-tabs-grid" role="tablist">
                      {imagenes.map((item, idx) => {
                        const isSelected = idx === safeIndex;
                        const thumbUrl = resolveGraphicImageUrl(item);
                        const isMain = idx === 0;
                        const isIncomplete = isMain
                          ? !String(item.subtituloEncabezado || "").trim() ||
                            !String(item.titulo || "").trim() ||
                            !String(item.parrafoDescripcion || "").trim() ||
                            !String(item.altText || "").trim()
                          : !String(item.etiquetaSuperior || "").trim() ||
                            !String(item.titulo || "").trim() ||
                            !String(item.enlaceUrl || "").trim() ||
                            !String(item.altText || "").trim();

                        return (
                          <button
                            key={item.id || idx}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            className={`cg-pacientes-tab-card ${
                              isSelected ? "selected" : ""
                            } ${isIncomplete ? "incomplete" : ""}`}
                            onClick={() => setActiveIndex(idx)}
                          >
                            <div
                              className="cg-pacientes-tab-thumb-wrap"
                              style={{
                                aspectRatio: isMain ? "4 / 3" : "1 / 1",
                              }}
                            >
                              {thumbUrl && (
                                <img
                                  src={thumbUrl}
                                  alt=""
                                  className="cg-pacientes-tab-thumb"
                                />
                              )}
                              <span className="cg-pacientes-tab-num">
                                {isMain ? "Principal" : `Tarjeta #${idx}`}
                              </span>
                            </div>
                            <span className="cg-pacientes-tab-label">
                              {isMain
                                ? "Encabezado, Párrafo e Imagen Izq."
                                : item.titulo && item.titulo.trim()
                                  ? item.titulo
                                  : `Tarjeta #${idx}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeImage && safeIndex === 0 && (
                    <div className="esp-full-width cg-pacientes-editor-card">
                      <div className="cg-pacientes-editor-header">
                        <span className="cg-pacientes-editor-badge">
                          Editando Bloque General e Imagen Izquierda
                        </span>
                        <span className="cg-pacientes-editor-hint">
                          Se actualiza en vivo en la previsualización superior
                        </span>
                      </div>

                      <div className="esp-form-grid" style={{ gap: "16px" }}>
                        <div>
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-subtitulo"
                          >
                            Subtítulo Superior{" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-aprende-subtitulo"
                            type="text"
                            className="esp-form-input"
                            placeholder="Ej. EDUCACIÓN PARA LA SALUD"
                            value={activeImage.subtituloEncabezado || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "subtituloEncabezado",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>

                        <div>
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-titulo"
                          >
                            Título Principal{" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-aprende-titulo"
                            type="text"
                            className="esp-form-input"
                            placeholder="Ej. APRENDÉ CON EL EVITA"
                            value={activeImage.titulo || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "titulo",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>

                        <div className="esp-full-width">
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-parrafo"
                          >
                            Párrafo Descriptivo{" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <textarea
                            id="cg-aprende-parrafo"
                            className="esp-form-input"
                            rows={3}
                            placeholder="Descripción introductoria del bloque Aprendé con el Evita..."
                            value={activeImage.parrafoDescripcion || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "parrafoDescripcion",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                            style={{ resize: "vertical", lineHeight: "1.45" }}
                          />
                        </div>

                        <div className="esp-full-width cg-pacientes-img-row">
                          <div className="cg-pacientes-img-current">
                            {resolveGraphicImageUrl(activeImage) && (
                              <img
                                src={resolveGraphicImageUrl(activeImage)}
                                alt={
                                  activeImage.altText ||
                                  "Imagen principal izquierda"
                                }
                                className="cg-pacientes-img-current-thumb"
                              />
                            )}
                            <div className="cg-pacientes-img-meta">
                              <span className="cg-pacientes-img-meta-title">
                                Imagen Principal Izquierda (1260x960px aprox.)
                              </span>
                              <span className="cg-pacientes-img-meta-file">
                                {activeImage.fileName || "aprendeMain.jpg"}
                                {activeImage.isNewUpload && (
                                  <strong style={{ color: "#0284c7" }}>
                                    {" "}
                                    • Lista para guardar
                                  </strong>
                                )}
                              </span>
                              <button
                                type="button"
                                className="cg-prof-style-btn"
                                disabled={isSaving}
                                onClick={() => triggerFilePicker("replace")}
                                style={{
                                  marginTop: "6px",
                                  width: "fit-content",
                                }}
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
                                <span>Cambiar imagen...</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="esp-full-width">
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-main-alt"
                          >
                            Texto Alternativo de la Imagen Principal (ALT){" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-aprende-main-alt"
                            type="text"
                            className="esp-form-input"
                            placeholder="Descripción de la imagen grande izquierda para lectores de pantalla..."
                            value={activeImage.altText || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "altText",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeImage && safeIndex > 0 && (
                    <div className="esp-full-width cg-pacientes-editor-card">
                      <div className="cg-pacientes-editor-header">
                        <span className="cg-pacientes-editor-badge">
                          Editando Tarjeta #{safeIndex} de 3
                        </span>
                        <span className="cg-pacientes-editor-hint">
                          Incluye etiqueta superior, título, redirección e
                          imagen cuadrada
                        </span>
                      </div>

                      <div className="esp-form-grid" style={{ gap: "16px" }}>
                        <div>
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-card-badge"
                          >
                            Etiqueta Superior{" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-aprende-card-badge"
                            type="text"
                            className="esp-form-input"
                            placeholder="Ej. TIP DE SALUD / GUÍA PRÁCTICA / FORMACIÓN"
                            value={activeImage.etiquetaSuperior || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "etiquetaSuperior",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>

                        <div>
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-card-titulo"
                          >
                            Título de la Tarjeta{" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-aprende-card-titulo"
                            type="text"
                            className="esp-form-input"
                            placeholder="Ej. Prevención del Dengue"
                            value={activeImage.titulo || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "titulo",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>

                        <div className="esp-full-width">
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-card-redirect"
                          >
                            Redirección de "MÁS INFORMACIÓN →"{" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <select
                            id="cg-aprende-card-redirect"
                            className="esp-form-input"
                            value={activeImage.enlaceUrl || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "enlaceUrl",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          >
                            <option value="">
                              -- Seleccione a qué sección del portal redirige --
                            </option>
                            {PORTAL_INTERNAL_ROUTES.map((route) => (
                              <option key={route.value} value={route.value}>
                                {route.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="esp-full-width cg-pacientes-img-row">
                          <div className="cg-pacientes-img-current">
                            {resolveGraphicImageUrl(activeImage) && (
                              <img
                                src={resolveGraphicImageUrl(activeImage)}
                                alt={
                                  activeImage.altText ||
                                  `Imagen de la tarjeta #${safeIndex}`
                                }
                                className="cg-pacientes-img-current-thumb"
                                style={{ width: "96px", aspectRatio: "1 / 1" }}
                              />
                            )}
                            <div className="cg-pacientes-img-meta">
                              <span className="cg-pacientes-img-meta-title">
                                Imagen Cuadrada de la Tarjeta #{safeIndex}{" "}
                                (600x600px aprox.)
                              </span>
                              <span className="cg-pacientes-img-meta-file">
                                {activeImage.fileName ||
                                  `tarjeta_${safeIndex}.jpg`}
                                {activeImage.isNewUpload && (
                                  <strong style={{ color: "#0284c7" }}>
                                    {" "}
                                    • Lista para guardar
                                  </strong>
                                )}
                              </span>
                              <button
                                type="button"
                                className="cg-prof-style-btn"
                                disabled={isSaving}
                                onClick={() => triggerFilePicker("replace")}
                                style={{
                                  marginTop: "6px",
                                  width: "fit-content",
                                }}
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
                                <span>Cambiar imagen...</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="esp-full-width">
                          <label
                            className="esp-form-label"
                            htmlFor="cg-aprende-card-alt"
                          >
                            Texto Alternativo de esta Imagen (ALT){" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-aprende-card-alt"
                            type="text"
                            className="esp-form-input"
                            placeholder="Descripción de la imagen de esta tarjeta para lectores de pantalla..."
                            value={activeImage.altText || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "altText",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : isSeccionPacientes ? (
                /* ===============================================================
                   CAMPOS ESPECÍFICOS: INFORMACIÓN PARA PACIENTES (5 DESPLEGABLES)
                   =============================================================== */
                <>
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Desplegables de la Sección{" "}
                      <span
                        style={{
                          textTransform: "none",
                          color: "#94a3b8",
                          fontWeight: "normal",
                        }}
                      >
                        (5 ítems fijos • seleccione uno para editar su título,
                        texto e imagen)
                      </span>
                    </label>

                    <div className="cg-pacientes-tabs-grid" role="tablist">
                      {imagenes.map((item, idx) => {
                        const isSelected = idx === safeIndex;
                        const thumbUrl = resolveGraphicImageUrl(item);
                        const isIncomplete =
                          !String(item.titulo || "").trim() ||
                          !String(item.textoDesplegable || "").trim() ||
                          !String(item.altText || "").trim();

                        return (
                          <button
                            key={item.id || idx}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            className={`cg-pacientes-tab-card ${
                              isSelected ? "selected" : ""
                            } ${isIncomplete ? "incomplete" : ""}`}
                            onClick={() => setActiveIndex(idx)}
                          >
                            <div className="cg-pacientes-tab-thumb-wrap">
                              {thumbUrl && (
                                <img
                                  src={thumbUrl}
                                  alt=""
                                  className="cg-pacientes-tab-thumb"
                                />
                              )}
                              <span className="cg-pacientes-tab-num">
                                #{idx + 1}
                              </span>
                            </div>
                            <span className="cg-pacientes-tab-label">
                              {item.titulo && item.titulo.trim()
                                ? item.titulo
                                : `Desplegable #${idx + 1}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeImage && (
                    <div className="esp-full-width cg-pacientes-editor-card">
                      <div className="cg-pacientes-editor-header">
                        <span className="cg-pacientes-editor-badge">
                          Editando Desplegable #{safeIndex + 1} de 5
                        </span>
                        <span className="cg-pacientes-editor-hint">
                          Los cambios se reflejan en vivo en la previsualización
                          superior
                        </span>
                      </div>

                      <div className="cg-pacientes-editor-fields">
                        <div>
                          <label
                            className="esp-form-label"
                            htmlFor="cg-pac-item-titulo"
                          >
                            Título del Desplegable{" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-pac-item-titulo"
                            type="text"
                            className="esp-form-input"
                            placeholder="Ej. HORARIOS DE ATENCIÓN"
                            value={activeImage.titulo || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "titulo",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>

                        <div>
                          <label
                            className="esp-form-label"
                            htmlFor="cg-pac-item-desc"
                          >
                            Texto Desplegable (Contenido Informativo){" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <textarea
                            id="cg-pac-item-desc"
                            className="esp-form-input"
                            rows={3}
                            placeholder="Información que verá el paciente al desplegar este ítem..."
                            value={activeImage.textoDesplegable || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "textoDesplegable",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                            style={{ resize: "vertical", lineHeight: "1.45" }}
                          />
                        </div>

                        <div className="cg-pacientes-img-row">
                          <div className="cg-pacientes-img-current">
                            {resolveGraphicImageUrl(activeImage) && (
                              <img
                                src={resolveGraphicImageUrl(activeImage)}
                                alt={
                                  activeImage.altText ||
                                  `Imagen del desplegable #${safeIndex + 1}`
                                }
                                className="cg-pacientes-img-current-thumb"
                              />
                            )}
                            <div className="cg-pacientes-img-meta">
                              <span className="cg-pacientes-img-meta-title">
                                Imagen asociada al desplegable #{safeIndex + 1}
                              </span>
                              <span className="cg-pacientes-img-meta-file">
                                {activeImage.fileName ||
                                  `imagen_desplegable_${safeIndex + 1}.jpg`}{" "}
                                {activeImage.isNewUpload && (
                                  <strong style={{ color: "#0284c7" }}>
                                    • Lista para guardar
                                  </strong>
                                )}
                              </span>
                              <button
                                type="button"
                                className="cg-prof-style-btn"
                                disabled={isSaving}
                                onClick={() => triggerFilePicker("replace")}
                                style={{
                                  marginTop: "6px",
                                  width: "fit-content",
                                }}
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
                                <span>Cambiar imagen...</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label
                            className="esp-form-label"
                            htmlFor="cg-pac-item-alt"
                          >
                            Texto Alternativo de esta Imagen (ALT){" "}
                            <span className="esp-asterisk">*</span>
                          </label>
                          <input
                            id="cg-pac-item-alt"
                            type="text"
                            className="esp-form-input"
                            placeholder="Descripción de esta imagen para lectores de pantalla (personas ciegas)..."
                            value={activeImage.altText || ""}
                            onChange={(e) =>
                              handleUpdateActiveItemField(
                                "altText",
                                e.target.value,
                              )
                            }
                            disabled={isSaving}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* ===============================================================
                      CAMPOS DE CARRUSEL PRINCIPAL / BANNERS
                      =============================================================== */}
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

                  {isCarruselInicio && (
                    <div className="esp-full-width">
                      <label
                        className="esp-form-label"
                        htmlFor="cg-input-overlay-text"
                      >
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
                          (Presione Enter para dividir en renglones como en la
                          portada)
                        </span>
                      </label>
                      <textarea
                        id="cg-input-overlay-text"
                        className="esp-form-input"
                        rows={3}
                        placeholder={
                          "Ej.\n6 AÑOS DE\nVOCACIÓN Y\nCOMPETENCIA\nPROFESIONAL"
                        }
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

                  {isCarruselInicio && (
                    <>
                      <div>
                        <label
                          className="esp-form-label"
                          htmlFor="cg-input-btn-text"
                        >
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
                        <label
                          className="esp-form-label"
                          htmlFor="cg-select-redirect"
                        >
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
                          <option value="">
                            -- Seleccione una sección del portal --
                          </option>
                          {PORTAL_INTERNAL_ROUTES.map((route) => (
                            <option key={route.value} value={route.value}>
                              {route.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

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
                        {imagenes.length === 1 ? "imagen" : "imágenes"} • puede
                        arrastrar para cambiar el orden)
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

                      <div className="cg-carousel-under-actions">
                        <button
                          type="button"
                          className="cg-prof-style-btn"
                          disabled={isSaving}
                          onClick={() => triggerFilePicker("add")}
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
                          disabled={
                            !activeImage || imagenes.length <= 1 || isSaving
                          }
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
                </>
              )}
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
              disabled={isSaving || !hasUnsavedChanges}
              title={!hasUnsavedChanges ? "No se han detectado cambios para actualizar" : ""}
            >
              {isSaving ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
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
            {isSeccionAprende
              ? safeIndex === 0
                ? "Recortar Imagen Principal Izquierda"
                : `Recortar Imagen Cuadrada para Tarjeta #${safeIndex}`
              : isSeccionPacientes
                ? `Recortar imagen para "${
                    activeImage?.titulo || `Desplegable #${safeIndex + 1}`
                  }"`
                : "Recortar imagen al tamaño del bloque"}
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
            Ajuste el encuadre a la proporción exacta en la que se verá en el
            portal ({dimensionesRequeridas} aprox.)
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
              onClick={handleConfirmCrop}
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
              {cropMode === "replace" || isSeccionPacientes || isSeccionAprende
                ? "Recortar y Reemplazar"
                : "Recortar y Agregar"}
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
