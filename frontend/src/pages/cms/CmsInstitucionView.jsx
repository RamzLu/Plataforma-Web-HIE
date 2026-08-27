import React, { useState, useEffect } from "react";
import "../../styles/components/cms/CmsInstitucionView.css";

// --- Datos hardcodeados (simulan lo que vendría del backend) ---
const DATOS_INSTITUCIONALES = {
  historia: {
    titulo: "ACERCA DEL HIE",
    cuerpo:
      "El Hospital Interdistrital Evita es un centro de alta complejidad referente en la provincia de Formosa y la región, asentado sobre una moderna infraestructura de 19.000 metros cuadrados cubiertos proyectada bajo rigurosas normas sanitarias internacionales. Cuenta con quirófanos inteligentes, centro de esterilización con tecnología de plasma de peróxido, unidades de terapia intensiva y una red de conectividad por fibra óptica provincial para la gestión integral de la Historia Clínica Digital.",
    estado: "Publicado",
    ultimaEdicion: "22 de agosto de 2026 · 10:42 hs",
  },
  principios: {
    titulo: "NUESTROS VALORES",
    valores: [
      { nombre: "EXCELENCIA Y CALIDEZ", descripcion: "" },
      { nombre: "EQUIDAD E INCLUSIÓN", descripcion: "" },
      { nombre: "INNOVACIÓN Y COMPROMISO", descripcion: "" },
    ],
  },
  autoridades: [
    { id: 1, nombre: "Dr. Jorge Alberto Gómez", cargo: "Director Ejecutivo", imagen: "archivon133621" },
    { id: 2, nombre: "Dr. Jorge Alberto Gómez", cargo: "Directora Administrativa", imagen: "archivon133621" },
    { id: 3, nombre: "Dr. Jorge Alberto Gómez", cargo: "Directora Administrativa", imagen: "archivon133621" },
  ],
  datosGenerales: {
    direccion: "Av. 25 de Mayo 1234, Formosa Capital",
    horario: "Lunes a viernes, de 7:00 a 19:00 hs",
    telefono: "(370) 442-0000",
    correo: "contacto@redevitformosa.gob.ar",
  },
};

const CmsInstitucionView = () => {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState(null);

  // Simula la carga de datos con una demora (como la latencia de un backend real).
  useEffect(() => {
    const timer = setTimeout(() => {
      setDatos(DATOS_INSTITUCIONALES);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="cms-dashboard-card" style={{ padding: "60px", textAlign: "center" }}>
        <div className="cms-spinner" style={{ margin: "0 auto 12px auto" }}></div>
        <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Cargando información institucional...
        </span>
      </div>
    );
  }

  const { historia, principios, autoridades, datosGenerales } = datos;

  return (
    <div className="inst-container">
      {/* ===== 1. HISTORIA INSTITUCIONAL ===== */}
      <section className="cms-dashboard-card inst-card">
        <div className="inst-card-header">
          <div>
            <h3 className="inst-card-title">Historia Institucional</h3>
            <p className="inst-card-subtitle">Reseña y trayectoria de la institución</p>
          </div>
          <span className="status-badge publicado">{historia.estado}</span>
        </div>

        <div className="inst-field">
          <label className="inst-label">Título</label>
          <input className="inst-input" type="text" value={historia.titulo} readOnly />
        </div>

        <div className="inst-field">
          <textarea className="inst-textarea inst-bloqueado" value={historia.cuerpo} readOnly />
        </div>

        <div className="inst-card-footer">
          <span className="inst-ultima-edicion">Última edición: {historia.ultimaEdicion}</span>
          <button className="btn-inst-oscuro">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Editar historia
          </button>
        </div>
      </section>

      {/* ===== 2. PRINCIPIOS INSTITUCIONALES ===== */}
      <section className="cms-dashboard-card inst-card">
        <div className="inst-card-header">
          <div>
            <h3 className="inst-card-title">Principios Institucionales</h3>
            <p className="inst-card-subtitle">Propósito y horizonte institucional</p>
          </div>
        </div>

        <div className="inst-field">
          <label className="inst-label">Título</label>
          <input className="inst-input" type="text" value={principios.titulo} readOnly />
        </div>

        <div className="inst-valores-pills">
          {principios.valores.map((v, i) => (
            <div key={i} className="inst-valor-pill">{v.nombre}</div>
          ))}
        </div>

        <div className="inst-valores-cajas">
          {principios.valores.map((v, i) => (
            <div key={i} className="inst-valor-caja">{v.descripcion}</div>
          ))}
        </div>

        <div className="inst-card-footer center">
          <button className="btn-inst-oscuro">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Editar
          </button>
        </div>
      </section>

      {/* ===== 3. AUTORIDADES ===== */}
      <section className="cms-dashboard-card inst-card">
        <div className="inst-card-header">
          <div>
            <h3 className="inst-card-title">Autoridades</h3>
            <p className="inst-card-subtitle">Equipo directivo vigente</p>
          </div>
          <button className="btn-inst-oscuro">+ Añadir autoridad</button>
        </div>

        <div className="inst-autoridades-tabla">
          <div className="inst-autoridades-head">
            <div>NOMBRE</div>
            <div>CARGO</div>
            <div>IMAGEN</div>
          </div>
          {autoridades.map((a) => (
            <div key={a.id} className="inst-autoridades-row">
              <div className="inst-aut-nombre">{a.nombre}</div>
              <div className="inst-aut-cargo">{a.cargo}</div>
              <div className="inst-aut-imagen">{a.imagen}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 4. DATOS GENERALES ===== */}
      <section className="cms-dashboard-card inst-card">
        <div className="inst-card-header">
          <div>
            <h3 className="inst-card-title">Datos generales</h3>
            <p className="inst-card-subtitle">Información de contacto y atención</p>
          </div>
          <button className="btn-inst-oscuro">Editar</button>
        </div>

        <div className="inst-field">
          <label className="inst-label">Dirección breve</label>
          <input className="inst-input" type="text" value={datosGenerales.direccion} readOnly />
        </div>
        <div className="inst-field">
          <label className="inst-label">Horario general</label>
          <input className="inst-input" type="text" value={datosGenerales.horario} readOnly />
        </div>
        <div className="inst-field">
          <label className="inst-label">Teléfono de contacto</label>
          <input className="inst-input" type="text" value={datosGenerales.telefono} readOnly />
        </div>
        <div className="inst-field">
          <label className="inst-label">Correo institucional</label>
          <input className="inst-input" type="text" value={datosGenerales.correo} readOnly />
        </div>
      </section>
    </div>
  );
};

export default CmsInstitucionView;