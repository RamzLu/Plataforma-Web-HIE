import React from "react";
import Breadcrumb from "./Breadcrumb";
import logoEstrellas from "../assets/logoHospitalEvita.png";
import "../styles/ui/PageBanner.css";

/**
 * Componente PageBanner unificado para páginas públicas.
 * Integra la estética de la imagen de referencia:
 * - Esquinas redondeadas superiores e integración perfecta bajo el Navbar
 * - Barra vertical izquierda azul (#2b5b94)
 * - Título con font-weight: 300 y subtítulo descriptivo alineados
 * - Breadcrumb exacto (INICIO / [SECCIÓN])
 * - Marca de agua decorativa a la derecha con estrellas del Hospital Evita
 *   desvanecida suavemente con mask-image perimetral (cero cortes).
 *
 * @param {string} title - Título principal de la sección
 * @param {string} [subtitle] - Subtítulo descriptivo
 * @param {string} [currentPage] - Nombre de la página para el Breadcrumb (si se omite usa title)
 * @param {string} [parentLabel] - Etiqueta del nivel padre en el Breadcrumb (ej: "NOTICIAS")
 * @param {string} [parentPath] - Ruta del nivel padre (ej: "/noticias")
 * @param {string} [image] - Imagen opcional
 * @param {string} [gradient] - Degradado personalizado opcional
 * @param {number|string} [marginBottom] - Margen inferior personalizado si la página lo requiere
 * @param {string} [className] - Clases adicionales opcionales
 * @param {React.ReactNode} [children] - Elementos adicionales dentro del banner
 */
const PageBanner = ({
  title,
  subtitle,
  currentPage,
  parentLabel,
  parentPath,
  image,
  gradient,
  marginBottom,
  className = "",
  children,
}) => {
  const containerStyle = {
    ...(marginBottom !== undefined ? { marginBottom } : {}),
  };

  return (
    <div className={`public-page-banner ${className}`} style={containerStyle}>
      {/* Marca de agua estética con estrellas a la derecha (cero cortes, máscara radial suave) */}
      <div className="public-page-banner-watermark-wrap" aria-hidden="true">
        <img
          src={logoEstrellas}
          alt=""
          className="public-page-banner-watermark-img"
          draggable="false"
        />
      </div>

      <div className="public-page-banner-inner">
        <Breadcrumb
          currentPage={currentPage || title}
          parentLabel={parentLabel}
          parentPath={parentPath}
        />
        <h1 className="public-page-banner-title">{title}</h1>
        {subtitle && (
          <p className="public-page-banner-subtitle">{subtitle}</p>
        )}
        {children && (
          <div className="public-page-banner-extra">{children}</div>
        )}
      </div>
    </div>
  );
};

export default PageBanner;
