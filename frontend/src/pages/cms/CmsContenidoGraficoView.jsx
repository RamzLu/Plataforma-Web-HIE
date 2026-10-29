import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import "../../styles/pages/cms/CmsContenidoGraficoView.css";
import {
  getContenidosGraficos,
  updateContenidoGrafico,
  cambiarEstadoContenidoGrafico,
} from "../../api/contenidoGrafico.api.js";
import { CmsContenidoGraficoEditModal } from "../../components/cms/CmsContenidoGraficoCorrectionModal";

// Imágenes institucionales de respaldo
import defaultImg1 from "../../assets/fondoHospitalCarrusel1.jpg";
import defaultImg2 from "../../assets/fondoHospitalCarrusel2.jpg";
import defaultImg3 from "../../assets/fondoHospitalCarrusel3.jpg";
import defaultImg4 from "../../assets/fondoHospitalCarrusel4.jpg";

/**
 * ESPACIOS FIJOS PREDEFINIDOS (PLACEHOLDERS DEL PORTAL)
 * El usuario no crea espacios nuevos; únicamente modifica las imágenes dentro de cada contenedor fijo.
 */
const INITIAL_ESPACIOS_FIJOS = [
  {
    id: "espacio-banner-inicio",
    espacioKey: "espacio-banner-inicio",
    orden: 1,
    nombre: "Banner Principal de Inicio",
    titulo: "Banner Principal de Inicio",
    descripcion: "Carrusel hero de bienvenida en la portada principal del portal",
    tipo: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Inicio",
    ubicacion: "Banner Principal",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-ini-1",
        url: defaultImg1,
        altText: "Fachada principal del Hospital Interdistrital Evita de Formosa al amanecer",
        titulo: "Atención Médica de Alta Complejidad al Servicio de la Comunidad",
        enlaceTexto: "Conocer especialidades",
        enlaceUrl: "/especialidades",
        fileName: "portada_hospital_evita_1.jpg",
      },
      {
        id: "img-ini-2",
        url: defaultImg4,
        altText: "Enfermera aplicando vacuna antigripal a adulto mayor en consultorio",
        titulo: "Campaña Provincial de Vacunación y Prevención 2026",
        enlaceTexto: "Ver cronograma",
        enlaceUrl: "/noticias",
        fileName: "campana_vacunacion_2026.jpg",
      },
      {
        id: "img-ini-3",
        url: defaultImg2,
        altText: "Profesionales médicos realizando control clínico en sala equipada",
        titulo: "Gestión de Turnos y Consultorios Externos",
        enlaceTexto: "Solicitar información",
        enlaceUrl: "/documentacion",
        fileName: "consultorios_externos.jpg",
      },
    ],
  },
  {
    id: "espacio-seccion-pacientes",
    espacioKey: "espacio-seccion-pacientes",
    orden: 2,
    nombre: "Sección Pacientes y Comunidad",
    titulo: "Sección Pacientes y Comunidad",
    descripcion: "Contenedor visual destinado a guías de atención, turnos y orientación al paciente",
    tipo: "Sección Pacientes",
    dimensiones: "1200x675px",
    page: "Inicio",
    ubicacion: "Sección Pacientes",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-pac-1",
        url: defaultImg2,
        altText: "Paciente recibiendo orientación en mesa de entradas del hospital",
        titulo: "",
        enlaceTexto: "Guía para el paciente",
        enlaceUrl: "/documentacion",
        fileName: "orientacion_pacientes.jpg",
      },
      {
        id: "img-pac-2",
        url: defaultImg3,
        altText: "Donantes voluntarios en el Centro Provincial de Hemoterapia",
        titulo: "",
        enlaceTexto: "Requisitos para donar sangre",
        enlaceUrl: "/noticias",
        fileName: "banco_de_sangre.jpg",
      },
    ],
  },
  {
    id: "espacio-banner-especialidades",
    espacioKey: "espacio-banner-especialidades",
    orden: 3,
    nombre: "Banner Principal de Especialidades",
    titulo: "Banner Principal de Especialidades",
    descripcion: "Cabecera visual de la página de Especialidades Médicas y Servicios",
    tipo: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Especialidades",
    ubicacion: "Banner Principal",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-esp-1",
        url: defaultImg2,
        altText: "Sala de hemodinamia y equipamiento cardiovascular de última generación",
        titulo: "Servicios Médicos y Unidades de Alta Complejidad",
        enlaceTexto: "Explorar cartelera médica",
        enlaceUrl: "/profesionales",
        fileName: "cabecera_especialidades.jpg",
      },
    ],
  },
  {
    id: "espacio-galeria-especialidades",
    espacioKey: "espacio-galeria-especialidades",
    orden: 4,
    nombre: "Imagen de Pacientes y Consultorios",
    titulo: "Imagen de Pacientes y Consultorios",
    descripcion: "Espacio gráfico en sección media de Especialidades y Diagnóstico por Imágenes",
    tipo: "Sección Media",
    dimensiones: "1280x720px",
    page: "Especialidades",
    ubicacion: "Sección Media",
    estado: "RECHAZADO",
    activo: false,
    rejectionReason:
      "Falta incorporar el isologo institucional en la esquina inferior y verificar contraste de la segunda imagen del carrusel.",
    imagenes: [
      {
        id: "img-esp-med-1",
        url: defaultImg3,
        altText: "Médica pediatra atendiendo a un paciente infantil en consultorio",
        titulo: "",
        enlaceTexto: "Ver servicio de pediatría",
        enlaceUrl: "/especialidades",
        fileName: "atencion_pediatrica.jpg",
      },
      {
        id: "img-esp-med-2",
        url: defaultImg1,
        altText: "Equipo de resonancia magnética nuclear y consola técnica",
        titulo: "",
        enlaceTexto: "Diagnóstico por imágenes",
        enlaceUrl: "/especialidades",
        fileName: "resonador_magnetico.jpg",
      },
    ],
  },
  {
    id: "espacio-banner-capacitacion",
    espacioKey: "espacio-banner-capacitacion",
    orden: 5,
    nombre: "Banner Principal de Capacitación",
    titulo: "Banner Principal de Capacitación",
    descripcion: "Carrusel principal del área de Docencia, Investigación y Residencias",
    tipo: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Capacitación",
    ubicacion: "Banner Principal",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-cap-1",
        url: defaultImg4,
        altText: "Equipo quirúrgico entrenando en centro de simulación clínica",
        titulo: "Formación Continua y Residencias Médicas de Excelencia",
        enlaceTexto: "Inscripciones abiertas",
        enlaceUrl: "/residencias",
        fileName: "residencias_cirugia.jpg",
      },
    ],
  },
  {
    id: "espacio-actividades-docencia",
    espacioKey: "espacio-actividades-docencia",
    orden: 6,
    nombre: "Espacio Talleres y Simulación Clínica",
    titulo: "Espacio Talleres y Simulación Clínica",
    descripcion: "Contenedor visual para jornadas hospitalarias y talleres de enfermería",
    tipo: "Sección Media",
    dimensiones: "1200x675px",
    page: "Capacitación",
    ubicacion: "Sección Media",
    estado: "PENDIENTE_APROBACION",
    activo: false,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-cap-med-1",
        url: defaultImg3,
        altText: "Auditorio institucional durante las jornadas de bioética hospitalaria",
        titulo: "",
        enlaceTexto: "Ver programa académico",
        enlaceUrl: "/capacitacion",
        fileName: "jornadas_bioetica.jpg",
      },
    ],
  },
  {
    id: "espacio-banner-institucional",
    espacioKey: "espacio-banner-institucional",
    orden: 7,
    nombre: "Banner Principal Institucional",
    titulo: "Banner Principal Institucional",
    descripcion: "Portada fija de la sección Acerca del Hospital y Autoridades",
    tipo: "Banner Principal",
    dimensiones: "1920x1080px",
    page: "Institucional",
    ubicacion: "Banner Principal",
    estado: "APROBADO",
    activo: true,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-inst-1",
        url: defaultImg1,
        altText: "Vista panorámica del edificio del Hospital Interdistrital Evita",
        titulo: "Nuestra Misión: Salud Pública con Equidad y Calidad Humana",
        enlaceTexto: "Conocer plano del hospital",
        enlaceUrl: "/plano",
        fileName: "institucional_fachada.jpg",
      },
    ],
  },
  {
    id: "espacio-derechos-pacientes",
    espacioKey: "espacio-derechos-pacientes",
    orden: 8,
    nombre: "Espacio Derechos de Pacientes y Bioseguridad",
    titulo: "Espacio Derechos de Pacientes y Bioseguridad",
    descripcion: "Contenedor gráfico informativo en pie de sección institucional",
    tipo: "Sección Pacientes",
    dimensiones: "1200x675px",
    page: "Institucional",
    ubicacion: "Sección Pacientes",
    estado: "BORRADOR",
    activo: false,
    rejectionReason: null,
    imagenes: [
      {
        id: "img-inst-pac-1",
        url: defaultImg2,
        altText: "Infografía sobre los derechos del paciente y consentimiento informado",
        titulo: "",
        enlaceTexto: "Descargar guía en PDF",
        enlaceUrl: "/documentacion",
        fileName: "derechos_paciente.jpg",
      },
    ],
  },
];

const DEFAULT_FALLBACK_ASSETS = [defaultImg1, defaultImg2, defaultImg3, defaultImg4];

// Normaliza registros del backend o de localStorage para garantizar que cada espacio tenga su array `imagenes` y su URL de respaldo
const normalizeEspacios = (list) => {
  if (!Array.isArray(list) || list.length === 0) return INITIAL_ESPACIOS_FIJOS;
  return list.map((item, idx) => {
    const matchedSeed =
      INITIAL_ESPACIOS_FIJOS.find(
        (s) =>
          s.espacioKey === item.espacioKey ||
          s.id === item.id ||
          s.orden === item.orden ||
          s.nombre.toLowerCase() === (item.nombre || item.titulo || "").toLowerCase()
      ) || INITIAL_ESPACIOS_FIJOS[idx % INITIAL_ESPACIOS_FIJOS.length];

    const hasImagenes = Array.isArray(item.imagenes) && item.imagenes.length > 0;
    const isBanner =
      item.tipo === "Banner Principal" ||
      item.ubicacion?.toLowerCase().includes("cabecera") ||
      item.ubicacion?.toLowerCase().includes("banner principal");

    const normalizedImagenes = hasImagenes
      ? item.imagenes.map((img, slideIdx) => {
          const seedSlide = matchedSeed?.imagenes?.[slideIdx];
          const fallbackUrl =
            seedSlide?.url ||
            DEFAULT_FALLBACK_ASSETS[(idx + slideIdx) % DEFAULT_FALLBACK_ASSETS.length];
          return {
            ...img,
            id: img.id || `img-${item.id || idx}-${slideIdx + 1}`,
            url: img.url || fallbackUrl,
            altText: img.altText || seedSlide?.altText || "",
            titulo: isBanner ? img.titulo || seedSlide?.titulo || "" : "",
            enlaceTexto: img.enlaceTexto ?? seedSlide?.enlaceTexto ?? "",
            enlaceUrl: img.enlaceUrl ?? seedSlide?.enlaceUrl ?? "",
            fileName: img.fileName || seedSlide?.fileName || `imagen_${slideIdx + 1}.jpg`,
          };
        })
      : [
          {
            id: `img-${item.id || idx}-1`,
            url: item.imageUrl || matchedSeed?.imagenes?.[0]?.url || defaultImg1,
            altText: item.altText || matchedSeed?.imagenes?.[0]?.altText || "",
            titulo: isBanner ? item.titulo || "" : "",
            enlaceTexto: item.enlaceTexto || (item.enlaceUrl ? "Ver más" : ""),
            enlaceUrl: item.enlaceUrl || "",
            fileName: item.fileName || "imagen_espacio.jpg",
          },
        ];

    return {
      ...item,
      id: item.id || matchedSeed.id,
      espacioKey: item.espacioKey || matchedSeed.espacioKey || item.id,
      orden: item.orden || matchedSeed.orden || idx + 1,
      nombre: item.nombre || item.titulo || matchedSeed.nombre || `Espacio Gráfico #${idx + 1}`,
      descripcion: item.descripcion || matchedSeed.descripcion || "",
      tipo: item.tipo || (isBanner ? "Banner Principal" : item.ubicacion || "Espacio Fijo"),
      dimensiones: item.dimensiones || (isBanner ? "1920x1080px" : "1200x675px"),
      page: item.page || item.pagina || matchedSeed.page || "Inicio",
      imagenes: normalizedImagenes,
    };
  });
};

const CmsContenidoGraficoView = () => {
  // Estado principal: Espacios Fijos del portal (cada uno con su array de imágenes para el carrusel)
  const [espacios, setEspacios] = useState(() => {
    const savedFixed = localStorage.getItem("hie_espacios_graficos_fijos");
    if (savedFixed) {
      try {
        const parsed = JSON.parse(savedFixed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeEspacios(parsed);
        }
      } catch (e) {
        console.error("Error al leer espacios gráficos fijos:", e);
      }
    }
    return INITIAL_ESPACIOS_FIJOS;
  });

  // Pestaña activa: 'todos' | 'publicados' | 'borradores' | 'pendientes' | 'rechazados'
  const [viewTab, setViewTab] = useState("todos");
  const [filtroPagina, setFiltroPagina] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modales operativos (Edición de espacio fijo, Vista previa y Revisión editorial)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [selectedEspacio, setSelectedEspacio] = useState(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [reviewAction, setReviewAction] = useState("approve");
  const [reviewRejectionText, setReviewRejectionText] = useState("");

  // Persistir cambios en LocalStorage (excluyendo objetos File binarios)
  useEffect(() => {
    const serializable = espacios.map((esp) => ({
      ...esp,
      imagenes: Array.isArray(esp.imagenes)
        ? esp.imagenes.map(({ fileObj, ...rest }) => rest)
        : [],
    }));
    localStorage.setItem("hie_espacios_graficos_fijos", JSON.stringify(serializable));
  }, [espacios]);

  // Sincronización con backend al montar la vista
  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        const data = await getContenidosGraficos();
        if (data && Array.isArray(data) && data.length > 0) {
          setEspacios(normalizeEspacios(data));
        }
      } catch {
        // Opera con los espacios fijos predefinidos localmente si el servidor no está activo
      }
    };
    fetchFromBackend();
  }, []);

  // Filtrado de espacios fijos por pestaña de estado y por página
  const espaciosFiltrados = useMemo(() => {
    return espacios.filter((item) => {
      const est = (item.estado || "APROBADO").toUpperCase();
      if (viewTab === "publicados") {
        if (est !== "APROBADO" && est !== "PUBLICADO") return false;
      } else if (viewTab === "borradores") {
        if (est !== "BORRADOR") return false;
      } else if (viewTab === "pendientes") {
        if (est !== "PENDIENTE_APROBACION" && est !== "PENDIENTE") return false;
      } else if (viewTab === "rechazados") {
        if (est !== "RECHAZADO") return false;
      }

      if (filtroPagina && filtroPagina !== "" && filtroPagina !== "Todas las páginas") {
        if (item.page?.toLowerCase() !== filtroPagina.toLowerCase()) return false;
      }

      return true;
    });
  }, [espacios, viewTab, filtroPagina]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(espaciosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, espaciosFiltrados.length);
  const currentEspacios = espaciosFiltrados.slice(startIndex, endIndex);

  // Abrir Modal de Edición de Espacio Fijo (también usado para subsanar rechazos)
  const handleOpenModify = (espacio) => {
    setSelectedEspacio(espacio);
    setShowEditModal(true);
  };

  // Abrir Modal de Vista Previa del Espacio
  const handleOpenPreview = (espacio) => {
    setSelectedEspacio(espacio);
    setPreviewSlideIndex(0);
    setShowPreviewModal(true);
  };

  // Abrir Modal de Revisión Editorial
  const handleOpenReview = (espacio) => {
    setSelectedEspacio(espacio);
    setReviewAction("approve");
    setReviewRejectionText("");
    setShowReviewModal(true);
  };

  // Guardar las imágenes y metadatos modificados dentro del espacio fijo
  const handleSaveEspacioModified = async (updatedEspacio) => {
    setEspacios((prev) =>
      prev.map((item) =>
        item.id === updatedEspacio.id || item.espacioKey === updatedEspacio.espacioKey
          ? updatedEspacio
          : item
      )
    );

    try {
      const res = await updateContenidoGrafico(updatedEspacio.id, updatedEspacio);
      if (res?.espacio) {
        const [normalized] = normalizeEspacios([res.espacio]);
        setEspacios((prev) =>
          prev.map((item) =>
            item.id === updatedEspacio.id ||
            item.id === normalized.id ||
            (item.espacioKey && item.espacioKey === normalized.espacioKey)
              ? normalized
              : item
          )
        );
      }
    } catch {
      // Guardado local ya aplicado si el backend no responde
    }

    if (selectedEspacio?.estado === "RECHAZADO" && updatedEspacio.estado === "PENDIENTE_APROBACION") {
      toast.success("Espacio corregido y reenviado a revisión editorial.");
    } else if (updatedEspacio.estado === "BORRADOR") {
      toast.success("Cambios del espacio guardados como borrador.");
    } else {
      toast.success(`Espacio "${updatedEspacio.nombre}" actualizado correctamente.`);
    }

    setShowEditModal(false);
    setSelectedEspacio(null);
  };

  // Dictamen de Revisión Editorial (Aprobar / Rechazar con motivo)
  const handleProcessReview = async () => {
    if (!selectedEspacio) return;

    if (reviewAction === "reject") {
      if (!reviewRejectionText.trim()) {
        toast.error("Debe especificar obligatoriamente el motivo del rechazo.");
        return;
      }

      const nuevoMotivo = reviewRejectionText.trim();

      setEspacios((prev) =>
        prev.map((item) =>
          item.id === selectedEspacio.id
            ? {
                ...item,
                estado: "RECHAZADO",
                activo: false,
                rejectionReason: nuevoMotivo,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      try {
        const res = await cambiarEstadoContenidoGrafico(selectedEspacio.id, {
          estado: "RECHAZADO",
          rejectionReason: nuevoMotivo,
        });
        if (res?.espacio) {
          const [normalized] = normalizeEspacios([res.espacio]);
          setEspacios((prev) =>
            prev.map((item) =>
              item.id === selectedEspacio.id || item.id === normalized.id
                ? normalized
                : item
            )
          );
        }
      } catch {
        // Estado local actualizado
      }

      toast.error(`Espacio "${selectedEspacio.nombre}" observado para corrección.`);
    } else {
      setEspacios((prev) =>
        prev.map((item) =>
          item.id === selectedEspacio.id
            ? {
                ...item,
                estado: "APROBADO",
                activo: true,
                rejectionReason: null,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      try {
        const res = await cambiarEstadoContenidoGrafico(selectedEspacio.id, {
          estado: "APROBADO",
          rejectionReason: null,
        });
        if (res?.espacio) {
          const [normalized] = normalizeEspacios([res.espacio]);
          setEspacios((prev) =>
            prev.map((item) =>
              item.id === selectedEspacio.id || item.id === normalized.id
                ? normalized
                : item
            )
          );
        }
      } catch {
        // Estado local actualizado
      }

      toast.success(`Espacio "${selectedEspacio.nombre}" aprobado y publicado.`);
    }

    setShowReviewModal(false);
  };

  const previewImages = selectedEspacio?.imagenes || [];
  const activePreviewImg =
    previewImages[Math.min(previewSlideIndex, Math.max(0, previewImages.length - 1))] || null;

  return (
    <div className="cms-dashboard-card cg-main-card">
      {/* Encabezado Interno: Modelo de Edición de Espacios Fijos (Sin botón de Crear Nuevo) */}
      <div className="cg-inner-header">
        <div>
          <h2 className="cg-title">Espacios Gráficos del Portal</h2>
          <p className="cg-subtitle">
            Seleccione un contenedor predefinido y haga clic en <strong>Modificar</strong> para gestionar las imágenes de su carrusel.
          </p>
        </div>
        <div className="cg-fixed-model-badge">
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            dashboard_customize
          </span>
          <span>{espacios.length} Espacios Fijos Predefinidos</span>
        </div>
      </div>

      {/* Fila de Controles: Tabs de Estado & Filtro por Página */}
      <div className="cg-controls-row">
        <div className="cg-tabs-container" id="tab-group">
          <button
            type="button"
            className={`filter-tab ${viewTab === "todos" ? "active" : ""}`}
            onClick={() => {
              setViewTab("todos");
              setCurrentPage(1);
            }}
          >
            Todos ({espacios.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${viewTab === "publicados" ? "active" : ""}`}
            onClick={() => {
              setViewTab("publicados");
              setCurrentPage(1);
            }}
          >
            Publicados
          </button>
          <button
            type="button"
            className={`filter-tab ${viewTab === "borradores" ? "active" : ""}`}
            onClick={() => {
              setViewTab("borradores");
              setCurrentPage(1);
            }}
          >
            Borradores
          </button>
          <button
            type="button"
            className={`filter-tab ${viewTab === "pendientes" ? "active" : ""}`}
            onClick={() => {
              setViewTab("pendientes");
              setCurrentPage(1);
            }}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={`filter-tab ${viewTab === "rechazados" ? "active" : ""}`}
            onClick={() => {
              setViewTab("rechazados");
              setCurrentPage(1);
            }}
          >
            Rechazados
          </button>
        </div>

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
              <option value="Inicio">Inicio</option>
              <option value="Especialidades">Especialidades</option>
              <option value="Capacitación">Capacitación</option>
              <option value="Institucional">Institucional</option>
            </select>
            <span className="material-symbols-outlined cg-filter-chevron">expand_more</span>
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
                ESPACIO FIJO Y CARRUSEL ACTUAL
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
            {currentEspacios.length === 0 ? (
              <tr>
                <td colSpan={5} className="cg-empty-cell">
                  <div className="cg-empty-content">
                    <span className="material-symbols-outlined cg-empty-icon">
                      photo_library
                    </span>
                    <p className="cg-empty-title">
                      No hay espacios fijos que coincidan con el filtro seleccionado
                    </p>
                    <p className="cg-empty-desc">
                      Pruebe seleccionando la pestaña "Todos" o limpiando el filtro por página.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentEspacios.map((item, index) => {
                const isApproved = item.estado === "APROBADO" || item.estado === "PUBLICADO";
                const isRejected = item.estado === "RECHAZADO";
                const isPending =
                  item.estado === "PENDIENTE_APROBACION" || item.estado === "PENDIENTE";
                const isDraft = item.estado === "BORRADOR";

                const imgs = Array.isArray(item.imagenes) ? item.imagenes : [];
                const coverImg = imgs[0]?.url || item.imageUrl;

                return (
                  <tr key={item.id} className="cg-table-row">
                    {/* ORDEN */}
                    <td className="cg-td-orden">
                      {item.orden || startIndex + index + 1}
                    </td>

                    {/* ESPACIO FIJO Y VISTA PREVIA */}
                    <td className="cg-td-recurso">
                      <div className="cg-recurso-box">
                        <div
                          className="cg-thumb-container"
                          onClick={() => handleOpenPreview(item)}
                          title="Clic para previsualizar carrusel"
                        >
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={imgs[0]?.altText || item.nombre}
                              className="cg-thumb-img"
                            />
                          ) : (
                            <div className="cg-thumb-empty">
                              <span className="material-symbols-outlined">broken_image</span>
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
                              {item.dimensiones || "1920x1080px"}
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

                    {/* PÁGINA Y TIPO DE BLOQUE */}
                    <td className="cg-td-ubicacion">
                      <div className="cg-location-stack">
                        <span className="cg-location-page">{item.page}</span>
                        <span className="cg-location-type">
                          {item.tipo || item.ubicacion}
                        </span>
                      </div>
                    </td>

                    {/* ESTADO */}
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

                    {/* ACCIONES */}
                    <td className="cg-td-acciones">
                      <div className="cg-actions-group">
                        <button
                          type="button"
                          className="cg-action-btn"
                          title="Previsualizar carrusel"
                          onClick={() => handleOpenPreview(item)}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                          >
                            visibility
                          </span>
                        </button>

                        {isPending && (
                          <button
                            type="button"
                            className="cg-action-btn action-review"
                            title="Revisar / Dictaminar"
                            onClick={() => handleOpenReview(item)}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "18px" }}
                            >
                              fact_check
                            </span>
                          </button>
                        )}

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
          Mostrando {espaciosFiltrados.length === 0 ? 0 : startIndex + 1} a {endIndex} de{" "}
          {espaciosFiltrados.length} espacios fijos del portal
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

      {/* ==========================================================================
          MODAL UNIFICADO DE EDICIÓN DE ESPACIO FIJO Y SUBSANACIÓN DE RECHAZOS
          ========================================================================== */}
      <CmsContenidoGraficoEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        espacio={selectedEspacio}
        onSaveEspacio={handleSaveEspacioModified}
      />

      {/* ==========================================================================
          MODAL DE VISTA PREVIA RÁPIDA DEL CARRUSEL
          ========================================================================== */}
      {showPreviewModal && selectedEspacio && (
        <div className="cg-modal-overlay" onClick={() => setShowPreviewModal(false)}>
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
                    {selectedEspacio.page} • {selectedEspacio.tipo} ({selectedEspacio.dimensiones})
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
              <div className="cg-preview-banner-box">
                {activePreviewImg ? (
                  <img
                    src={activePreviewImg.url}
                    alt={activePreviewImg.altText || selectedEspacio.nombre}
                    className="cg-preview-banner-img"
                  />
                ) : (
                  <div className="cg-preview-banner-empty">
                    <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#94a3b8" }}>
                      broken_image
                    </span>
                  </div>
                )}

                {previewImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="cg-mockup-nav-arrow prev"
                      onClick={() =>
                        setPreviewSlideIndex(
                          (prev) => (prev - 1 + previewImages.length) % previewImages.length
                        )
                      }
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button
                      type="button"
                      className="cg-mockup-nav-arrow next"
                      onClick={() =>
                        setPreviewSlideIndex((prev) => (prev + 1) % previewImages.length)
                      }
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </>
                )}

                <div className="cg-preview-overlay">
                  <span className="cg-preview-tag">
                    Imagen {previewSlideIndex + 1} de {previewImages.length} •{" "}
                    {selectedEspacio.dimensiones}
                  </span>
                  {selectedEspacio.tipo === "Banner Principal" && activePreviewImg?.titulo && (
                    <h3 className="cg-preview-title">{activePreviewImg.titulo}</h3>
                  )}
                  {(activePreviewImg?.enlaceTexto || activePreviewImg?.enlaceUrl) && (
                    <p className="cg-preview-desc">
                      Enlace: {activePreviewImg.enlaceTexto || "Ver más"} (
                      {activePreviewImg.enlaceUrl || "Sin URL"})
                    </p>
                  )}
                </div>
              </div>

              <div className="cg-preview-details-grid">
                <div className="cg-detail-card">
                  <span className="cg-detail-label">Texto Alternativo (ALT)</span>
                  <p className="cg-detail-value">
                    {activePreviewImg?.altText || "Sin texto alternativo definido"}
                  </p>
                </div>
                <div className="cg-detail-card">
                  <span className="cg-detail-label">Enlace Configurado</span>
                  <p className="cg-detail-value">
                    {activePreviewImg?.enlaceUrl
                      ? `${activePreviewImg.enlaceTexto || "Enlace"} → ${activePreviewImg.enlaceUrl}`
                      : "Sin enlace configurado"}
                  </p>
                </div>
                <div className="cg-detail-card">
                  <span className="cg-detail-label">Total en Carrusel</span>
                  <p className="cg-detail-value">
                    {previewImages.length}{" "}
                    {previewImages.length === 1 ? "imagen activa" : "imágenes activas"}
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

      {/* ==========================================================================
          MODAL DE REVISIÓN EDITORIAL (APROBAR O RECHAZAR CON MOTIVO)
          ========================================================================== */}
      {showReviewModal && selectedEspacio && (
        <div className="cg-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="cg-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-header">
              <div className="cg-modal-header-left">
                <span className="material-symbols-outlined cg-modal-header-icon">
                  fact_check
                </span>
                <div>
                  <h2 className="cg-modal-title">Revisión Editorial del Espacio</h2>
                  <p className="cg-modal-subtitle">
                    Dictamen para "{selectedEspacio.nombre}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cg-modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  close
                </span>
              </button>
            </div>

            <div className="cg-modal-body">
              <div className="cg-review-options">
                <label
                  className={`cg-review-option ${
                    reviewAction === "approve" ? "selected-approve" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewAction"
                    value="approve"
                    checked={reviewAction === "approve"}
                    onChange={() => setReviewAction("approve")}
                  />
                  <div>
                    <span className="cg-review-title" style={{ color: "#15803d" }}>
                      Aprobar y Publicar
                    </span>
                    <p className="cg-review-desc">
                      El carrusel de este espacio fijo se actualizará en el portal.
                    </p>
                  </div>
                </label>

                <label
                  className={`cg-review-option ${
                    reviewAction === "reject" ? "selected-reject" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewAction"
                    value="reject"
                    checked={reviewAction === "reject"}
                    onChange={() => setReviewAction("reject")}
                  />
                  <div>
                    <span className="cg-review-title" style={{ color: "#b91c1c" }}>
                      Rechazar con Observaciones
                    </span>
                    <p className="cg-review-desc">
                      Solicita ajustes en las imágenes o metadatos del espacio.
                    </p>
                  </div>
                </label>
              </div>

              {reviewAction === "reject" && (
                <div className="cg-form-group" style={{ marginTop: "0.75rem" }}>
                  <label className="cg-form-label">
                    Motivo Obligatorio del Rechazo <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <textarea
                    className="cg-form-textarea"
                    rows="3"
                    placeholder="Detalle las correcciones necesarias..."
                    value={reviewRejectionText}
                    onChange={(e) => setReviewRejectionText(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="cg-modal-footer">
              <button
                type="button"
                className="cg-btn-cancel"
                onClick={() => setShowReviewModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={
                  reviewAction === "reject" ? "cg-btn-danger" : "cg-btn-primary-blue"
                }
                onClick={handleProcessReview}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {reviewAction === "reject" ? "cancel" : "check_circle"}
                </span>
                <span>
                  {reviewAction === "reject" ? "Confirmar Rechazo" : "Aprobar Espacio"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsContenidoGraficoView;
