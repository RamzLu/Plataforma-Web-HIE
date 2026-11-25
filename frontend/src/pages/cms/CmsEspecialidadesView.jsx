import { EtiquetaTipo } from "../../components/ui/EtiquetaCategoria";
import { mensajeDeError } from "../../utils/mensajeDeError";
import Paginacion from "../../components/ui/Paginacion";
import { usePaginacion } from "../../hooks/usePaginacion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import keycloak from "../../config/keycloak";
import { getEspecialidades, createEspecialidad, updateEspecialidad, deleteEspecialidad } from "../../api/especialidades.api.js";
import { recordCmsActivity } from "../../utils/cmsActivityLogger.js";
import "../../styles/components/cms/CmsDashboard.css"; 
import "../../styles/pages/cms/CmsNoticiasView.css";
import "../../styles/pages/cms/CmsEspecialidadesView.css"; 
import "../../styles/pages/cms/CmsResidenciasView.css";
import {
  CmsDeleteModal,
  CmsUnsavedChangesModal,
} from "../../components/cms/CmsModals";
import SiguePublicado from "../../components/cms/SiguePublicado";
import { EtiquetaEliminacion } from "../../components/admin/SolicitudEliminacionAcciones";
import { estaPublicadoEnPortal, requiereAprobacionParaEliminar, tituloEnLista, vistaPublicados, esDescartable } from "../../utils/publicacion.js";
import EtiquetaEstado from "../../components/ui/EtiquetaEstado";
import { textoDeEstado } from "../../components/ui/estados.js";
import FiltrosEstado from "../../components/ui/FiltrosEstado";
import { usePapelera } from "../../hooks/usePapelera";
import { AccionesPapelera, BotonADescartar, NotaPapelera, AvisoPapelera } from "../../components/cms/Papelera";
import { descartarEspecialidad, restaurarEspecialidad } from "../../api/especialidades.api.js";
import BarraFiltros from "../../components/ui/BarraFiltros";

const CmsEspecialidadesView = ({ initialCreateModal = false, onModalOpened }) => {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("PUBLICADOS");  
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "", descripcion: "", ubicacion: "", horarios: "", 
    requisitos: "", informacionDerivacion: "", 
    esServicio: false, estado: "PUBLICADO"
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getEspecialidades(true);
      setEspecialidades(data);
    } catch { toast.error("Error al cargar los datos."); } 
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

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

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ 
      nombre: "", descripcion: "", ubicacion: "", horarios: "", 
      requisitos: "", informacionDerivacion: "", 
      esServicio: false, estado: "PUBLICADO" 
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  useEffect(() => {
    if (initialCreateModal) {
      handleOpenCreate();
      if (onModalOpened) onModalOpened();
    }
  }, [initialCreateModal]);

  const handleOpenEdit = (esp) => {
    setEditingId(esp.id);
    setFormData({
      nombre: esp.nombre || "", 
      descripcion: esp.descripcion || "",
      ubicacion: esp.ubicacion || "", 
      horarios: esp.horarios || "",
      requisitos: esp.requisitos ? esp.requisitos.join("\n") : "",
      informacionDerivacion: esp.informacionDerivacion || "",
      esServicio: esp.esServicio, 
      // Lo que el CM puede pedir es publicar o archivar; un estado como RECHAZADO o PENDIENTE no se reenvía.
      estado: esp.estado === "ARCHIVADO" ? "ARCHIVADO" : "PUBLICADO"
    });
    setHasUnsavedChanges(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId && !hasUnsavedChanges) {
      return toast.error("No se han detectado cambios para actualizar.");
    }
    if (!formData.nombre.trim()) return toast.error("El nombre es obligatorio.");

    const payload = {
      ...formData,
      requisitos: formData.requisitos.split("\n").map(r => r.trim()).filter(r => r),
      editor: keycloak?.tokenParsed?.name || keycloak?.idTokenParsed?.name || keycloak?.tokenParsed?.preferred_username || ""
    };

    setIsSaving(true);
    try {
      if (keycloak.authenticated) {
        await keycloak.updateToken(30).catch(() => {});
      }
      let resp;
      if (editingId) {
        resp = await updateEspecialidad(editingId, payload);
      } else {
        resp = await createEspecialidad(payload);
      }

      const estadoResultante = (resp?.data?.estado || payload.estado || "PENDIENTE_APROBACION").toUpperCase();
      if (estadoResultante === "PENDIENTE_APROBACION") {
        const esArchivado = payload.estado === "ARCHIVADO" || resp?.data?.requestedEstado === "ARCHIVADO";
        toast.success(
          esArchivado
            ? "Solicitud de archivado enviada a revisión del administrador."
            : editingId
            ? "Modificaciones enviadas a revisión del administrador."
            : "Especialidad/Servicio enviado a revisión del administrador para su aprobación."
        );
        setActiveTab("PENDIENTES");
      } else {
        toast.success(editingId ? "Actualizado con éxito." : "Creado con éxito.");
        setActiveTab(estadoResultante === "ARCHIVADO" ? "ARCHIVADOS" : "PUBLICADOS");
      }

      setShowModal(false);
      setHasUnsavedChanges(false);
      cargarDatos();
    } catch (error) {
      toast.error(mensajeDeError(error, "Error al guardar."));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (esp) => { setItemAEliminar(esp); setShowDeleteModal(true); };

  const executeDelete = async () => {
    setIsDeleting(true); 
    try {
      const respuesta = await deleteEspecialidad(itemAEliminar.id, itemAEliminar.esServicio);
      // Si el contenido está publicado, el backend no lo borra: queda una solicitud para el administrador.
      if (respuesta?.solicitudEliminacion) {
        toast.success(respuesta.message, { duration: 6000 });
        setShowDeleteModal(false);
        // El pedido queda registrado en el servidor: se vuelve a pedir la lista para que la fila lo muestre.
        cargarDatos();
        return;
      }
      const tipo = itemAEliminar.esServicio ? "servicio" : "especialidad";
      recordCmsActivity({
        titulo: `Eliminó ${tipo}: "${itemAEliminar.nombre || ""}"`,
        categoria: itemAEliminar.esServicio ? "Servicios" : "Especialidades",
        editor: keycloak?.tokenParsed?.name || "Editor CMS",
        estado: "ELIMINADO",
      });
      toast.success("Eliminado con éxito.");
      setShowDeleteModal(false);
      cargarDatos();
    } catch (error) {
      const msg = mensajeDeError(error, "Error al intentar eliminar.");
      toast.error(msg, { duration: 5000 });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false); 
    }
  };

  // Papelera de lo rechazado: mandar a la Papelera y restaurar (solo el CM; se vacía sola a los 15 días).
  const papelera = usePapelera({
    descartar: (item) => descartarEspecialidad(item.id, { esServicio: item.esServicio }),
    restaurar: (item) => restaurarEspecialidad(item.id, { esServicio: item.esServicio }),
    recargar: cargarDatos,
  });

  // Cantidad por filtro (lo publicado con una actualización en revisión cuenta también como publicado).
  const cuentas = { PAPELERA: 0, PUBLICADOS: 0, PENDIENTES: 0, RECHAZADOS: 0, ARCHIVADOS: 0 };
  especialidades.forEach((esp) => {
    if (esp.enPapelera) {
      cuentas.PAPELERA++;
      return;
    }
    const e = (esp.estado || "PUBLICADO").toUpperCase();
    if (estaPublicadoEnPortal(esp)) cuentas.PUBLICADOS++;
    if (e === "PENDIENTE_APROBACION") cuentas.PENDIENTES++;
    else if (e === "RECHAZADO") cuentas.RECHAZADOS++;
    else if (e === "ARCHIVADO" || e === "BORRADOR") cuentas.ARCHIVADOS++;
  });

  const datosFiltrados = especialidades.filter((esp) => {
    if (activeTab === "PAPELERA" ? !esp.enPapelera : esp.enPapelera) return false;
    const estadoItem = (esp.estado || "PUBLICADO").toUpperCase();
    let matchEstado = false;
    if (activeTab === "TODOS" || activeTab === "PAPELERA") {
      matchEstado = true;
    } else if (activeTab === "PUBLICADOS") {
      matchEstado = estaPublicadoEnPortal(esp);
    } else if (activeTab === "PENDIENTES") {
      matchEstado = estadoItem === "PENDIENTE_APROBACION";
    } else if (activeTab === "RECHAZADOS") {
      matchEstado = estadoItem === "RECHAZADO";
    } else if (activeTab === "ARCHIVADOS") {
      matchEstado = estadoItem === "ARCHIVADO" || estadoItem === "BORRADOR";
    }

    let matchTipo = true;
    if (filtroTipo === "ESPECIALIDADES") matchTipo = esp.esServicio === false;
    if (filtroTipo === "SERVICIOS") matchTipo = esp.esServicio === true;

    const query = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      (esp.nombre && esp.nombre.toLowerCase().includes(query)) ||
      (esp.ubicacion && esp.ubicacion.toLowerCase().includes(query)) ||
      (esp.descripcion && esp.descripcion.toLowerCase().includes(query));

    return matchEstado && matchTipo && matchSearch;
  });
  const paginacion = usePaginacion(vistaPublicados(datosFiltrados, activeTab === "PUBLICADOS"), 10, [activeTab, filtroTipo, searchTerm]);

  return (
    <>
      <div style={{ marginBottom: "18px" }}>
        <FiltrosEstado
                    activa={activeTab}
                    onCambiar={setActiveTab}
                    todos
                    onActualizar={cargarDatos}
                    actualizando={loading}
                    opciones={[
                      { clave: "PENDIENTES", tipo: "pendiente", cuenta: cuentas.PENDIENTES },
                      { clave: "PUBLICADOS", tipo: "publicado", cuenta: cuentas.PUBLICADOS },
                      { clave: "RECHAZADOS", tipo: "rechazado", cuenta: cuentas.RECHAZADOS },
                      { clave: "ARCHIVADOS", tipo: "archivado", cuenta: cuentas.ARCHIVADOS },
                      { clave: "PAPELERA", tipo: "papelera", cuenta: cuentas.PAPELERA },
          ]}
                  />
      </div>

      <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado de especialidades y servicios
          </h3>
          <p className="news-view-subtitle">
            Administre las especialidades médicas y servicios clave de la institución.
          </p>
        </div>
      </div>

      <BarraFiltros
        crear={{ texto: "+ AÑADIR ESPECIALIDAD", onClick: handleOpenCreate }}
          busqueda={{ etiqueta: "Buscar especialidad o servicio", placeholder: "Buscar por nombre o ubicación...", valor: searchTerm, onCambio: setSearchTerm }}
          select={{
            etiqueta: "Clasificación",
            valor: filtroTipo,
            onCambio: setFiltroTipo,
            opciones: [
              { valor: "TODOS", texto: "Todas las clasificaciones" },
              { valor: "ESPECIALIDADES", texto: "Solo Especialidades" },
              { valor: "SERVICIOS", texto: "Solo Servicios Clave" },
            ],
          }}
        />

      {activeTab === "PAPELERA" && <AvisoPapelera />}
<div className="cms-news-table-container">
        <div className="activity-table-head news-table-head" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1.8 }}>CONTENIDO</div>
          <div style={{ flex: 1.2 }}>UBICACIÓN</div>
          <div style={{ flex: 1 }}>HORARIOS</div>
          <div style={{ flex: 1 }}>CLASIFICACIÓN</div>
          <div style={{ width: "200px", textAlign: "center" }}>ESTADO</div>
          <div style={{ width: "140px", textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? ( 
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Cargando listado...</span>
            </div>
          ) : 
           datosFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No se encontraron registros que coincidan con los filtros aplicados.
            </div> 
          ) : (
            paginacion.itemsPagina.map((esp) => (
              <div className="activity-row news-table-row" key={esp.id + (esp.esServicio ? 'srv' : 'esp')} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                
                <div className="col-content" style={{ flex: 1.8, display: "flex", flexDirection: "row", alignItems: "center", gap: "15px" }}>
                  <div className="news-thumb-box" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" }}>
                    <div className="news-thumb-mock" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0c2340" }}>HIE</span>
                    </div>
                  </div>
                  <div className="news-title-interactive">
                    <span className="activity-title" style={{ fontWeight: "600", color: "#0c2340", fontSize: "0.95rem", display: "block" }}>
                      {tituloEnLista(esp, activeTab === "PUBLICADOS", esp.nombre)}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      {esp.descripcion && esp.descripcion.length > 55 
                        ? `${esp.descripcion.substring(0, 55)}...` 
                        : esp.descripcion || "Área asistencial del hospital"}
                    </span>
                    {esp.rejectionReason && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#b91c1c",
                          fontWeight: "600",
                          backgroundColor: "#fef2f2",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          display: "inline-block",
                          marginTop: "6px",
                          border: "1px solid #fecaca",
                        }}
                      >
                        Motivo de rechazo: {esp.rejectionReason}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1.2, color: "#475569", fontSize: "0.9rem", fontWeight: "500" }}>
                  {esp.ubicacion || "Sin ubicación asignada"}
                </div>

                <div style={{ flex: 1, color: "#475569", fontSize: "0.9rem", fontWeight: "500" }}>
                  {esp.horarios || "Consultar horarios"}
                </div>

                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <EtiquetaTipo esServicio={esp.esServicio} />
                </div>

                <div style={{ width: "200px", textAlign: "center" }}>
                  {esp.solicitudEliminacion && activeTab !== "PUBLICADOS" ? (
<EtiquetaEliminacion />
) : (
<>
<EtiquetaEstado estado={esp.estadoVista || esp.estado} texto={textoDeEstado(esp.estadoVista || esp.estado)} />
                  <SiguePublicado item={esp} activo={activeTab === "PUBLICADOS"} />
<NotaPapelera item={esp} />
                  {esp.solicitudEliminacion && (
                    <div style={{ marginTop: "4px" }}>
                      <EtiquetaEliminacion nota />
                    </div>
                  )}
</>
)}
                </div>

                <div style={{ width: "140px", display: "flex", justifyContent: "center", gap: "10px" }}>
{esp.enPapelera ? (
<AccionesPapelera
  onRestaurar={() => papelera.restaurarItem(esp)}
  onEliminar={() => confirmDelete(esp)}
  ocupado={papelera.ocupado}
/>
) : (
<>

                  <button type="button" onClick={() => handleOpenEdit(esp)} className="news-action-btn-edit" title="Editar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button type="button" onClick={() => confirmDelete(esp)} className="news-action-btn-delete" title="Eliminar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                
{esDescartable(esp) && <BotonADescartar onClick={() => papelera.descartarItem(esp)} ocupado={papelera.ocupado} />}
</>
)}
</div>

              </div>
            ))
          )}
          <Paginacion {...paginacion} etiqueta="registros" />
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseAttempt}>
          <div className="modal-content-esp esp-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header-esp">
              <h2>{editingId ? "Editar Registro" : "Nuevo Registro"}</h2>
              <button type="button" className="btn-close-modal" onClick={handleCloseAttempt}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div className="esp-modal-body">
                <div className="esp-form-grid">
                  
                  <div className="esp-full-width">
                    <label className="esp-form-label">Nombre de la Especialidad/Servicio <span className="esp-asterisk">*</span></label>
                    <input 
                      type="text" 
                      value={formData.nombre} 
                      onChange={(e) => { setFormData({...formData, nombre: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="esp-form-input" 
                      placeholder="Ej: Cardiología..." 
                      required 
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label className="esp-form-label">Tipo de Elemento</label>
                      <label className={`esp-toggle-item ${editingId ? "disabled" : ""}`} style={{ marginTop: "12px" }}>
                        <div className="esp-switch">
                          <input type="checkbox" checked={formData.esServicio} disabled={!!editingId} onChange={(e) => { setFormData({...formData, esServicio: e.target.checked}); setHasUnsavedChanges(true); }} />
                          <span className="esp-slider"></span>
                        </div>
                        <span className="esp-toggle-label-text">Es Servicio Clave</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="esp-form-label">Estado de Publicación</label>
                    <select 
                      value={formData.estado === "ARCHIVADO" ? "ARCHIVADO" : "PUBLICADO"} 
                      onChange={(e) => { setFormData({...formData, estado: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="esp-form-input"
                    >
                      <option value="PUBLICADO">Publicar (Revisión del Administrador)</option>
                      <option value="ARCHIVADO">Archivar (Oculto)</option>
                    </select>
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Descripción general</label>
                    <textarea value={formData.descripcion} onChange={(e) => { setFormData({...formData, descripcion: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" rows="2" style={{ resize: "none" }} placeholder="Breve descripción del área..." />
                  </div>

                  <div>
                    <label className="esp-form-label">Ubicación física</label>
                    <input type="text" value={formData.ubicacion} onChange={(e) => { setFormData({...formData, ubicacion: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" placeholder="Ej: Pasillo A, PB..." />
                  </div>

                  <div>
                    <label className="esp-form-label">Horarios</label>
                    <input type="text" value={formData.horarios} onChange={(e) => { setFormData({...formData, horarios: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" placeholder="Ej: Lun a Vie, 8 a 12hs" />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Información de Derivación (Opcional)</label>
                    <textarea value={formData.informacionDerivacion} onChange={(e) => { setFormData({...formData, informacionDerivacion: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" rows="2" placeholder="Información sobre cómo tramitar la derivación..." style={{ resize: "none" }} />
                  </div>

                  <div className="esp-full-width">
                    <label className="esp-form-label">Requisitos y Documentación Necesaria <span style={{ textTransform: "none", color: "#94a3b8", fontWeight: "normal" }}>(Separa cada uno con la tecla Enter)</span></label>
                    <textarea value={formData.requisitos} onChange={(e) => { setFormData({...formData, requisitos: e.target.value}); setHasUnsavedChanges(true); }} className="esp-form-input" rows="4" placeholder="Traer DNI original.&#10;Orden médica vigente..." style={{ resize: "none" }} />
                  </div>

                </div>
              </div>

              <div className="modal-footer-esp">
                <button type="button" className="btn-cancelar-gris" onClick={handleCloseAttempt} disabled={isSaving}>
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
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="cms-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }}></div>
                      GUARDANDO...
                    </span>
                  ) : (
                    editingId ? "ACTUALIZAR" : "GUARDAR"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CmsUnsavedChangesModal
        isOpen={showUnsavedModal}
        onKeepEditing={() => setShowUnsavedModal(false)}
        onDiscard={handleForceClose}
        onSaveDraft={(e) => {
          setFormData((prev) => ({ ...prev, estado: "ARCHIVADO" }));
          setTimeout(() => handleSave(e), 50);
        }}
        saveDraftText="Guardar y archivar (Oculto)"
        message="¿Qué deseas hacer con el registro actual?"
      />

      <CmsDeleteModal
        isOpen={showDeleteModal && !!itemAEliminar}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        itemName={itemAEliminar?.nombre}
        itemType={itemAEliminar?.esServicio ? "el servicio" : "la especialidad"}
        requiereAprobacion={requiereAprobacionParaEliminar(itemAEliminar)}
        isDeleting={isDeleting}
      />
      </div>
    </>
  );
};

export default CmsEspecialidadesView;