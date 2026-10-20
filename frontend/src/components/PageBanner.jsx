import React from "react";
import Breadcrumb from "./Breadcrumb";
import defaultBannerImg from "../assets/banner_especialidades.png";
import "../styles/ui/PageBanner.css";

const DEFAULT_GRADIENT =
  "linear-gradient(rgba(46, 111, 196, 0.85), rgba(233, 235, 238, 0.85))";

/**
 * Componente PageBanner unificado para páginas públicas.
 * Garantiza consistencia en medidas, márgenes, padding, alineación y tipografía.
 *
 * @param {string} title - Título principal de la sección
 * @param {string} [subtitle] - Subtítulo descriptivo
 * @param {string} [currentPage] - Nombre de la página para el Breadcrumb (si se omite usa title)
 * @param {string} [parentLabel] - Etiqueta del nivel padre en el Breadcrumb (ej: "NOTICIAS")
 * @param {string} [parentPath] - Ruta del nivel padre (ej: "/noticias")
 * @param {string} [image] - Imagen de fondo con marca de agua (por defecto banner institucional)
 * @param {string} [gradient] - Degradado superpuesto sobre la imagen
 * @param {number|string} [marginBottom] - Margen inferior personalizado si la página lo requiere
 * @param {string} [className] - Clases adicionales opcionales
 * @param {React.ReactNode} [children] - Elementos adicionales dentro del banner (ej: botones de retorno)
 */
const PageBanner = ({
  title,
  subtitle,
  currentPage,
  parentLabel,
  parentPath,
  image = defaultBannerImg,
  gradient = DEFAULT_GRADIENT,
  marginBottom,
  className = "",
  children,
}) => {
  const containerStyle = {
    backgroundImage: image ? `${gradient}, url(${image})` : gradient,
    ...(marginBottom !== undefined ? { marginBottom } : {}),
  };

  return (
    <div className={`public-page-banner ${className}`} style={containerStyle}>
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
