import { mensajeDeError } from "../../utils/mensajeDeError";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import {
  BookOpen,
  Video,
  FileText,
  Upload,
  X,
  Users,
  Globe,
  PlayCircle,
  Image as ImageIcon,
} from "lucide-react";

import "../../styles/components/cms/CmsDashboard.css";
import "../../styles/components/cms/CmsModals.css";
import "../../styles/pages/cms/CmsNoticiasView.css";
import "../../styles/pages/cms/CmsResidenciasView.css";
import "../../styles/pages/cms/CmsCapacitacionesView.css";

import {
  CmsDeleteModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";
import SiguePublicado from "../../components/cms/SiguePublicado";
import { EtiquetaEliminacion } from "../../components/admin/SolicitudEliminacionAcciones";
import { estaPublicadoEnPortal, requiereAprobacionParaEliminar, tituloEnLista, vistaPublicados } from "../../utils/publicacion.js";
import FiltrosEstado from "../../components/ui/FiltrosEstado";
import BarraFiltros from "../../components/ui/BarraFiltros";
import keycloak from "../../config/keycloak";
import {
  getCapacitaciones,
  createCapacitacion,
  updateCapacitacion,
  deleteCapacitacion,
} from "../../api/capacitaciones.api";
import { activarConTeclado } from "../../utils/accesibilidad.js";
import EtiquetaEstado from "../../components/ui/EtiquetaEstado";
import { textoDeEstado } from "../../components/ui/estados.js";

// Datos iniciales armonizados con el portal público (CapacitacionPage) y schema.prisma

const CmsCapacitacionesView = ({ initialCreateModal = false, onModalOpened }) => {
  // Lista de capacitaciones obtenidas desde la base de datos
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PUBLICADOS"); // PUBLICADOS, PENDIENTES, RECHAZADOS, BORRADORES, ARCHIVADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("TODAS");

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Si lo que se edita está (o estuvo) publicado, retirarlo del portal se pide archivándolo, no pasándolo a borrador.
  const editandoPublicado = (() => {
    const actual = capacitaciones.find((c) => c.id === editingId);
    return Boolean(actual && (["PUBLICADO", "APROBADO"].includes(actual.estado) || actual.esActualizacion));
  })();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Referencia y estados para BANNER / PORTADA (Tarjeta y cabecera)
  const bannerInputRef = useRef(null);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [bannerSeleccionado, setBannerSeleccionado] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [eliminarBannerFlag, setEliminarBannerFlag] = useState(false);

  // Referencia y estados para ARCHIVO DE CONTENIDO / MATERIAL DIDÁCTICO (Video, Documento o Imagen)
  const fileInputRef = useRef(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [eliminarArchivoFlag, setEliminarArchivoFlag] = useState(false);

  // Formulario según los campos de schema.prisma y el portal público
  const initialForm = {
    titulo: "",
    estado: "PUBLICADO", // BORRADOR, PUBLICADO, ARCHIVADO
    modalidad: "Presencial",
    tipoRecurso: "presencial",
    fechaInicio: "",
    fechaFin: "",
    horario: "10:00",
    ubicacion: "Hospital Interdistrital Evita",
    disertantes: "",
    videoUrl: "",
    archivoTipo: "", // "video" | "documento" | "imagen"
    archivoNombre: "",
    archivoTamano: "",
    archivoUrl: "",
    imagenUrl: "",
    bannerUrl: "",
    bannerNombre: "",
    descripcion: "",
    contenido: "",
    activo: true,
  };

  const [formData, setFormData] = useState(initialForm);

  // Cargar capacitaciones desde el backend
  const cargarCapacitaciones = async () => {
    setLoading(true);
    try {
      const data = await getCapacitaciones();
      setCapacitaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar capacitaciones:", error);
      toast.error("No se pudieron cargar las capacitaciones desde el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCapacitaciones();
  }, []);

  // Helper para generar iniciales
  const getInicialesCapacitacion = (nombre) => {
    if (!nombre) return "CP";
    const palabras = nombre.trim().split(/\s+/).filter(Boolean);
    if (palabras.length >= 2) {
      return `${palabras[0].charAt(0)}${palabras[1].charAt(0)}`.toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  };

  // Procesamiento de BANNER / PORTADA (Imagen de tarjeta y cabecera)
  const procesarBanner = (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    const mime = file.type || "";
    const isImage =
      mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(extension);

    if (!isImage) {
      return toast.error("Solo se admiten imágenes para el Banner / Portada (JPG, PNG, WEBP).");
    }

    const blobUrl = URL.createObjectURL(file);
    setBannerSeleccionado(file);
    setBannerPreview(blobUrl);
    setEliminarBannerFlag(false);
    setFormData((prev) => ({
      ...prev,
      bannerUrl: blobUrl,
      bannerNombre: file.name,
      imagenUrl: blobUrl,
    }));
    setHasUnsavedChanges(true);
    toast.success("Imagen de portada / banner seleccionada.");
  };

  const handleQuitarBanner = () => {
    setBannerSeleccionado(null);
    setBannerPreview("");
    setEliminarBannerFlag(true);
    setFormData((prev) => ({
      ...prev,
      bannerUrl: "",
      bannerNombre: "",
      imagenUrl: "",
    }));
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    setHasUnsavedChanges(true);
  };

  // Procesamiento de ARCHIVO DE CONTENIDO / MATERIAL DIDÁCTICO (Video, Documento o Imagen)
  const procesarArchivoUnificado = (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    const mime = file.type || "";

    const isImage =
      mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(extension);
    const isVideo =
      mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes(extension);
    const isDoc =
      mime === "application/pdf" ||
      ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension);

    if (!isImage && !isVideo && !isDoc) {
      return toast.error("Solo se admiten videos (MP4/WEBM), documentos (PDF/DOC) o infografías (JPG/PNG/WEBP).");
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    const blobUrl = URL.createObjectURL(file);
    let tipo = "documento";
    if (isImage) tipo = "imagen";
    if (isVideo) tipo = "video";

    setArchivoSeleccionado(file);
    setEliminarArchivoFlag(false);
    setFormData((prev) => ({
      ...prev,
      archivoTipo: tipo,
      archivoNombre: file.name,
      archivoTamano: sizeFormatted,
      archivoUrl: blobUrl,
      tipoRecurso: isVideo ? "video" : isDoc ? "pdf" : isImage ? "imagen" : prev.tipoRecurso,
    }));
    setHasUnsavedChanges(true);
    toast.success(
      tipo === "video"
        ? "Video seleccionado para carga."
        : tipo === "imagen"
        ? "Infografía / Imagen de contenido seleccionada."
        : "Documento seleccionado para carga."
    );
  };

  const handleQuitarArchivo = () => {
    setArchivoSeleccionado(null);
    setEliminarArchivoFlag(true);
    setFormData((prev) => ({
      ...prev,
      archivoTipo: "",
      archivoNombre: "",
      archivoTamano: "",
      archivoUrl: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setHasUnsavedChanges(true);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setBannerSeleccionado(null);
    setBannerPreview("");
    setEliminarBannerFlag(false);
    setArchivoSeleccionado(null);
    setEliminarArchivoFlag(false);
    setFormData(initialForm);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  useEffect(() => {
    if (initialCreateModal) {
      handleOpenCreate();
      if (onModalOpened) onModalOpened();
    }
  }, [initialCreateModal]);

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setBannerSeleccionado(null);
    const existingBanner = item.bannerUrl || item.imagenUrl || "";
    setBannerPreview(existingBanner);
    setEliminarBannerFlag(false);
    setArchivoSeleccionado(null);
    setEliminarArchivoFlag(false);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";

    let horaExtraida = "10:00";
    if (item.horario) {
      const match = item.horario.match(/(\d{1,2}:\d{2})/);
      horaExtraida = match ? match[1].padStart(5, "0") : item.horario.slice(0, 5);
    }

    let tipoArch = item.archivoTipo || "";
    if (!tipoArch) {
      if (item.videoUrl && item.videoUrl.match(/\.(mp4|webm|mov)$/i)) tipoArch = "video";
      else if ((item.archivoNombre && item.archivoNombre.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) || (item.archivoUrl && item.archivoUrl.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i))) tipoArch = "imagen";
      else if (item.archivoNombre || (item.archivoUrl && item.archivoUrl.match(/\.(pdf|doc|docx)$/i))) tipoArch = "documento";
    }

    setFormData({
      titulo: item.titulo || "",
      estado: ["BORRADOR", "ARCHIVADO"].includes(item.estado) ? item.estado : "PUBLICADO",
      modalidad: item.modalidad || "Presencial",
      tipoRecurso: (() => {
        if (tipoArch === "documento") return "pdf";
        if (tipoArch === "video") return "video";
        if (tipoArch === "imagen") return "imagen";
        return item.tipoRecurso || "presencial";
      })(),
      fechaInicio: item.fechaInicio || "",
      fechaFin: item.fechaFin || "",
      horario: horaExtraida,
      ubicacion: item.ubicacion || "",
      disertantes: item.disertantes || "",
      videoUrl: item.videoUrl || "",
      archivoTipo: tipoArch,
      archivoNombre: item.archivoNombre || "",
      archivoTamano: item.archivoTamano || "",
      archivoUrl: item.archivoUrl || "",
      imagenUrl: existingBanner,
      bannerUrl: existingBanner,
      bannerNombre: item.bannerNombre || (existingBanner ? "banner_portada.jpg" : ""),
      descripcion: item.descripcion || "",
      contenido: item.contenido || "",
      activo: item.activo !== false,
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      setShowModal(false);
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setShowModal(false);
    setHasUnsavedChanges(false);
  };

  // Guardar datos en la base de datos a través de la API
  const handleSave = async (e, forcedEstado) => {
    if (e) e.preventDefault();
    if (editingId && !hasUnsavedChanges) {
      return toast.error("No se han detectado cambios para actualizar.");
    }
    if (!formData.titulo.trim()) {
      return toast.error("El título de la capacitación es obligatorio.");
    }

    const estadoFinal = forcedEstado || formData.estado || "PUBLICADO";
    setIsSaving(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append("titulo", formData.titulo.trim());
      dataToSend.append("estado", estadoFinal);
      dataToSend.append("modalidad", formData.modalidad || "Presencial");
      dataToSend.append("tipoRecurso", formData.tipoRecurso || "presencial");
      dataToSend.append("fechaInicio", formData.fechaInicio || "");
      dataToSend.append("fechaFin", formData.fechaFin || "");
      dataToSend.append("horario", formData.horario || "10:00");
      dataToSend.append("ubicacion", formData.ubicacion || "");
      dataToSend.append("disertantes", formData.disertantes || "");
      dataToSend.append("descripcion", formData.descripcion || "");
      dataToSend.append("contenido", formData.contenido || "");

      const cleanVideoUrl = formData.videoUrl && !formData.videoUrl.startsWith("blob:") ? formData.videoUrl.trim() : "";
      const cleanArchivoUrl = formData.archivoUrl && !formData.archivoUrl.startsWith("blob:") ? formData.archivoUrl.trim() : "";
      const cleanBannerUrl = formData.bannerUrl && !formData.bannerUrl.startsWith("blob:") ? formData.bannerUrl.trim() : "";

      dataToSend.append("videoUrl", cleanVideoUrl);
      dataToSend.append("archivoTipo", formData.archivoTipo || "");
      dataToSend.append("archivoNombre", formData.archivoNombre || "");
      dataToSend.append("archivoTamano", formData.archivoTamano || "");
      dataToSend.append("archivoUrl", cleanArchivoUrl);
      dataToSend.append("bannerUrl", cleanBannerUrl);
      dataToSend.append("imagenUrl", cleanBannerUrl);
      dataToSend.append("bannerNombre", formData.bannerNombre || "");

      // 1. Banner / Portada
      if (bannerSeleccionado) {
        dataToSend.append("banner", bannerSeleccionado);
      }
      if (eliminarBannerFlag) {
        dataToSend.append("eliminarBanner", "true");
      }

      // 2. Archivo de contenido / Material Didáctico
      if (archivoSeleccionado) {
        dataToSend.append("archivo", archivoSeleccionado);
      }
      if (eliminarArchivoFlag) {
        dataToSend.append("eliminarArchivo", "true");
      }

      if (editingId) {
        const resp = await updateCapacitacion(editingId, dataToSend);
        toast.success(
          resp?.data?.estado === "PENDIENTE_APROBACION"
            ? resp.message
            : estadoFinal === "BORRADOR"
            ? "Borrador actualizado con éxito."
            : "Capacitación actualizada con éxito."
        );
        if (resp?.data?.estado === "PENDIENTE_APROBACION") setActiveTab("PENDIENTES");
      } else {
        const resp = await createCapacitacion(dataToSend);
        toast.success(
          resp?.data?.estado === "PENDIENTE_APROBACION"
            ? resp.message
            : estadoFinal === "BORRADOR"
            ? "Borrador guardado con éxito."
            : "Capacitación creada con éxito."
        );
        if (resp?.data?.estado === "PENDIENTE_APROBACION") setActiveTab("PENDIENTES");
      }

      await cargarCapacitaciones();
      setShowModal(false);
      setShowUnsavedModal(false);
      setHasUnsavedChanges(false);
      setBannerSeleccionado(null);
      setArchivoSeleccionado(null);
    } catch (error) {
      console.error("Error al guardar capacitación:", error);
      toast.error(mensajeDeError(error, "Error al guardar la capacitación."));
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminación de registro
  const confirmDelete = (item) => {
    setItemAEliminar(item);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!itemAEliminar) return;
    try {
      const respuesta = await deleteCapacitacion(itemAEliminar.id);
      // Si el contenido está publicado, el backend no lo borra: queda una solicitud para el administrador.
      if (respuesta?.solicitudEliminacion) {
        toast.success(respuesta.message, { duration: 6000 });
        // El pedido queda registrado en el servidor: se vuelve a pedir la lista para que la fila lo muestre.
        cargarCapacitaciones();
        return;
      }
      recordCmsActivity({
        titulo: `Eliminó capacitación: "${itemAEliminar.titulo || "Capacitación"}"`,
        categoria: "Capacitaciones",
        editor: keycloak?.tokenParsed?.name || "Editor CMS",
        estado: "ELIMINADO",
      });
      toast.success("Capacitación eliminada correctamente.");
      await cargarCapacitaciones();
    } catch (error) {
      console.error("Error al eliminar capacitación:", error);
      toast.error(mensajeDeError(error, "No se pudo eliminar la capacitación."));
    } finally {
      setShowDeleteModal(false);
      setItemAEliminar(null);
    }
  };

  // Filtrado de datos
  // Cantidad por filtro (lo publicado con una actualización en revisión cuenta también como publicado).
  const cuentas = { PUBLICADOS: 0, PENDIENTES: 0, RECHAZADOS: 0, BORRADORES: 0, ARCHIVADOS: 0 };
  capacitaciones.forEach((item) => {
    if (estaPublicadoEnPortal(item)) cuentas.PUBLICADOS++;
    if (item.estado === "PENDIENTE_APROBACION") cuentas.PENDIENTES++;
    else if (item.estado === "RECHAZADO") cuentas.RECHAZADOS++;
    else if (item.estado === "BORRADOR") cuentas.BORRADORES++;
    else if (item.estado === "ARCHIVADO") cuentas.ARCHIVADOS++;
  });

  const datosFiltrados = capacitaciones.filter((item) => {
    const matchEstado =
      activeTab === "TODOS"
        ? true
        : activeTab === "PUBLICADOS"
        ? estaPublicadoEnPortal(item)
        : activeTab === "PENDIENTES"
        ? item.estado === "PENDIENTE_APROBACION"
        : activeTab === "RECHAZADOS"
        ? item.estado === "RECHAZADO"
        : activeTab === "BORRADORES"
        ? item.estado === "BORRADOR"
        : item.estado === "ARCHIVADO";

    const matchModalidad =
      filtroModalidad === "TODAS" ? true : item.modalidad === filtroModalidad;

    const query = searchTerm.toLowerCase().trim();
    const matchSearch =
      !query ||
      item.titulo.toLowerCase().includes(query) ||
      (item.disertantes && item.disertantes.toLowerCase().includes(query)) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(query)) ||
      (item.ubicacion && item.ubicacion.toLowerCase().includes(query));

    return matchEstado && matchModalidad && matchSearch;
  });

  return (
    <>
      <div style={{ marginBottom: "18px" }}>
        <FiltrosEstado
                  activa={activeTab}
                  onCambiar={setActiveTab}
                  todos
                  onActualizar={cargarCapacitaciones}
                  opciones={[
                    { clave: "PENDIENTES", tipo: "pendiente", cuenta: cuentas.PENDIENTES },
                    { clave: "PUBLICADOS", tipo: "publicado", cuenta: cuentas.PUBLICADOS },
                    { clave: "RECHAZADOS", tipo: "rechazado", cuenta: cuentas.RECHAZADOS },
                    { clave: "BORRADORES", tipo: "borrador", cuenta: cuentas.BORRADORES },
                    { clave: "ARCHIVADOS", tipo: "archivado", cuenta: cuentas.ARCHIVADOS },
                  ]}
                />
      </div>

      <div className="cms-dashboard-card">
      {/* Cabecera idéntica a Noticias, Profesionales y Residencias */}
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado de capacitaciones
          </h3>
          <p className="news-view-subtitle">
            Administre los cursos, talleres, material formativo y jornadas institucionales del hospital.
          </p>
        </div>
      </div>

      

      <BarraFiltros
        crear={{ texto: "+ AÑADIR CAPACITACIÓN", onClick: handleOpenCreate }}
        busqueda={{ etiqueta: "Buscar capacitación", placeholder: "Buscar por título o contenido...", valor: searchTerm, onCambio: setSearchTerm }}
        select={{
          etiqueta: "Modalidad",
          valor: filtroModalidad,
          onCambio: setFiltroModalidad,
          opciones: [
            { valor: "TODAS", texto: "Todas las modalidades" },
            { valor: "Presencial", texto: "Presencial" },
            { valor: "Virtual", texto: "Virtual / On-Demand" },
            { valor: "Híbrida", texto: "Híbrida" },
          ],
        }}
      />

      {/* Contenedor de la tabla idéntico al estilo de Profesionales y Noticias */}
      <div className="cms-news-table-container">
        <div
          className="activity-table-head news-table-head"
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <div style={{ flex: 1.8 }}>CAPACITACIÓN Y TEMÁTICA</div>
          <div style={{ flex: 1 }}>MODALIDAD</div>
          <div style={{ flex: 1.2 }}>FECHA Y LUGAR</div>
          <div style={{ width: "200px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "100px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Cargando capacitaciones...
              </span>
            </div>
          ) : datosFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No se encontraron capacitaciones registradas con este criterio.
            </div>
          ) : (
            vistaPublicados(datosFiltrados, activeTab === "PUBLICADOS").map((item) => (
              <div
                className="activity-row news-table-row"
                key={item.id}
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {/* Columna CAPACITACIÓN con thumbnail interactivo */}
                <div
                  className="col-content"
                  style={{
                    flex: 1.8,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div className="news-thumb-box">
                    {item.imagenUrl ? (
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="news-thumb-img"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="news-thumb-mock">
                        {getInicialesCapacitacion(item.titulo)}
                      </div>
                    )}
                  </div>
                  <div className="news-title-interactive" onClick={() => handleOpenEdit(item)} role="button" tabIndex={0} onKeyDown={(e) => activarConTeclado(e, () => handleOpenEdit(item))}>
                    <span
                      className="activity-title"
                      style={{
                        fontWeight: "600",
                        color: "#0c2340",
                        fontSize: "0.95rem",
                        display: "block",
                      }}
                    >
                      {tituloEnLista(item, activeTab === "PUBLICADOS", item.titulo)}
                    </span>
                    {item.disertantes && (
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#0284c7",
                          fontWeight: "500",
                          marginTop: "2px",
                          display: "block",
                        }}
                      >
                        Dictado por: {item.disertantes}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginTop: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        {item.descripcion && item.descripcion.length > 55
                          ? `${item.descripcion.substring(0, 55)}...`
                          : item.descripcion || "Formación médica continua"}
                      </span>
                      {(item.archivoTipo === "video" || item.videoUrl) && (
                        <span className="cap-resource-pill video">
                          <PlayCircle size={11} /> Video
                        </span>
                      )}
                      {(item.archivoTipo === "documento" || (item.archivoNombre && !item.archivoNombre.match(/\.(png|jpg|jpeg|webp|mp4|webm)$/i))) && (
                        <span className="cap-resource-pill pdf">
                          <FileText size={11} /> PDF/DOC
                        </span>
                      )}
                      {(item.archivoTipo === "imagen" || (item.archivoNombre && item.archivoNombre.match(/\.(png|jpg|jpeg|webp)$/i))) && (
                        <span className="cap-resource-pill link">
                          <ImageIcon size={11} /> Infografía
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Columna MODALIDAD */}
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <span
                    className={`badge-modalidad ${
                      item.modalidad === "Virtual"
                        ? "virtual"
                        : item.modalidad === "Híbrida"
                        ? "hibrida"
                        : "presencial"
                    }`}
                  >
                    {item.modalidad === "Virtual" ? (
                      <Globe size={13} />
                    ) : item.modalidad === "Híbrida" ? (
                      <Users size={13} />
                    ) : (
                      <BookOpen size={13} />
                    )}
                    {item.modalidad}
                  </span>
                </div>

                {/* Columna FECHA Y LUGAR */}
                <div
                  className="col-area"
                  style={{
                    flex: 1.2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#0c2340", fontWeight: "600", fontSize: "0.88rem" }}>
                    {item.fechaInicio || "Fecha a confirmar"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginTop: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{item.horario || "10:00 hs."}</span>
                    <span>•</span>
                    <span title={item.ubicacion}>
                      {item.ubicacion && item.ubicacion.length > 24
                        ? `${item.ubicacion.substring(0, 24)}...`
                        : item.ubicacion || "Hospital Evita"}
                    </span>
                  </span>
                </div>

                {/* Columna ESTADO INTERACTIVO */}
                <div
                  style={{
                    width: "200px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {item.solicitudEliminacion && activeTab !== "PUBLICADOS" ? (
<EtiquetaEliminacion />
) : (
<>
{(item.estadoVista || item.estado) === "PENDIENTE_APROBACION" || (item.estadoVista || item.estado) === "RECHAZADO" ? (
                    <span title={(item.estadoVista || item.estado) === "RECHAZADO" ? item.motivoRechazo || "" : undefined}>
                      <EtiquetaEstado
                        estado={(item.estadoVista || item.estado)}
                        texto={
                          (item.estadoVista || item.estado) === "RECHAZADO"
                            ? "Rechazado"
                            : item.requestedEstado === "ARCHIVADO"
                            ? "Archivado solicitado"
                            : item.requestedEstado === "BORRADOR"
                            ? "Retiro solicitado"
                            : textoDeEstado(item.estadoVista || item.estado)
                        }
                      />
                    </span>
                  ) : (
                    <EtiquetaEstado
                      estado={(item.estadoVista || item.estado)}
                      texto={textoDeEstado(item.estadoVista || item.estado)}
                    />
                  )}
                  {item.estado === "RECHAZADO" && item.motivoRechazo && (
                    <span className="cap-motivo-rechazo">Motivo: {item.motivoRechazo}</span>
                  )}
                  <SiguePublicado item={item} activo={activeTab === "PUBLICADOS"} />
                  {item.solicitudEliminacion && (
                    <div style={{ marginTop: "4px" }}>
                      <EtiquetaEliminacion nota />
                    </div>
                  )}
</>
)}
                </div>

                {/* Columna ACCIONES */}
                <div
                  className="news-actions-cell"
                  style={{
                    width: "100px",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="news-action-btn-edit"
                    title="Editar capacitación"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(item)}
                    className="news-action-btn-delete"
                    title="Eliminar capacitación"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE ALTA / EDICIÓN (ARMONIZADO CON CMSMODALS) */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div
            className="modal-content-esp esp-modal-wrapper"
            style={{ maxWidth: "840px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar Capacitación" : "Nueva Capacitación"}</h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseAttempt}
                aria-label="Cerrar modal"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div className="esp-modal-body">
                <div className="esp-form-grid">
                  {/* Título de la Capacitación */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Título de la Capacitación / Jornada <span className="esp-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => {
                        setFormData({ ...formData, titulo: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Abordaje Inicial del ACV Isquémico en Guardia"
                      required
                    />
                  </div>

                  {/* Estado de Publicación (luego del título) */}
                  <div>
                    <label className="esp-form-label">
                      Estado de la Capacitación <span className="esp-asterisk">*</span>
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => {
                        setFormData({ ...formData, estado: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      style={{ fontWeight: "600" }}
                    >
                      {!editandoPublicado && <option value="BORRADOR">Borrador</option>}
                      <option value="PUBLICADO">Publicado</option>
                      <option value="ARCHIVADO">
                        {editandoPublicado ? "Archivar (pedir retiro del portal)" : "Archivado"}
                      </option>
                    </select>
                  </div>

                  {/* Modalidad de Dictado */}
                  <div>
                    <label className="esp-form-label">Modalidad de Dictado</label>
                    <select
                      value={formData.modalidad}
                      onChange={(e) => {
                        setFormData({ ...formData, modalidad: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Virtual">Virtual / On-Demand</option>
                      <option value="Híbrida">Híbrida (Presencial y Virtual)</option>
                    </select>
                  </div>

                  {/* Fecha de Inicio */}
                  <div>
                    <label className="esp-form-label">Fecha de Inicio / Encuentro</label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => {
                        setFormData({ ...formData, fechaInicio: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    />
                  </div>

                  {/* Fecha de Fin (Opcional) */}
                  <div>
                    <label className="esp-form-label">Fecha de Finalización (Opcional)</label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => {
                        setFormData({ ...formData, fechaFin: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    />
                  </div>

                  {/* Horario (mismo formato tipo tiempo que la fecha) */}
                  <div>
                    <label className="esp-form-label">Horario</label>
                    <input
                      type="time"
                      value={formData.horario}
                      onChange={(e) => {
                        setFormData({ ...formData, horario: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                    />
                  </div>

                  {/* Ubicación o Plataforma */}
                  <div>
                    <label className="esp-form-label">Lugar / Plataforma</label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => {
                        setFormData({ ...formData, ubicacion: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: SUM Hospital Evita o Zoom / Telesalud"
                    />
                  </div>

                  {/* Nombres de quienes dictan la capacitación (Opcional) */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Disertantes / Docentes a cargo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.disertantes}
                      onChange={(e) => {
                        setFormData({ ...formData, disertantes: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: Dr. Marcelo Morales, Dra. Elena Vega (Nombres de quienes dictan la capacitación)"
                    />
                  </div>

                  {/* Enlace de Video Online (Opcional) */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">
                      Enlace a Video / Clase Virtual (YouTube, Vimeo o URL directa)
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl && !formData.videoUrl.startsWith("blob:") ? formData.videoUrl : ""}
                      onChange={(e) => {
                        setFormData({ ...formData, videoUrl: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      placeholder="Ej: https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                    />
                  </div>

                  {/* Descripción breve (Copete) */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Descripción Breve (Resumen para la tarjeta)</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => {
                        setFormData({ ...formData, descripcion: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="2"
                      placeholder="Resumen introductorio que acompaña la tarjeta en el portal público..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Contenido / Temario detallado */}
                  <div className="esp-full-width">
                    <label className="esp-form-label">Temario y Contenidos Académicos</label>
                    <textarea
                      value={formData.contenido}
                      onChange={(e) => {
                        setFormData({ ...formData, contenido: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="esp-form-input"
                      rows="3"
                      placeholder="Detalle de módulos, ejes temáticos, disertantes y metodología de evaluación..."
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* CAMPO 1: BANNER / PORTADA DE LA TARJETA */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <ImageIcon size={16} color="#0c2340" />
                        <strong>Banner / Portada de la Tarjeta</strong>
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal" }}>
                        Opcional • JPG, PNG, WEBP (Recomendado 1200x600 px)
                      </span>
                    </label>

                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) procesarBanner(file);
                      }}
                      style={{ display: "none" }}
                    />

                    {bannerPreview || formData.bannerUrl ? (
                      <div className="cap-banner-preview-card">
                        <div className="cap-banner-preview-left">
                          <img
                            src={bannerPreview || formData.bannerUrl}
                            alt="Banner previa"
                            className="cap-banner-preview-thumb"
                          />
                          <div className="cap-banner-preview-info">
                            <span className="cap-banner-preview-title" title={formData.bannerNombre || "Banner de portada"}>
                              {formData.bannerNombre || "Banner_Portada_Capacitacion.jpg"}
                            </span>
                            <span className="cap-banner-preview-sub">
                              <span className="cap-banner-badge">PORTADA ACTIVA</span>
                              <span>• Portada visible en la tarjeta y cabecera</span>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => bannerInputRef.current?.click()}
                            title="Cambiar imagen de portada"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={handleQuitarBanner}
                            title="Quitar portada"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`cap-banner-upload-zone ${isDraggingBanner ? "drag-active" : ""}`}
                        onClick={() => bannerInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => activarConTeclado(e, () => bannerInputRef.current?.click())}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingBanner(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) procesarBanner(f);
                        }}
                      >
                        <div className="cap-banner-icon-wrap">
                          <ImageIcon size={22} />
                        </div>
                        <p className="res-file-upload-title" style={{ color: "#0c2340", fontWeight: "700" }}>
                          Cargar Imagen de Portada / Banner
                        </p>
                        <p className="res-file-upload-sub">
                          Arrastrá la imagen aquí o <strong>hacé clic para examinar</strong> (Imagen que viste la tarjeta y la cabecera del modal público)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CAMPO 2: ARCHIVO DE CONTENIDO / MATERIAL DIDÁCTICO */}
                  <div className="esp-full-width">
                    <label
                      className="esp-form-label"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileText size={16} color="#0c2340" />
                        <strong>Material Didáctico Adjunto (Contenido)</strong>
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal" }}>
                        Opcional • Video MP4, Documento PDF/DOC o Infografía complementaria
                      </span>
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) procesarArchivoUnificado(file);
                      }}
                      style={{ display: "none" }}
                    />

                    {formData.archivoNombre ? (
                      <div className="res-file-selected-card">
                        <div className="res-file-selected-left">
                          <div
                            className="res-file-type-icon"
                            style={{
                              backgroundColor:
                                formData.archivoTipo === "video"
                                  ? "#fee2e2"
                                  : formData.archivoTipo === "imagen"
                                  ? "#fef3c7"
                                  : "#e0f2fe",
                              color:
                                formData.archivoTipo === "video"
                                  ? "#dc2626"
                                  : formData.archivoTipo === "imagen"
                                  ? "#d97706"
                                  : "#0284c7",
                            }}
                          >
                            {formData.archivoTipo === "video" ? (
                              <Video size={18} />
                            ) : formData.archivoTipo === "imagen" ? (
                              <ImageIcon size={18} />
                            ) : (
                              <FileText size={18} />
                            )}
                          </div>
                          <div className="res-file-meta">
                            <span className="res-file-name" title={formData.archivoNombre}>
                              {formData.archivoNombre}
                            </span>
                            <span className="res-file-size">
                              {formData.archivoTamano || "Archivo adjunto"} •{" "}
                              {formData.archivoTipo === "video"
                                ? "Video Multimedia de la Clase"
                                : formData.archivoTipo === "imagen"
                                ? "Infografía / Imagen de Contenido"
                                : "Documento Descargable"}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Reemplazar archivo"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            className="res-file-remove-btn"
                            onClick={handleQuitarArchivo}
                            title="Quitar archivo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`res-file-upload-zone ${isDraggingFile ? "drag-active" : ""}`}
                        onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => activarConTeclado(e, () => fileInputRef.current?.click())}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) procesarArchivoUnificado(f);
                        }}
                      >
                        <div className="res-file-icon-wrap">
                          <Upload size={20} />
                        </div>
                        <p className="res-file-upload-title">
                          Cargar Video, Documento o Infografía Didáctica
                        </p>
                        <p className="res-file-upload-sub">
                          Arrastrá el archivo aquí o <strong>hacé clic para examinar</strong> (Video MP4/WEBM, Documento PDF/DOC o Imagen de contenido didáctico)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer del Modal */}
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
                  disabled={isSaving || (Boolean(editingId) && !hasUnsavedChanges)}
                  title={editingId && !hasUnsavedChanges ? "No se han detectado cambios para actualizar" : ""}
                >
                  {isSaving ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        className="cms-spinner"
                        style={{
                          width: "16px",
                          height: "16px",
                          borderWidth: "2px",
                          borderTopColor: "white",
                          borderColor: "rgba(255,255,255,0.3)",
                        }}
                      ></div>
                      GUARDANDO...
                    </span>
                  ) : editingId ? (
                    "ACTUALIZAR"
                  ) : (
                    "GUARDAR"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CAMBIOS SIN GUARDAR (UNIFICADO) */}
      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => handleSave(e, "BORRADOR")}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (UNIFICADO) */}
      <CmsDeleteModal
        isOpen={showDeleteModal && !!itemAEliminar}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        itemName={itemAEliminar?.titulo}
        itemType="la capacitación"
        requiereAprobacion={requiereAprobacionParaEliminar(itemAEliminar)}
      />
      </div>
    </>
  );
};

export default CmsCapacitacionesView;
