import React, { useState, useEffect } from "react";
import keycloak from "../../config/keycloak";
import toast from "react-hot-toast";
import "../../styles/components/cms/CmsProfesionalesView.css";

const AREAS_ESPECIALIDAD = ["Clínica Médica", "Traumatología", "Pediatría", "Cardiología", "Cirugía General"];
const AREAS_APOYO = ["Laboratorio", "Radiología", "Kinesiología", "Farmacia", "Nutrición"];

const CmsProfesionalesView = () => {
  const [profesionales, setProfesionales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    matricula: "",
    tipo: "Especialidad médica",
    area: "",
    cargo: "",
    descripcion: ""
  });
  const [archivoFoto, setArchivoFoto] = useState(null);

  const fetchProfesionales = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/cms/profesionales");
      if (response.ok) {
        const data = await response.json();
        setProfesionales(data);
      }
    } catch (error) {
      console.error("Error al obtener profesionales:", error);
      toast.error("Error al cargar el directorio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfesionales();
  }, []);

  const profesionalesFiltrados = profesionales.filter(prof => {
    const coincideBusqueda = `${prof.nombre} ${prof.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideTipo = filtroTipo === "Todos" || prof.tipo === filtroTipo;
    return coincideBusqueda && coincideTipo;
  });

  const handleOpenCreate = () => {
    setFormData({ nombre: "", apellido: "", matricula: "", tipo: "Especialidad médica", area: "", cargo: "", descripcion: "" });
    setArchivoFoto(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar a este profesional?")) {
      try {
        const token = keycloak?.token;
        const response = await fetch(`http://localhost:3000/api/cms/profesionales/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Error al eliminar en el servidor");

        setProfesionales(profesionales.filter(p => p.id !== id));
        toast.success("Profesional eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error("No se pudo eliminar el profesional.");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = keycloak?.token;
      const dataForm = new FormData();
      dataForm.append("nombre", formData.nombre);
      dataForm.append("apellido", formData.apellido);
      dataForm.append("matricula", formData.matricula);
      dataForm.append("cargo", formData.cargo);
      dataForm.append("descripcion", formData.descripcion);
      dataForm.append("especialidadNombre", formData.tipo);
      dataForm.append("areaNombre", formData.area);
      if (archivoFoto) {
        dataForm.append("archivo", archivoFoto);
      }

      const response = await fetch("http://localhost:3000/api/cms/profesionales", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: dataForm
      });

      if (!response.ok) throw new Error("Error al guardar en el servidor");

      const resultado = await response.json();
      setProfesionales([resultado.profesional, ...profesionales]);
      toast.success("¡Profesional creado con éxito!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar el profesional.");
    }
  };

  const getIniciales = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ""}${apellido?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <div className="cms-dashboard-card">
      <div className="news-view-header">
        <div>
          <h3 className="cms-card-title news-view-title">
            Listado del personal
          </h3>
          <p className="news-view-subtitle">
            Gestione las fichas de los profesionales de la institución.
          </p>
        </div>
        <button type="button" className="btn-crear-noticia-header news-btn-submit" onClick={handleOpenCreate}>
          + AÑADIR PROFESIONAL
        </button>
      </div>

      <div className="profesionales-filtros">
        <div className="filtro-busqueda">
          <label>Buscar profesional</label>
          <div className="input-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar por nombre o apellido..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="filtro-select">
          <label>Clasificar vista</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Especialidad médica">Especialidad médica</option>
            <option value="Servicio de apoyo">Servicio de apoyo</option>
          </select>
        </div>
      </div>

      <div className="cms-news-table-container">
        <div className="activity-table-head news-table-head">
          <div className="col-content">PROFESIONAL</div>
          <div className="col-cargo">CARGO O FUNCIÓN</div>
          <div className="col-area">ÁREA</div>
          <div className="col-acciones" style={{ textAlign: "center" }}>ACCIONES</div>
        </div>

        <div className="activity-table-body">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <div className="cms-spinner" style={{ margin: "0 auto 10px auto" }}></div>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Cargando profesionales...</span>
            </div>
          ) : profesionalesFiltrados.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No se encontraron profesionales registrados.
            </div>
          ) : (
            profesionalesFiltrados.map((prof) => (
              <div className="activity-row news-table-row" key={prof.id}>
                <div className="col-content" style={{ flexDirection: "row", alignItems: "center", gap: "15px" }}>
                  <div className="news-thumb-box">
                    {prof.imagenUrl ? (
                      <img src={prof.imagenUrl} alt="Avatar" className="news-thumb-img" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="news-thumb-mock">{getIniciales(prof.nombre, prof.apellido)}</div>
                    )}
                  </div>
                  <div className="news-title-interactive">
                    <span className="activity-title" style={{ fontWeight: "600", color: "#0c2340" }}>
                      {prof.nombre} {prof.apellido}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      {prof.matricula || "Sin matrícula"}
                    </span>
                  </div>
                </div>

                <div className="col-cargo" style={{ color: "#0f172a", fontWeight: "500" }}>
                  {prof.cargo}
                </div>

                <div className="col-area">
                  <div className="badge-area badge-medica" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span className="dot" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#0284c7" }}></span> 
                    {prof.area}
                  </div>
                  <span className="tipo-area-texto" style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: "3px" }}>
                    {prof.tipo}
                  </span>
                </div>

                <div className="news-actions-cell" style={{ justifyContent: "center" }}>
                  <button type="button" title="Eliminar" onClick={() => handleDelete(prof.id)} className="news-action-btn-delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* MODAL CON ESTILO EXACTO DE REFERENCIA */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            
            {/* Header del Modal de Referencia */}
            <header className="modal-header">
              <div className="header-content">
                <h1 className="modal-title">Añadir Profesional</h1>
                <p className="modal-subtitle">Completá los datos del profesional para registrarlo en el sistema.</p>
              </div>
              <button type="button" className="close-button" onClick={() => setIsModalOpen(false)} aria-label="Cerrar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                
                {/* Section A: Datos Personales */}
                <section className="form-section">
                  <div className="section-header">
                    <span className="section-badge">A</span>
                    <h2 className="section-title">DATOS PERSONALES</h2>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="nombre">Nombre</label>
                      <input 
                        type="text" 
                        id="nombre" 
                        placeholder="Ej. Marcela" 
                        required 
                        value={formData.nombre} 
                        onChange={e => setFormData({...formData, nombre: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="apellido">Apellido</label>
                      <input 
                        type="text" 
                        id="apellido" 
                        placeholder="Ej. Ferreyra" 
                        required 
                        value={formData.apellido} 
                        onChange={e => setFormData({...formData, apellido: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="matricula">Matrícula</label>
                      <input 
                        type="text" 
                        id="matricula" 
                        placeholder="MP 00.000" 
                        value={formData.matricula} 
                        onChange={e => setFormData({...formData, matricula: e.target.value})} 
                      />
                    </div>
                  </div>
                </section>

                {/* Fotografía */}
                <section className="form-section">
                  <h2 className="section-title-simple">Fotografía</h2>
                  <div className="file-upload-container">
                    <label className="file-upload-button">
                      Seleccionar archivo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden-input" 
                        onChange={e => setArchivoFoto(e.target.files[0])} 
                      />
                    </label>
                    <span className="file-status">
                      {archivoFoto ? archivoFoto.name : "Sin archivos seleccionados"}
                    </span>
                  </div>
                </section>

                {/* Section B: Asignación de Área */}
                <section className="form-section">
                  <div className="section-header">
                    <span className="section-badge">B</span>
                    <h2 className="section-title">ASIGNACIÓN DE ÁREA</h2>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="tipo-area">Tipo de Área</label>
                      <div className="select-wrapper">
                        <select 
                          id="tipo-area"
                          value={formData.tipo}
                          onChange={e => setFormData({...formData, tipo: e.target.value, area: ''})}
                        >
                          <option value="Especialidad médica">Especialidad médica</option>
                          <option value="Servicio de apoyo">Servicio de apoyo</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label htmlFor="area-especifica">Área específica</label>
                      <div className="select-wrapper">
                        <select 
                          id="area-especifica"
                          required
                          value={formData.area}
                          onChange={e => setFormData({...formData, area: e.target.value})}
                        >
                          <option value="" disabled>Seleccione el área específica</option>
                          {(formData.tipo === 'Especialidad médica' ? AREAS_ESPECIALIDAD : AREAS_APOYO).map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section C: Rol y Perfil */}
                <section className="form-section">
                  <div className="section-header">
                    <span className="section-badge">C</span>
                    <h2 className="section-title">ROL Y PERFIL</h2>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cargo">Cargo o función</label>
                    <input 
                      type="text" 
                      id="cargo" 
                      placeholder="Ej. Jefa de Área" 
                      required 
                      value={formData.cargo} 
                      onChange={e => setFormData({...formData, cargo: e.target.value})} 
                    />
                  </div>
                  <div className="form-group margin-top-md">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea 
                      id="descripcion" 
                      placeholder="Breve reseña..." 
                      rows="4"
                      value={formData.descripcion}
                      onChange={e => setFormData({...formData, descripcion: e.target.value})}
                    ></textarea>
                  </div>
                </section>

              </div>

              {/* Footer Actions */}
              <footer className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">GUARDAR PROFESIONAL</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsProfesionalesView;