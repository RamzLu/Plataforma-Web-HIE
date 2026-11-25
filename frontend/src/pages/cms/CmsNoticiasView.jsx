import EtiquetaCategoria from "../../components/ui/EtiquetaCategoria";
import { mensajeDeError } from "../../utils/mensajeDeError";
import Paginacion from "../../components/ui/Paginacion";
import { usePaginacion } from "../../hooks/usePaginacion";
import React, { useState } from "react";
import { CalendarDays } from "lucide-react";
import { sanitizeHtml } from "../../utils/sanitizeHtml.js";
import { createNoticia, updateNoticia, deleteNoticia } from "../../api/noticias.api.js";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import avatarHospital from "../../assets/logoHospitalEvita.png";
import DefaultNewsImage from "../../components/ui/DefaultNewsImage";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import keycloak from "../../config/keycloak";
import toast from "react-hot-toast";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isToday } from "date-fns";
import es from "date-fns/locale/es";

import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  BlockQuote,
  Undo,
  Alignment,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import "../../styles/pages/cms/CmsNoticiasView.css";
import {
  CmsDeleteModal,
  CmsConfirmDraftModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";
import { activarConTeclado } from "../../utils/accesibilidad.js";
import SiguePublicado from "../../components/cms/SiguePublicado";
import { EtiquetaEliminacion } from "../../components/admin/SolicitudEliminacionAcciones";
import { estaPublicadoEnPortal, requiereAprobacionParaEliminar, tituloEnLista, vistaPublicados, esDescartable } from "../../utils/publicacion.js";
import EtiquetaEstado from "../../components/ui/EtiquetaEstado";
import { textoDeEstado } from "../../components/ui/estados.js";
import FiltrosEstado from "../../components/ui/FiltrosEstado";
import { usePapelera } from "../../hooks/usePapelera";
import { AccionesPapelera, BotonADescartar, NotaPapelera, AvisoPapelera } from "../../components/cms/Papelera";
import { descartarNoticia, restaurarNoticia } from "../../api/noticias.api.js";
import BarraFiltros from "../../components/ui/BarraFiltros";
import { useCambiosReales, formatoHtml } from "../../hooks/useCambiosReales";

registerLocale("es", es);

const CATEGORIAS = ["General", "Cáncer de Mama", "Tu Corazón", "Donación", "Dengue"];

const CustomScheduleInput = React.forwardRef(
  ({ value, onClick, icon, placeholder, isDate }, ref) => {
    let displayValue = value || placeholder;

    if (isDate && value) {
      const [dia, mes, anio] = value.split("/");
      const dateObj = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      if (!isNaN(dateObj) && isToday(dateObj)) {
        displayValue = "Hoy";
      }
    }

    return (
      <button className="schedule-custom-btn" onClick={onClick} ref={ref} type="button">
        <span className="schedule-icon">{icon}</span>
        <span className="schedule-text">{displayValue}</span>
        <svg
          className="schedule-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    );
  }
);

const CmsNoticiasView = ({
  newsList,
  onAddNewNews,
  onDeleteNews,
  onUpdateNews,
  onViewNews,
  loading,
  onRefresh,
  initialCreateModal = false,
  onModalOpened,
}) => {
  const [viewTab, setViewTab] = useState("PUBLICADO");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  // Si se llegó desde un acceso rápido del dashboard, el modal de crear arranca abierto
  // (los demás campos ya empiezan con los valores de un contenido nuevo).
  const [showModal, setShowModal] = useState(Boolean(initialCreateModal));
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [correctionNews, setCorrectionNews] = useState(null);

  const [titulo, setTitulo] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [categoria, setCategoria] = useState("General");
  // Igual que handleOpenCreate cuando el modal de crear arranca abierto desde el dashboard.
  const [estado, setEstado] = useState(initialCreateModal ? "PUBLICADO" : "BORRADOR");
  const [fechaProgramada, setFechaProgramada] = useState(null);
  const [imagenesUrls, setImagenesUrls] = useState([]);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);

  // Cambios reales: si se edita algo y se vuelve a dejar como estaba, el botón de guardar se vuelve a deshabilitar.
  // El cuerpo se compara como el backend: con formato (una negrita es un cambio) pero sin contar espacios.
  const hayCambios = useCambiosReales(hasUnsavedChanges, {
    titulo,
    cuerpoHtml: formatoHtml(cuerpoHtml),
    categoria,
    estado,
    fechaProgramada,
    imagenesUrls,
    archivosSeleccionados,
  });
  const [saving, setSaving] = useState(false);

  const [noticiaAEliminar, setNoticiaAEliminar] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Papelera de lo rechazado: mandar a la Papelera y restaurar (solo el CM; se vacía sola a los 15 días).
  const papelera = usePapelera({
    descartar: (item) => descartarNoticia(item.id),
    restaurar: (item) => restaurarNoticia(item.id),
    recargar: async () => {
      if (onRefresh) await onRefresh();
    },
  });

  // Cantidad por filtro (lo publicado con una actualización en revisión cuenta también como publicado).
  const cuentas = { PAPELERA: 0, PUBLICADO: 0, BORRADOR: 0, PENDIENTE_APROBACION: 0, PROGRAMADO: 0, RECHAZADO: 0 };
  (newsList || []).forEach((n) => {
    if (n.enPapelera) {
      cuentas.PAPELERA++;
      return;
    }
    const e = n.estado ? n.estado.toUpperCase() : n.isDraft ? "BORRADOR" : "PUBLICADO";
    if (estaPublicadoEnPortal(n)) cuentas.PUBLICADO++;
    if (e in cuentas && e !== "PUBLICADO") cuentas[e]++;
  });

  const filteredNews = (newsList || []).filter((n) => {
    if (viewTab === "PAPELERA" ? !n.enPapelera : n.enPapelera) return false;
    const estadoItem = n.estado
      ? n.estado.toUpperCase()
      : n.isDraft
      ? "BORRADOR"
      : "PUBLICADO";

    const matchEstado =
      viewTab === "TODOS" || viewTab === "PAPELERA"
        ? true
        : viewTab === "PUBLICADO"
        ? estaPublicadoEnPortal(n)
        : estadoItem === viewTab;

    const matchCategoria =
      filtroCategoria === "Todas" || n.category === filtroCategoria;
    const matchBusqueda = !busqueda || String(n.title || "").toLowerCase().includes(busqueda.trim().toLowerCase());
    return matchEstado && matchCategoria && matchBusqueda;
  });
  const paginacion = usePaginacion(vistaPublicados(filteredNews, viewTab === "PUBLICADO"), 10, [viewTab, filtroCategoria, busqueda]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCorrectionNews(null);
    setTitulo("");
    setCuerpoHtml("");
    setCategoria("General");
    setEstado("PUBLICADO");
    setFechaProgramada(null);
    setImagenesUrls([]);
    setArchivosSeleccionados([]);
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  // El modal ya arrancó abierto (ver el estado inicial de showModal): solo se avisa al panel para que no lo reabra.
  React.useEffect(() => {
    if (initialCreateModal && onModalOpened) onModalOpened();
  }, [initialCreateModal, onModalOpened]);

  const handleOpenEdit = (news) => {
    setEditingId(news.id);
    setCorrectionNews(null);
    setTitulo(news.title || "");

    const contenidoCrudo = news.body?.[0] || news.contenido || "";
    setCuerpoHtml(
      typeof contenidoCrudo === "string" ? contenidoCrudo : String(contenidoCrudo)
    );

    setCategoria(news.category || "General");
    const rawEstado = news.estado
      ? news.estado.toUpperCase()
      : news.isDraft
      ? "BORRADOR"
      : "PUBLICADO";

    setEstado(
      rawEstado === "BORRADOR" ||
        (rawEstado === "PENDIENTE_APROBACION" && news.requestedEstado === "BORRADOR")
        ? "BORRADOR"
        : news.fechaPublicacion
        ? "PROGRAMADO"
        : "PUBLICADO"
    );
    setImagenesUrls(news.images || []);
    setArchivosSeleccionados([]);
    setHasUnsavedChanges(false);
    setShowModal(true);

    if (news.fechaPublicacion) {
      setFechaProgramada(new Date(news.fechaPublicacion));
    } else {
      setFechaProgramada(null);
    }
  };

  
  const handleOpenCorrection = (news) => {
    setEditingId(news.id);
    setCorrectionNews(news);
    setTitulo(news.title || "");

    const contenidoCrudo = news.body?.[0] || news.contenido || "";
    setCuerpoHtml(
      typeof contenidoCrudo === "string" ? contenidoCrudo : String(contenidoCrudo)
    );

    setCategoria(news.category || "General");
    setEstado(news.fechaPublicacion ? "PROGRAMADO" : "PUBLICADO");
    setImagenesUrls(news.images || []);
    setArchivosSeleccionados([]);
    setFechaProgramada(news.fechaPublicacion ? new Date(news.fechaPublicacion) : null);
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleCloseAttempt = () => {
    if (saving) return;
    if (hayCambios) {
      setShowUnsavedModal(true);
    } else {
      setShowModal(false);
      setCorrectionNews(null);
    }
  };

  const handleForceClose = () => {
    setShowUnsavedModal(false);
    setShowModal(false);
    setCorrectionNews(null);
    setHasUnsavedChanges(false);
  };

  const handleConfirmDeleteClick = (id) => {
    setNoticiaAEliminar(id);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    if (!noticiaAEliminar) return;
    const id = noticiaAEliminar;
    setDeletingId(id);

    try {
      if (!keycloak.token) {
        toast.error("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      const noticia =
        (filteredNews || []).find((n) => n.id === id) ||
        (newsList || []).find((n) => n.id === id);
      const tituloNoticia = noticia?.title || noticia?.titulo || "Noticia";

      const respuesta = await deleteNoticia(id);
      // Si el contenido está publicado, el backend no lo borra: queda una solicitud para el administrador.
      if (respuesta?.solicitudEliminacion) {
        toast.success(respuesta.message, { duration: 6000 });
        setShowDeleteModal(false);
        setNoticiaAEliminar(null);
        // El pedido queda registrado en el servidor: se vuelve a pedir la lista para que la fila lo muestre.
        if (onRefresh) onRefresh();
        return;
      }
      recordCmsActivity({
        titulo: `Eliminó noticia: "${tituloNoticia}"`,
        categoria: noticia?.category || "Noticias",
        editor: keycloak?.tokenParsed?.name || "Editor CMS",
        estado: "ELIMINADO",
      });
      onDeleteNews(id);
      toast.success("Noticia eliminada correctamente.");
      setShowDeleteModal(false);
      setNoticiaAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar noticia:", error);
      toast.error(
        mensajeDeError(error, "Ocurrió un error al intentar eliminar la noticia.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setHasUnsavedChanges(true);
      const newUrls = files.map((file) => URL.createObjectURL(file));
      setImagenesUrls((prev) => [...prev, ...newUrls]);
      setArchivosSeleccionados((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setHasUnsavedChanges(true);
    const targetUrl = imagenesUrls[indexToRemove];
    if (String(targetUrl).startsWith("blob:")) {
      
      const blobIndex = imagenesUrls
        .slice(0, indexToRemove)
        .filter((u) => String(u).startsWith("blob:")).length;
      setArchivosSeleccionados((prev) => prev.filter((_, idx) => idx !== blobIndex));
    }
    setImagenesUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e, forcedEstado, bypassDraftWarning = false) => {
    if (e) e.preventDefault();

    if ((editingId || correctionNews) && !hayCambios) {
      toast.error("No se han detectado cambios para actualizar.");
      setShowUnsavedModal(false);
      return;
    }

    const textoContenido =
      typeof cuerpoHtml === "string"
        ? cuerpoHtml
        : Array.isArray(cuerpoHtml)
        ? cuerpoHtml[0] || ""
        : String(cuerpoHtml || "");
    const estadoSolicitado = forcedEstado || estado;
    const estadoFinal = estadoSolicitado;

    if (estadoSolicitado === "PROGRAMADO" && !fechaProgramada) {
      toast.error("Por favor, selecciona una fecha y hora para programar la publicación.");
      setShowUnsavedModal(false);
      return;
    }

    if (!titulo.trim() || !textoContenido.replace(/<[^>]+>/g, "").trim()) {
      toast.error("Por favor completa el título y el contenido.");
      setShowUnsavedModal(false);
      return;
    }

    if (estadoSolicitado === "BORRADOR" && !bypassDraftWarning) {
      setShowConfirmDraftModal(true);
      return;
    }

    setSaving(true);

    try {
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      if (!keycloak.token) {
        toast.error("Tu sesión ha expirado.");
        keycloak.login();
        return;
      }

      const remoteUrls = imagenesUrls.filter((u) => !String(u).startsWith("blob:"));

      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("contenido", textoContenido);
      formData.append("estado", estadoSolicitado);
      formData.append("categoriaNombre", categoria);
      formData.append("imagenesExistentes", JSON.stringify(remoteUrls));

      if (estadoSolicitado === "PROGRAMADO" && fechaProgramada) {
        formData.append("fechaPublicacion", fechaProgramada.toISOString());
      }

      archivosSeleccionados.forEach((file) => {
        formData.append("imagenes", file);
      });

      const formatEstadoNombre = (est) => {
        const upper = String(est || "").toUpperCase().trim();
        if (upper === "BORRADOR") return "Borrador";
        if (upper === "PUBLICADO") return "Publicado";
        if (upper === "PROGRAMADO") return "Programado";
        if (upper === "ARCHIVADO") return "Archivado";
        return est;
      };

      const prevNoticia = editingId
        ? (newsList || []).find((n) => String(n.id) === String(editingId))
        : null;

      let accionTitulo = "";
      if (editingId) {
        const prevEstado = prevNoticia?.estado ? String(prevNoticia.estado).toUpperCase() : null;
        const nuevoEstado = String(estadoFinal).toUpperCase();

        if (prevEstado && prevEstado !== nuevoEstado) {
          accionTitulo = `Actualizó estado de "${titulo}" (${formatEstadoNombre(prevEstado)} a ${formatEstadoNombre(nuevoEstado)})`;
        } else if (nuevoEstado === "BORRADOR") {
          accionTitulo = `Actualizó contenido de borrador "${titulo}"`;
        } else {
          accionTitulo = `Actualizó contenido de noticia "${titulo}"`;
        }
      } else {
        if (String(estadoFinal).toUpperCase() === "BORRADOR") {
          accionTitulo = `Creó borrador: "${titulo}"`;
        } else if (String(estadoFinal).toUpperCase() === "PROGRAMADO") {
          accionTitulo = `Programó noticia "${titulo}"`;
        } else {
          accionTitulo = `Publicó noticia "${titulo}"`;
        }
      }

      let data;
      if (editingId) {
        data = await updateNoticia(editingId, formData);
        const estadoDevuelto = (data.data?.estado || "").toUpperCase();
        if (estadoSolicitado === "BORRADOR" && estadoDevuelto === "PENDIENTE_APROBACION") {
          toast.success(
            "Solicitud para pasar la noticia a Borrador enviada al administrador para su aprobación."
          );
        } else if (correctionNews) {
          toast.success(
            estadoDevuelto === "BORRADOR"
              ? "Cambios guardados como borrador."
              : "Noticia corregida y reenviada a aprobación del administrador."
          );
        } else {
          toast.success(
            estadoDevuelto === "BORRADOR"
              ? "Borrador actualizado con éxito."
              : "Noticia enviada a revisión del administrador para su aprobación."
          );
        }
      } else {
        data = await createNoticia(formData);
        const estadoDevuelto = (data.data?.estado || "").toUpperCase();
        toast.success(
          estadoDevuelto === "BORRADOR"
            ? "Borrador guardado con éxito."
            : "Noticia creada y enviada al administrador para su aprobación."
        );
      }

const estadoGuardado = data.data?.estado || "PENDIENTE_APROBACION";

      const catSlugMap = {
        "cáncer de mama": "cancer-mama",
        "cancer de mama": "cancer-mama",
        "tu corazón": "tu-corazon",
        "tu corazon": "tu-corazon",
        "donación": "donacion",
        "donacion": "donacion",
        "dengue": "dengue"
      };
      const catKey = (categoria || "").trim().toLowerCase();
      if (catSlugMap[catKey]) {
        localStorage.removeItem(`visited_${catSlugMap[catKey]}`);
      }

      const editorResponsable = keycloak?.tokenParsed?.name || "Editor CMS";
      recordCmsActivity({
        titulo: accionTitulo,
        categoria: categoria || "Noticias",
        editor: editorResponsable,
        estado: estadoFinal,
        timestamp: Date.now(),
        newsId: String(data.data?.id || editingId),
      });

      const noticiaFormateada = {
        id: data.data?.id || editingId,
        title: titulo,
        body: [textoContenido],
date: data.data?.createdAt
          ? new Date(data.data.createdAt).toLocaleDateString("es-AR")
          : new Date().toLocaleDateString("es-AR"),
        createdAt: data.data?.createdAt || prevNoticia?.createdAt || new Date().toISOString(),
        updatedAt: data.data?.updatedAt || new Date().toISOString(),
        category: categoria || "General",
        estado: estadoGuardado,
        requestedEstado: data.data?.requestedEstado || null,
        previousEstado: data.data?.previousEstado || null,
        isDraft: estadoGuardado === "BORRADOR",
        images: data.data?.images || imagenesUrls || [],
editor: data.data?.editor || prevNoticia?.editor || editorResponsable,
        editedBy: editingId ? (data.data?.editedBy || editorResponsable) : null,
        fechaPublicacion: data.data?.fechaPublicacion || null,
        rejectionReason: data.data?.rejectionReason || null,
        actionTitle: accionTitulo,
      };

      if (editingId) {
        if (onUpdateNews) onUpdateNews(noticiaFormateada);
      } else {
        if (onAddNewNews) onAddNewNews(noticiaFormateada);
      }
      // La lista se vuelve a pedir: lo que devuelve el guardado no trae todo (versión publicada, pedidos pendientes).
      if (onRefresh) onRefresh();

      setViewTab(estadoGuardado);
      setHasUnsavedChanges(false);
      setShowUnsavedModal(false);
      setShowConfirmDraftModal(false);
      setCorrectionNews(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error al guardar noticia:", error);
      toast.error(
        `Error: ${
          mensajeDeError(error, "Error al guardar")
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const editingOriginalNews = editingId
    ? newsList.find((n) => String(n.id) === String(editingId))
    : null;
  const editingWasPublished = Boolean(
    editingOriginalNews &&
      (["PUBLICADO", "APROBADO", "PROGRAMADO"].includes(
        (editingOriginalNews.estado || "").toUpperCase()
      ) ||
        ["PUBLICADO", "APROBADO", "PROGRAMADO"].includes(
          (editingOriginalNews.previousEstado || "").toUpperCase()
        ))
  );

  return (
    <>
      <div style={{ marginBottom: "18px" }}>
        <FiltrosEstado
                    activa={viewTab}
                    onCambiar={setViewTab}
                    todos
                    onActualizar={onRefresh}
                    actualizando={loading}
                    opciones={[
                      { clave: "PENDIENTE_APROBACION", tipo: "pendiente", cuenta: cuentas.PENDIENTE_APROBACION },
                      { clave: "PUBLICADO", tipo: "publicado", cuenta: cuentas.PUBLICADO },
                      { clave: "PROGRAMADO", tipo: "programado", cuenta: cuentas.PROGRAMADO },
                      { clave: "RECHAZADO", tipo: "rechazado", cuenta: cuentas.RECHAZADO },
                      { clave: "BORRADOR", tipo: "borrador", cuenta: cuentas.BORRADOR },
                      { clave: "PAPELERA", tipo: "papelera", cuenta: cuentas.PAPELERA },
          ]}
                  />
      </div>

      <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">Listado de las noticias</h3>
          <p className="news-view-subtitle">
            Administre las publicaciones y artículos clasificados del portal.
          </p>
        </div>
      </div>

      <BarraFiltros
        crear={{ texto: "+ AÑADIR NOTICIA", onClick: handleOpenCreate }}
          busqueda={{ etiqueta: "Buscar noticia", placeholder: "Buscar por título...", valor: busqueda, onCambio: setBusqueda }}
          select={{
            etiqueta: "Clasificación",
            valor: filtroCategoria,
            onCambio: setFiltroCategoria,
            opciones: [{ valor: "Todas", texto: "Todas las clasificaciones" }, ...CATEGORIAS.map((c) => ({ valor: c, texto: c }))],
          }}
        />

      {viewTab === "PAPELERA" && <AvisoPapelera />}
<div className="cms-news-table-container">
        <div className="news-table-head">
          <div className="col-content">CONTENIDO</div>
          <div className="col-editor">EDITOR / FECHA</div>
          <div className="col-categoria">CLASIFICACIÓN</div>
          <div className="col-estado">ESTADO</div>
          <div className="col-acciones" style={{ textAlign: "center" }}>
            ACCIONES
          </div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Cargando listado de noticias...
              </span>
            </div>
          ) : filteredNews.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No hay noticias registradas con estos filtros.
            </div>
          ) : (
            paginacion.itemsPagina.map((news) => {
              const estadoUpper = (
                news.estado || (news.isDraft ? "BORRADOR" : "PUBLICADO")
              ).toUpperCase();
              const isRejected = estadoUpper === "RECHAZADO";
              const estadoMostrado = news.estadoVista || estadoUpper;

              return (
                <div className="news-table-row" key={news.id}>
                  <div
                    className="col-content"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <div className="news-thumb-box">
                      {news.images && news.images.length > 0 && news.images[0] ? (
                        <img
                          src={news.images[0]}
                          alt="Miniatura"
                          className="news-thumb-img"
                        />
                      ) : (
                        <DefaultNewsImage alt="Miniatura" compact />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="news-title-interactive"
                        onClick={() => onViewNews && onViewNews(news)} role="button" tabIndex={0} onKeyDown={(e) => activarConTeclado(e, () => onViewNews && onViewNews(news))}
                        title="Ver comunicado completo"
                      >
                        <span className="activity-title news-title-clamped">
                          {tituloEnLista(news, viewTab === "PUBLICADO", news.title)}
                        </span>
                        {news.editedBy && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              color: "#64748b",
                              marginTop: "4px",
                            }}
                          >
                            Editado por {news.editedBy}
                          </span>
                        )}
                      </div>

                      {isRejected && (
                        <div
                          className="news-rejection-warning-pill"
                          onClick={() => handleOpenCorrection(news)} role="button" tabIndex={0} onKeyDown={(e) => activarConTeclado(e, () => handleOpenCorrection(news))}
                          title="Haga clic para ver el motivo del rechazo y corregir la noticia"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <span>
                            {news.rejectionReason ||
                              "El administrador solicitó correcciones en esta noticia."}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="col-editor" style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{news.editor || "Editor CMS"}</span>
                    <small style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}>
                      <CalendarDays size={12} />
                      {news.date || "Ahora"}
                      {news.updatedAt &&
                        news.createdAt &&
                        new Date(news.updatedAt) - new Date(news.createdAt) > 5000 && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#64748b",
                              fontStyle: "italic",
                              marginLeft: "3px",
                            }}
                          >
                            (Editado)
                          </span>
                        )}
                    </small>
                  </div>

                  <div className="col-categoria">
                    <EtiquetaCategoria categoria={news.category || "General"} />
                  </div>

                  <div className="col-estado">
                    <div className="status-wrapper">
                      {news.solicitudEliminacion && viewTab !== "PUBLICADO" ? (
<EtiquetaEliminacion />
) : (
<>
{isRejected && !news.estadoVista ? (
                        <span
                          onClick={() => handleOpenCorrection(news)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => activarConTeclado(e, () => handleOpenCorrection(news))}
                          title="Haga clic para corregir la noticia"
                          style={{ cursor: "pointer" }}
                        >
                          <EtiquetaEstado estado="RECHAZADO" texto="Rechazado" />
                        </span>
                      ) : (
                        <EtiquetaEstado estado={estadoMostrado} texto={textoDeEstado(estadoMostrado)} />
                      )}

                      <SiguePublicado item={news} activo={viewTab === "PUBLICADO"} />
<NotaPapelera item={news} />
                      {news.solicitudEliminacion && (
                        <div style={{ marginTop: "4px" }}>
                          <EtiquetaEliminacion nota />
                        </div>
                      )}
</>
)}

                      {estadoMostrado === "PENDIENTE_APROBACION" &&
                        news.requestedEstado === "BORRADOR" && (
                          <span className="status-programmed-date">
                            Cambio a: Borrador
                          </span>
                        )}

                      {(estadoMostrado === "PROGRAMADO" ||
                        estadoMostrado === "PENDIENTE_APROBACION") &&
                        news.fechaPublicacion && (
                          <span className="status-programmed-date">
                            Para:{" "}
                            {new Date(news.fechaPublicacion).toLocaleDateString("es-AR")} -{" "}
                            {new Date(news.fechaPublicacion).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}{" "}
                            hs
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="news-actions-cell">
{news.enPapelera ? (
<AccionesPapelera
  onRestaurar={() => papelera.restaurarItem(news)}
  onEliminar={() => handleConfirmDeleteClick(news.id)}
  ocupado={papelera.ocupado}
/>
) : (
<>

                    {isRejected ? (
                      <>
                        <button
                          type="button"
                          title="Ver vista previa"
                          onClick={() => onViewNews && onViewNews(news)}
                          className="news-action-btn-edit"
                          style={{ color: "#475569" }}
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Corregir contenido rechazado"
                          onClick={() => handleOpenCorrection(news)}
                          className="news-action-btn-edit"
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
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => handleOpenEdit(news)}
                        className="news-action-btn-edit"
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
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    )}

                    <button
                      type="button"
                      title="Eliminar"
                      onClick={() => handleConfirmDeleteClick(news.id)}
                      className="news-action-btn-delete"
                      disabled={deletingId === news.id}
                    >
                      {deletingId === news.id ? (
                        <div className="cms-spinner-red"></div>
                      ) : (
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
                      )}
                    </button>
                  
{esDescartable(news) && <BotonADescartar onClick={() => papelera.descartarItem(news)} ocupado={papelera.ocupado} />}
</>
)}
</div>
                </div>
              );
            })
          )}
          <Paginacion {...paginacion} etiqueta="noticias" />
        </div>
      </div>

            <CmsDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleExecuteDelete}
        itemType="la noticia"
        requiereAprobacion={requiereAprobacionParaEliminar((newsList || []).find((n) => n.id === noticiaAEliminar))}
        isDeleting={deletingId === noticiaAEliminar}
      />

            {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div
            className="modal-content-esp news-modal-content news-modal-content-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-esp">
              {correctionNews ? (
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <h2>Corregir contenido</h2>
                  <span className="news-status-pill-rejected">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Rechazado
                  </span>
                </div>
              ) : (
                <h2>{editingId ? "Editar noticia" : "Crear noticia"}</h2>
              )}

              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseAttempt}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>

                        {correctionNews && (
              <div
                className="news-correction-alert"
                style={{ margin: "16px 35px 0 35px", flexShrink: 0 }}
              >
                <div className="news-correction-alert-header">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <line x1="12" y1="8" x2="12" y2="11"></line>
                    <line x1="12" y1="14" x2="12.01" y2="14"></line>
                  </svg>
                  <span>Motivo del rechazo:</span>
                </div>
                <p className="news-correction-alert-text">
                  {correctionNews.rejectionReason ||
                    "El administrador solicitó correcciones en esta noticia antes de su publicación."}
                </p>
              </div>
            )}

            <form
              onSubmit={(e) =>
                correctionNews
                  ? handleSave(
                      e,
                      estado === "PROGRAMADO" ? "PROGRAMADO" : "PUBLICADO"
                    )
                  : handleSave(e)
              }
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                flex: 1,
                minHeight: 0,
              }}
            >
              <div
                className="modal-split-layout"
                style={{ flex: 1, minHeight: 0 }}
              >
                <div className="news-form-left">
                  <div>
                    <label className="news-form-label">
                      TÍTULO DE LA PUBLICACION{" "}
                      <span className="field-required-docs">*</span>
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => {
                        setTitulo(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Ingrese el título..."
                      className="news-form-input"
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      marginTop: "15px",
                      marginBottom: "15px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label className="news-form-label">CLASIFICACIÓN</label>
                      <select
                        value={categoria}
                        onChange={(e) => {
                          setCategoria(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="news-form-input"
                      >
                        {CATEGORIAS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label className="news-form-label">ESTADO</label>
                      <select
                        value={estado}
                        onChange={(e) => {
                          setEstado(e.target.value);
                          setHasUnsavedChanges(true);
                          if (e.target.value !== "PROGRAMADO") setFechaProgramada(null);
                        }}
                        className="news-form-input"
                      >
                        <option value="PUBLICADO">Publicar (Enviar a aprobación)</option>
                        <option value="BORRADOR">
                          {editingWasPublished
                            ? "Borrador (Enviar a aprobación)"
                            : "Borrador"}
                        </option>
                        <option value="PROGRAMADO">Programado (Enviar a aprobación)</option>
                      </select>
                    </div>
                  </div>

                  {estado === "PROGRAMADO" && (
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        className="news-form-label"
                        style={{ display: "block", marginBottom: "8px" }}
                      >
                        Publicar el:
                      </label>
                      <div className="schedule-picker-container">
                        <DatePicker
                          selected={fechaProgramada}
                          onChange={(date) => {
                            if (fechaProgramada && date) {
                              date.setHours(fechaProgramada.getHours());
                              date.setMinutes(fechaProgramada.getMinutes());
                            }
                            setFechaProgramada(date);
                            setHasUnsavedChanges(true);
                          }}
                          minDate={new Date()}
                          locale="es"
                          dateFormat="dd/MM/yyyy"
                          portalId="root-portal"
                          customInput={
                            <CustomScheduleInput
                              isDate={true}
                              placeholder="Elegir fecha"
                              icon={
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                              }
                            />
                          }
                        />

                        <DatePicker
                          selected={fechaProgramada}
                          onChange={(date) => {
                            setFechaProgramada(date);
                            setHasUnsavedChanges(true);
                          }}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={5}
                          timeCaption="Hora"
                          dateFormat="HH:mm"
                          portalId="root-portal"
                          customInput={
                            <CustomScheduleInput
                              placeholder="Elegir hora"
                              icon={
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                              }
                            />
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="news-form-label">IMÁGENES ADJUNTAS</label>
                    <div className="custom-file-upload-zone">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                        multiple
                        onChange={handleMultipleImagesUpload}
                        className="custom-file-input-hidden"
                      />
                      <div className="custom-file-upload-content">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: "#0ea5e9", marginBottom: "8px" }}
                        >
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        <span style={{ color: "#0284c7", fontWeight: "600" }}>
                          Haz clic para subir imágenes
                        </span>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "0.8rem",
                            marginTop: "4px",
                          }}
                        >
                          PNG, JPG, WEBP permitidos
                        </span>
                      </div>
                    </div>
                    {imagenesUrls.length > 0 && (
                      <div className="news-preview-gallery">
                        {imagenesUrls.map((url, idx) => (
                          <div key={idx} className="news-preview-item">
                            <img
                              src={url}
                              alt={`Preview ${idx}`}
                              className="news-preview-img"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="news-preview-remove-btn"
                              title="Eliminar imagen"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        color: "rgb(100 116 139)",
                        marginBottom: "8px",
                      }}
                    >
                      CUERPO DE LA PUBLICACIÓN{" "}
                      <span className="field-required-docs">*</span>
                    </label>
                    <div className="custom-ckeditor-container">
                      <CKEditor
                        editor={ClassicEditor}
                        data={cuerpoHtml || ""}
                        config={{
                          licenseKey: "GPL",
                          plugins: [
                            Essentials,
                            Paragraph,
                            Heading,
                            Bold,
                            Italic,
                            Underline,
                            Link,
                            List,
                            BlockQuote,
                            Undo,
                            Alignment,
                          ],
                          toolbar: [
                            "heading",
                            "|",
                            "bold",
                            "italic",
                            "underline",
                            "link",
                            "bulletedList",
                            "numberedList",
                            "|",
                            "alignment:left",
                            "alignment:center",
                            "alignment:right",
                            "alignment:justify",
                            "|",
                            "blockQuote",
                            "|",
                            "undo",
                            "redo",
                          ],
                          alignment: {
                            options: ["left", "center", "right", "justify"],
                          },
                        }}
                        onReady={(editor) => {
                          // CKEditor puede reescribir el HTML guardado al cargarlo (otro orden o espaciado).
                          // Con el formulario limpio, esa versión pasa a ser la base: si se escribe algo y se
                          // deshace, vuelve a quedar igual y el botón se deshabilita. El backend sanea el cuerpo
                          // antes de comparar, así que esta versión no se toma como un cambio.
                          if (!hasUnsavedChanges) setCuerpoHtml(editor.getData());
                        }}
                        onChange={(event, editor) => {
                          setCuerpoHtml(editor.getData());
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="news-form-right">
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "15px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        color: "#64748b",
                      }}
                    >
                      VISTA PREVIA DE LA PUBLICACIÓN
                    </span>
                    <span
                      style={{
                        backgroundColor:
                          categoria === "General" ? "#f1f5f9" : "#e0f2fe",
                        color: categoria === "General" ? "#475569" : "#0284c7",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      {categoria}
                    </span>
                  </div>
                  <div className="news-preview-paper" style={{ padding: 0 }}>
                    <div className="preview-mock-modal-body">
                      <div className="preview-mock-left">
                        <div className="preview-mock-author-row">
                          <div className="preview-avatar-mock">
                            <img src={avatarHospital} alt="Avatar Hospital" />
                          </div>
                          <div className="preview-mock-author-meta">
                            <h3>Hospital Interdistrital Evita Formosa</h3>
                            <span>{new Date().toLocaleDateString("es-AR")}</span>
                          </div>
                        </div>
                        <h3 className="preview-mock-title">
                          {titulo || "El título de la noticia aparecerá aquí..."}
                        </h3>
                        <div className="preview-mock-text ck-content">
                          {cuerpoHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(cuerpoHtml) }} />
                          ) : (
                            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>
                              El contenido comenzará a aparecer aquí a medida que
                              escribas.
                            </p>
                          )}
                        </div>
                      </div>
                      {imagenesUrls.length > 0 ? (
                        <div
                          className={`preview-mosaic-gallery layout-${
                            imagenesUrls.length >= 4 ? 4 : imagenesUrls.length
                          }`}
                        >
                          {imagenesUrls.slice(0, 4).map((img, index) => {
                            const isLastAndHidden =
                              index === 3 && imagenesUrls.length > 4;
                            const fotosRestantes = imagenesUrls.length - 4;
                            return (
                              <div key={index} className="preview-mosaic-item">
                                <img src={img} alt={`Preview foto ${index + 1}`} />
                                {isLastAndHidden && (
                                  <div className="preview-mosaic-overlay">
                                    <span>+{fotosRestantes}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
<div className="preview-mosaic-empty-wrap" style={{ width: "100%", height: "380px", borderRadius: "10px", overflow: "hidden", position: "sticky", top: "30px", alignSelf: "start" }}>
                          <DefaultNewsImage alt="Imagen predeterminada institucional" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                            <div className="modal-footer-esp">
                <button
                  type="button"
                  className="btn-cancelar-gris"
                  onClick={handleCloseAttempt}
                  disabled={saving}
                >
                  CANCELAR
                </button>

                {correctionNews ? (
                  <>
                    <button
                      type="button"
                      className="btn-cancelar-gris"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#0c2340",
                      }}
                      onClick={(e) => handleSave(e, "BORRADOR", true)}
                      disabled={saving || !hayCambios}
                      title={!hayCambios ? "No se han detectado cambios para actualizar" : ""}
                    >
                      GUARDAR BORRADOR
                    </button>
                    <button
                      type="submit"
                      className="btn-cerrar-rojo"
                      style={{
                        backgroundColor: "#2b5b94",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      disabled={saving || !hayCambios}
                      title={!hayCambios ? "No se han detectado cambios para actualizar" : ""}
                    >
                      {saving ? (
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
                          ENVIANDO...
                        </span>
                      ) : (
                        <>
                          GUARDAR Y REENVIAR
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="btn-cerrar-rojo"
                    style={{ backgroundColor: "#2b5b94" }}
                    disabled={saving || (Boolean(editingId) && !hayCambios)}
                    title={editingId && !hayCambios ? "No se han detectado cambios para actualizar" : ""}
                  >
                    {saving ? (
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
                )}
              </div>
            </form>
          </div>
        </div>
      )}

            <CmsConfirmDraftModal
        isOpen={showConfirmDraftModal}
        onClose={() => setShowConfirmDraftModal(false)}
        onConfirm={(e) => handleSave(e, "BORRADOR", true)}
        title={
          editingWasPublished ? "Solicitar paso a borrador" : "Guardar como borrador"
        }
        message={
          editingWasPublished
            ? "Como esta noticia ya fue aprobada/publicada, cambiar su estado a Borrador requiere la aprobación del administrador. Seguirá visible en el portal público hasta que se apruebe el cambio. ¿Deseas enviar la solicitud?"
            : undefined
        }
        confirmText={
          editingWasPublished ? "Enviar a aprobación" : "Sí, guardar borrador"
        }
        itemType="esta noticia"
        loading={saving}
      />

            <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => handleSave(e, "BORRADOR", true)}
      />
      </div>
    </>
  );
};

export default CmsNoticiasView;
