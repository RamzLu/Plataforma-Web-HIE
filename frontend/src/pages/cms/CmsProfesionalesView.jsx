import React, { useState } from "react";
import "../../styles/components/cms/CmsProfesionalesView.css";

// --- DATOS HARDCODEADOS (Mock) ---
const mockProfesionales = [
  { id: 1, nombre: "Marcela", apellido: "Ferreyra", matricula: "MP 12.487", cargo: "Jefa de Área", tipo: "Especialidad médica", area: "Clínica Médica", publicado: true },
  { id: 2, nombre: "Julián", apellido: "Sosa", matricula: "MP 15.902", cargo: "Médico de Guardia", tipo: "Especialidad médica", area: "Traumatología", publicado: true },
  { id: 3, nombre: "Rocío", apellido: "Benítez", matricula: "MP 08.331", cargo: "Bioquímica de Guardia", tipo: "Servicio de apoyo", area: "Laboratorio", publicado: true },
  { id: 4, nombre: "Hernán", apellido: "Cabrera", matricula: "TC 4.120", cargo: "Técnico Radiólogo", tipo: "Servicio de apoyo", area: "Radiología", publicado: true },
  { id: 5, nombre: "Valeria", apellido: "Ojeda", matricula: "MP 17.664", cargo: "Médica de Planta", tipo: "Especialidad médica", area: "Pediatría", publicado: true },
  { id: 6, nombre: "Diego", apellido: "Almirón", matricula: "MP 09.845", cargo: "Kinesiólogo", tipo: "Servicio de apoyo", area: "Kinesiología", publicado: true },
];

const AREAS_ESPECIALIDAD = ["Clínica Médica", "Traumatología", "Pediatría", "Cardiología", "Cirugía General"];
const AREAS_APOYO = ["Laboratorio", "Radiología", "Kinesiología", "Farmacia", "Nutrición"];

const CmsProfesionalesView = () => {
  // Estados de la vista
  const [profesionales, setProfesionales] = useState(mockProfesionales);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Estado del Formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    matricula: "",
    tipo: "Especialidad médica",
    area: "",
    cargo: "",
    descripcion: ""
  });

  // --- FUNCIONES DE FILTRADO ---
  const profesionalesFiltrados = profesionales.filter(prof => {
    const coincideBusqueda = `${prof.nombre} ${prof.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideTipo = filtroTipo === "Todos" || prof.tipo === filtroTipo;
    return coincideBusqueda && coincideTipo;
  });

  // --- FUNCIONES CRUD (Simuladas en Memoria) ---
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ nombre: "", apellido: "", matricula: "", tipo: "Especialidad médica", area: "", cargo: "", descripcion: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prof) => {
    setEditingId(prof.id);
    setFormData({ ...prof, descripcion: prof.descripcion || "" });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar a este profesional?")) {
      setProfesionales(profesionales.filter(p => p.id !== id));
    }
  };

  const handleTogglePublish = (id) => {
    setProfesionales(profesionales.map(p => p.id === id ? { ...p, publicado: !p.publicado } : p));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingId) {
      // Editar existente
      setProfesionales(profesionales.map(p => p.id === editingId ? { ...formData, id: editingId, publicado: p.publicado } : p));
    } else {
      // Crear nuevo
      setProfesionales([...profesionales, { ...formData, id: Date.now(), publicado: true }]);
    }
    setIsModalOpen(false);
  };

  // Helper para las iniciales del Avatar
  const getIniciales = (nombre, apellido) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="cms-profesionales-wrapper">
      {/* HEADER */}
      <div className="profesionales-header">
        <div>
          <span className="sobretitulo">CONTENIDO INSTITUCIONAL</span>
          <h1 className="titulo-principal">Directorio de Profesionales</h1>
          <p className="subtitulo">Administrá el equipo de salud publicado en el portal: especialidades médicas y servicios de apoyo técnico.</p>
        </div>
        <button className="btn-add-profesional" onClick={handleOpenCreate}>
          + Añadir Profesional
        </button>
      </div>

      {/* FILTROS */}
      <div className="profesionales-filtros">
        <div className="filtro-busqueda">
          <label>Buscar profesional</label>
          <div className="input-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
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

      {/* TABLA */}
      <div className="profesionales-tabla-container">
        <div className="tabla-header">
          <div className="col-profesional">PROFESIONAL</div>
          <div className="col-cargo">CARGO O FUNCIÓN</div>
          <div className="col-area">ÁREA</div>
          <div className="col-acciones">ACCIONES</div>
        </div>

        <div className="tabla-body">
          {profesionalesFiltrados.length > 0 ? profesionalesFiltrados.map(prof => (
            <div className="tabla-row" key={prof.id}>
              {/* Columna 1: Avatar e Info */}
              <div className="col-profesional">
                <div className="avatar-circulo">{getIniciales(prof.nombre, prof.apellido)}</div>
                <div className="info-texto">
                  <strong>{prof.nombre} {prof.apellido}</strong>
                  <span>{prof.matricula}</span>
                </div>
              </div>

              {/* Columna 2: Cargo */}
              <div className="col-cargo">
                <span className="texto-oscuro">{prof.cargo}</span>
              </div>

              {/* Columna 3: Área */}
              <div className="col-area">
                <div className={`badge-area ${prof.tipo === 'Especialidad médica' ? 'badge-medica' : 'badge-apoyo'}`}>
                  <span className="dot"></span> {prof.area}
                </div>
                <span className="tipo-area-texto">{prof.tipo}</span>
              </div>

              {/* Columna 4: Acciones */}
              <div className="col-acciones">
                <div className="toggle-wrapper" onClick={() => handleTogglePublish(prof.id)}>
                  <div className={`toggle-switch ${prof.publicado ? 'active' : ''}`}>
                    <div className="toggle-knob"></div>
                  </div>
                  <span className="toggle-label">Publicado</span>
                </div>
                
                <button className="btn-accion edit" onClick={() => handleOpenEdit(prof)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Editar
                </button>
                
                <button className="btn-accion delete" onClick={() => handleDelete(prof.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Eliminar
                </button>
              </div>
            </div>
          )) : (
            <div className="empty-state">No se encontraron profesionales.</div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay-profesional" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-profesional" onClick={e => e.stopPropagation()}>
            
            <div className="modal-header-profesional">
              <div>
                <h2>{editingId ? "Editar Profesional" : "Añadir Profesional"}</h2>
                <p>Completá los datos del profesional. Se publicará en el directorio del portal público una vez guardado.</p>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form className="modal-body-profesional" onSubmit={handleSave}>
              
              {/* SECCIÓN A */}
              <div className="form-section">
                <h3 className="section-title"><span className="circle-letter">A</span> DATOS PERSONALES</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input type="text" placeholder="Ej. Marcela" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Apellido</label>
                    <input type="text" placeholder="Ej. Ferreyra" required value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Matrícula profesional</label>
                    <input type="text" placeholder="MP 00.000" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-group mt-15">
                  <label>Fotografía</label>
                  <div className="drag-drop-zone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <p><strong>Arrastrá la fotografía aquí o hacé clic para seleccionarla</strong></p>
                    <span>Formato JPG o PNG · Vertical 600 x 800 px · Máx. 2 MB</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN B */}
              <div className="form-section">
                <h3 className="section-title"><span className="circle-letter">B</span> ASIGNACIÓN DE ÁREA</h3>
                <div className="tipo-cards">
                  <div 
                    className={`tipo-card ${formData.tipo === 'Especialidad médica' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, tipo: 'Especialidad médica', area: ''})}
                  >
                    <div className="tipo-icon blue">♥</div>
                    <div>
                      <strong>Especialidad Médica</strong>
                      <span>Áreas clínicas y quirúrgicas</span>
                    </div>
                  </div>
                  <div 
                    className={`tipo-card ${formData.tipo === 'Servicio de apoyo' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, tipo: 'Servicio de apoyo', area: ''})}
                  >
                    <div className="tipo-icon gray">⛨</div>
                    <div>
                      <strong>Servicio de Apoyo / Técnico</strong>
                      <span>Diagnóstico y apoyo técnico</span>
                    </div>
                  </div>
                </div>

                <div className="form-group mt-15">
                  <label>Área específica</label>
                  <select required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}>
                    <option value="" disabled>Seleccione el área específica</option>
                    {(formData.tipo === 'Especialidad médica' ? AREAS_ESPECIALIDAD : AREAS_APOYO).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <span className="hint">Las opciones cambian según el tipo de área seleccionado arriba.</span>
                </div>
              </div>

              {/* SECCIÓN C */}
              <div className="form-section">
                <h3 className="section-title"><span className="circle-letter">C</span> ROL Y PERFIL</h3>
                <div className="form-group">
                  <label>Cargo o función</label>
                  <input type="text" placeholder="Ej. Médico de Planta, Bioquímico de Guardia" required value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} />
                </div>
                <div className="form-group mt-15">
                  <label>Descripción profesional</label>
                  <textarea placeholder="Breve reseña: formación, trayectoria y áreas de interés (máx. 400 caracteres)." rows="3" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer-profesional">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  Guardar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsProfesionalesView;