import React from "react";
import CmsContenidoGraficoView from "./CmsContenidoGraficoView";

/**
 * CmsBannersView (Componente heredado / alias)
 * Redirige al nuevo módulo estandarizado de "Gestión de Contenido Gráfico"
 * que cumple con las especificaciones editoriales y de accesibilidad WCAG 2.2 AA.
 */
const CmsBannersView = (props) => {
  return <CmsContenidoGraficoView {...props} />;
};

export default CmsBannersView;