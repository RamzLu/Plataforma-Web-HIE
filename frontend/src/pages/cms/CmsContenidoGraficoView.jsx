import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak.js";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import "../../styles/pages/cms/CmsContenidoGraficoView.css";
import {
  getContenidosGraficos,
  updateContenidoGrafico,
} from "../../api/contenidoGrafico.api.js";
import {
  CmsContenidoGraficoEditModal,
  PortalAprendePreview,
  PortalCarouselPreview,
  PortalPatientInfoPreview,
} from "../../components/cms/CmsContenidoGraficoCorrectionModal";
import {
  DEFAULT_APRENDE_INICIO,
  DEFAULT_CARRUSEL_INICIO,
  DEFAULT_PACIENTES_INICIO,
  getPortalRouteLabel,
  resolveGraphicImageUrl,
} from "../../utils/contenidoGraficoPresets.js";

const CmsContenidoGraficoView = () => {
  const [espacios, setEspacios] = useState([
    DEFAULT_CARRUSEL_INICIO,
    DEFAULT_PACIENTES_INICIO,
    DEFAULT_APRENDE_INICIO,
  ]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [filtroPagina, setFiltroPagina] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedEspacio, setSelectedEspacio] = useState(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  const cargarEspacios = async () => {
    setLoading(true);
    try {
      // Limpiamos mocks heredados de localStorage para reflejar siempre la verdad del servidor
      localStorage.removeItem("hie_espacios_graficos_fijos");
      localStorage.removeItem("hie_carousel_text");
      localStorage.removeItem("hie_carousel_btn");

      const data = await getContenidosGraficos();
      if (Array.isArray(data) && data.length > 0) {
        setEspacios(data);
      }
    } catch (error) {
      console.error("Error al cargar espacios gráficos:", error);
      toast.error("No se pudieron cargar los espacios gráficos desde el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEspacios();
  }, []);

  const paginasDisponibles = useMemo(() => {
    const setPaginas = new Set(
      espacios.map((item) => item.page).filter(Boolean)
    );
    return Array.from(setPaginas);
  }, [espacios]);

  const espaciosFiltrados = useMemo(() => {
    return espacios.filter((item) => {
      if (filtroPagina && filtroPagina !== "" && filtroPagina !== "Todas las páginas") {
        if (item.page?.toLowerCase() !== filtroPagina.toLowerCase()) return false;
      }
      return true;
    });
  }, [espacios, filtroPagina]);

  const totalPages = Math.max(1, Math.ceil(espaciosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, espaciosFiltrados.length);
  const currentEspacios = espaciosFiltrados.slice(startIndex, endIndex);

  const handleOpenModify = (espacio) => {
    setSelectedEspacio(espacio);
    setShowEditModal(true);
  };

  const handleOpenPreview = (espacio) => {
    setSelectedEspacio(espacio);
    setPreviewSlideIndex(0);
    setShowPreviewModal(true);
  };

  const handleSaveEspacioModified = async (espacioKey, formData) => {
    setIsSaving(true);
    const toastId = toast.loading("Actualizando contenido gráfico...");

    try {
      const response = await updateContenidoGrafico(espacioKey, formData);
      const espacioActualizado = response?.espacio;

      if (espacioActualizado) {
        setEspacios((prev) =>
          prev.map((item) =>
            item.id === espacioActualizado.id ? espacioActualizado : item
          )
        );

        if (espacioActualizado.id === "espacio-banner-inicio") {
          try {
            sessionStorage.setItem(
              "hie_public_carrusel_inicio_cache",
              JSON.stringify(espacioActualizado)
            );
          } catch {
            // Ignorar si sessionStorage no está disponible
          }
        } else if (espacioActualizado.id === "espacio-seccion-pacientes") {
          try {
            sessionStorage.setItem(
              "hie_public_pacientes_inicio_cache",
              JSON.stringify(espacioActualizado)
            );
          } catch {
            // Ignorar si sessionStorage no está disponible
          }
        } else if (espacioActualizado.id === "espacio-aprende-inicio") {
          try {
            sessionStorage.setItem(
              "hie_public_aprende_inicio_cache",
              JSON.stringify(espacioActualizado)
            );
          } catch {
            // Ignorar si sessionStorage no está disponible
          }
        }

        recordCmsActivity({
          titulo: `Actualizó "${espacioActualizado.nombre}"`,
          categoria: "Contenido Gráfico",
          editor:
            keycloak?.tokenParsed?.name ||
            keycloak?.tokenParsed?.preferred_username ||
            "Editor CMS",
          estado: espacioActualizado.estado || "PUBLICADO",
        });
      } else {
        await cargarEspacios();
      }

      toast.success(
        response?.message || "Espacio gráfico actualizado correctamente.",
        { id: toastId }
      );
      setShowEditModal(false);
      setSelectedEspacio(null);
    } catch (error) {
      const apiErr = error?.response?.data?.error;
      const msg =
        (typeof apiErr === "string" ? apiErr : apiErr?.message) ||
        error?.response?.data?.message ||
        "No se pudo guardar el espacio gráfico.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const previewImages = selectedEspacio?.imagenes || [];
  const activePreviewImg =
    previewImages[
      Math.min(previewSlideIndex, Math.max(0, previewImages.length - 1))
    ] || null;
  const activePreviewUrl = resolveGraphicImageUrl(activePreviewImg);

  return (
    <div className="cms-dashboard-card cg-main-card">
      {/* Encabezado Interno: Modelo de Edición de Espacios Fijos */}
      <div className="cg-inner-header">
        <div>
          <h2 className="cg-title">Espacios Gráficos del Portal</h2>
          <p className="cg-subtitle">
            Seleccione una sección predefinida del portal y haga clic en{" "}
            <strong>Modificar</strong> para editar sus imágenes y textos asociados.
          </p>
        </div>
        <div className="cg-fixed-model-badge">
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            dashboard_customize
          </span>
          <span>{espacios.length} Espacios Fijos Predefinidos</span>
        </div>
      </div>

      {/* Fila de Controles: Filtro por Página */}
      <div className="cg-controls-row" style={{ justifyContent: "flex-end" }}>
        <div className="cg-filter-dropdown-wrapper">
          <div className="cg-filter-dropdown-box">
            <span className="cg-filter-prefix">FILTRAR POR PÁGINA:</span>
            <select
              className="cg-filter-select"
              value={filtroPagina}
              onChange={(e) => {
                setFiltroPagina(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todas las páginas</option>
              {paginasDisponibles.map((pag) => (
                <option key={pag} value={pag}>
                  {pag}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined cg-filter-chevron">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Espacios Fijos */}
      <div className="cg-table-wrapper">
        <table className="cg-table">
          <thead>
            <tr className="cg-table-head-row">
              <th className="cg-th-orden" scope="col">
                #
              </th>
              <th className="cg-th-recurso" scope="col">
                SECCIÓN FIJA DEL PORTAL
              </th>
              <th className="cg-th-ubicacion" scope="col">
                PÁGINA Y TIPO DE BLOQUE
              </th>
              <th className="cg-th-estado" scope="col">
                ESTADO
              </th>
              <th className="cg-th-acciones" scope="col">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody className="cg-table-body">
            {loading ? (
              <tr>
                <td colSpan={5} className="cg-empty-cell">
                  <div className="cg-empty-content">
                    <div
                      className="cms-spinner"
                      style={{ margin: "0 auto 8px auto" }}
                    />
                    <p className="cg-empty-desc">
                      Cargando espacios gráficos del portal...
                    </p>
                  </div>
                </td>
              </tr>
            ) : currentEspacios.length === 0 ? (
              <tr>
                <td colSpan={5} className="cg-empty-cell">
                  <div className="cg-empty-content">
                    <span className="material-symbols-outlined cg-empty-icon">
                      photo_library
                    </span>
                    <p className="cg-empty-title">
                      No hay espacios fijos que coincidan con la página seleccionada
                    </p>
                    <p className="cg-empty-desc">
                      Seleccione "Todas las páginas" para listar todas las secciones.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentEspacios.map((item, index) => {
                const est = (item.estado || "PUBLICADO").toUpperCase();
                const isApproved = est === "APROBADO" || est === "PUBLICADO";
                const isRejected = est === "RECHAZADO";
                const isPending =
                  est === "PENDIENTE_APROBACION" || est === "PENDIENTE";
                const isDraft = est === "BORRADOR";

                const imgs = Array.isArray(item.imagenes) ? item.imagenes : [];
                const coverImg = resolveGraphicImageUrl(imgs[0]);

                return (
                  <tr key={item.id} className="cg-table-row">
                    <td className="cg-td-orden">
                      {item.orden || startIndex + index + 1}
                    </td>

                    <td className="cg-td-recurso">
                      <div className="cg-recurso-box">
                        <div
                          className="cg-thumb-container"
                          onClick={() => handleOpenPreview(item)}
                          title="Clic para previsualizar cómo se ve en el portal"
                        >
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={item.altText || item.nombre}
                              className="cg-thumb-img"
                            />
                          ) : (
                            <div className="cg-thumb-empty">
                              <span className="material-symbols-outlined">
                                broken_image
                              </span>
                            </div>
                          )}
                          <span className="cg-thumb-count-badge">
                            {imgs.length} {imgs.length === 1 ? "img" : "imgs"}
                          </span>
                        </div>

                        <div className="cg-info-col">
                          <div className="cg-info-title-line">
                            <span
                              className="cg-info-title"
                              title={item.nombre}
                              onClick={() => handleOpenModify(item)}
                            >
                              {item.nombre}
                            </span>
                            <span className="cg-info-dim-pill">
                              {item.dimensiones || "1920x820px"}
                            </span>
                          </div>
                          <span className="cg-info-desc" title={item.descripcion}>
                            {item.descripcion}
                          </span>
                          {isRejected && item.rejectionReason && (
                            <div
                              className="cg-rejection-warning-pill"
                              onClick={() => handleOpenModify(item)}
                              title="Hacer clic para ver motivo de rechazo y corregir"
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "13px" }}
                              >
                                report
                              </span>
                              <span className="cg-rejection-warning-text">
                                {item.rejectionReason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="cg-td-ubicacion">
                      <div className="cg-location-stack">
                        <span className="cg-location-page">{item.page}</span>
                        <span className="cg-location-type">
                          {item.tipo || item.ubicacion}
                        </span>
                      </div>
                    </td>

                    <td className="cg-td-estado">
                      {isApproved && (
                        <span className="cg-status-badge status-aprobado">
                          <span className="cg-status-dot dot-aprobado"></span>
                          PUBLICADO
                        </span>
                      )}
                      {isRejected && (
                        <button
                          type="button"
                          className="cg-status-badge status-rechazado clickable"
                          onClick={() => handleOpenModify(item)}
                          title="Hacer clic para corregir el espacio observado"
                        >
                          <span className="cg-status-dot dot-rechazado"></span>
                          RECHAZADO
                        </button>
                      )}
                      {isPending && (
                        <span className="cg-status-badge status-pendiente">
                          <span className="cg-status-dot dot-pendiente"></span>
                          PENDIENTE
                        </span>
                      )}
                      {isDraft && (
                        <span className="cg-status-badge status-borrador">
                          <span className="cg-status-dot dot-borrador"></span>
                          BORRADOR
                        </span>
                      )}
                    </td>

                    <td className="cg-td-acciones">
                      <div className="cg-actions-group">
                        <button
                          type="button"
                          className="cg-action-btn"
                          title="Previsualizar cómo se ve en el portal"
                          onClick={() => handleOpenPreview(item)}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                          >
                            visibility
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`cg-btn-modificar-row ${
                            isRejected ? "is-rejected" : ""
                          }`}
                          onClick={() => handleOpenModify(item)}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "16px" }}
                          >
                            {isRejected ? "build" : "edit_square"}
                          </span>
                          <span>{isRejected ? "Corregir" : "Modificar"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="cg-footer-row">
        <span className="cg-footer-info">
          Mostrando {espaciosFiltrados.length === 0 ? 0 : startIndex + 1} a{" "}
          {endIndex} de {espaciosFiltrados.length} espacios fijos del portal
        </span>
        <div className="cg-pagination-nav">
          <button
            type="button"
            className="cg-page-arrow"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              chevron_left
            </span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              className={`cg-page-number ${currentPage === num ? "active" : ""}`}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="cg-page-arrow"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Página siguiente"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE ESPACIO FIJO */}
      <CmsContenidoGraficoEditModal
        isOpen={showEditModal}
        onClose={() => !isSaving && setShowEditModal(false)}
        espacio={selectedEspacio}
        onSaveEspacio={handleSaveEspacioModified}
        isSaving={isSaving}
      />

      {/* MODAL DE VISTA PREVIA EN EL PORTAL */}
      {showPreviewModal && selectedEspacio && (
        <div
          className="cg-modal-overlay"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="cg-modal-container preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <span className="material-symbols-outlined cg-modal-header-icon">
                  visibility
                </span>
                <div>
                  <h2 className="cg-modal-title">{selectedEspacio.nombre}</h2>
                  <p className="cg-modal-subtitle">
                    {selectedEspacio.page} • {selectedEspacio.tipo} (
                    {selectedEspacio.dimensiones})
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowPreviewModal(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  close
                </span>
              </button>
            </div>

            <div className="cg-modal-body">
              {selectedEspacio.id === "espacio-banner-inicio" ? (
                <PortalCarouselPreview
                  imagenes={previewImages}
                  activeIndex={previewSlideIndex}
                  onChangeSlide={setPreviewSlideIndex}
                  textoSuperpuesto={selectedEspacio.textoSuperpuesto}
                  textoBoton={selectedEspacio.textoBoton}
                  altText={selectedEspacio.altText}
                />
              ) : selectedEspacio.id === "espacio-seccion-pacientes" ? (
                <PortalPatientInfoPreview
                  items={previewImages}
                  activeIndex={previewSlideIndex}
                  onSelectItem={setPreviewSlideIndex}
                />
              ) : selectedEspacio.id === "espacio-aprende-inicio" ? (
                <PortalAprendePreview
                  items={previewImages}
                  activeIndex={previewSlideIndex}
                  onSelectItem={setPreviewSlideIndex}
                />
              ) : (
                <div className="cg-preview-banner-box">
                  {activePreviewUrl ? (
                    <img
                      src={activePreviewUrl}
                      alt={selectedEspacio.altText || selectedEspacio.nombre}
                      className="cg-preview-banner-img"
                    />
                  ) : (
                    <div className="cg-preview-banner-empty">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "48px", color: "#94a3b8" }}
                      >
                        broken_image
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="cg-preview-details-grid">
                <div className="cg-detail-card">
                  <span className="cg-detail-label">
                    {selectedEspacio.id === "espacio-seccion-pacientes"
                      ? `Texto Alternativo (ALT) • Desplegable #${
                          previewSlideIndex + 1
                        }`
                      : selectedEspacio.id === "espacio-aprende-inicio"
                      ? previewSlideIndex === 0
                        ? "Texto Alternativo (ALT) • Imagen Principal"
                        : `Texto Alternativo (ALT) • Tarjeta #${previewSlideIndex}`
                      : "Texto Alternativo de la Sección (ALT)"}
                  </span>
                  <p className="cg-detail-value">
                    {selectedEspacio.id === "espacio-seccion-pacientes" ||
                    selectedEspacio.id === "espacio-aprende-inicio"
                      ? activePreviewImg?.altText ||
                        selectedEspacio.altText ||
                        "Sin texto alternativo definido"
                      : selectedEspacio.altText ||
                        "Sin texto alternativo definido"}
                  </p>
                </div>

                {selectedEspacio.id === "espacio-banner-inicio" && (
                  <div className="cg-detail-card">
                    <span className="cg-detail-label">Botón y Redirección</span>
                    <p className="cg-detail-value">
                      {selectedEspacio.textoBoton
                        ? `"${selectedEspacio.textoBoton}" → ${getPortalRouteLabel(
                            selectedEspacio.enlaceUrl
                          )}`
                        : "Sin botón activo"}
                    </p>
                  </div>
                )}

                {selectedEspacio.id === "espacio-seccion-pacientes" && (
                  <div className="cg-detail-card">
                    <span className="cg-detail-label">
                      Desplegable Seleccionado
                    </span>
                    <p className="cg-detail-value">
                      #{previewSlideIndex + 1} •{" "}
                      {activePreviewImg?.titulo || "Sin título"}
                    </p>
                  </div>
                )}

                {selectedEspacio.id === "espacio-aprende-inicio" && (
                  <div className="cg-detail-card">
                    <span className="cg-detail-label">
                      {previewSlideIndex === 0
                        ? "Elemento Seleccionado"
                        : `Redirección • Tarjeta #${previewSlideIndex}`}
                    </span>
                    <p className="cg-detail-value">
                      {previewSlideIndex === 0
                        ? "Encabezado, Párrafo e Imagen Principal"
                        : getPortalRouteLabel(activePreviewImg?.enlaceUrl) ||
                          "Sin redirección"}
                    </p>
                  </div>
                )}

                <div className="cg-detail-card">
                  <span className="cg-detail-label">
                    {selectedEspacio.id === "espacio-seccion-pacientes" ||
                    selectedEspacio.id === "espacio-aprende-inicio"
                      ? "Estructura de la Sección"
                      : "Total en Carrusel"}
                  </span>
                  <p className="cg-detail-value">
                    {selectedEspacio.id === "espacio-seccion-pacientes"
                      ? "5 desplegables fijos con imagen propia"
                      : selectedEspacio.id === "espacio-aprende-inicio"
                      ? "1 imagen principal + 3 tarjetas con redirección"
                      : `${previewImages.length} ${
                          previewImages.length === 1
                            ? "imagen activa"
                            : "imágenes activas"
                        }`}
                  </p>
                </div>
              </div>
            </div>

            <div className="cg-modal-footer">
              <button
                type="button"
                className="cg-btn-cancel"
                onClick={() => setShowPreviewModal(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="cg-btn-primary-blue"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleOpenModify(selectedEspacio);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  edit_square
                </span>
                <span>Modificar este Espacio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsContenidoGraficoView;
