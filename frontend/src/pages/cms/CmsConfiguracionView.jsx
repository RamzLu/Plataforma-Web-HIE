import React, { useState } from "react";
import "../../styles/components/cms/CmsConfiguracionView.css";

const CmsConfiguracionView = () => {
  // Estado Tarjeta 1: Datos de contacto
  const [configData, setConfigData] = useState({
    nombrePortal: "Red Evita Formosa",
    correo: "contacto@redevitaformosa.gob.ar",
    telefono: "(370) 442-0000",
    direccion: "Av. 25 de Mayo 1234, Formosa",
  });
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [tempContact, setTempContact] = useState({ ...configData });

  // Estado Tarjeta 2: Redes Sociales
  const [socialData, setSocialData] = useState({
    facebook: "https://facebook.com/redevitaformosa",
    instagram: "https://instagram.com/redevitaformosa",
  });
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [tempSocial, setTempSocial] = useState({ ...socialData });

  // --- ESTADO TARJETA 3: NAVBAR / MENÚS (HARDCODEADO VISUAL) ---
  const [navItems, setNavItems] = useState([
    { id: 1, name: "Inicio", path: "/", visible: true, orden: 1 },
    { id: 2, name: "Especialidades", path: "/especialidades", visible: true, orden: 2 },
    { id: 3, name: "Noticias", path: "/noticias", visible: true, orden: 3 },
    { id: 4, name: "Documentación", path: "/documentacion", visible: true, orden: 4 },
    { id: 5, name: "Capacitación", path: "/capacitacion", visible: true, orden: 5 },
    { id: 6, name: "Profesionales", path: "/profesionales", visible: true, orden: 6 },
    { id: 7, name: "Contacto", path: "/contacto", visible: true, orden: 7 },
    { id: 8, name: "Acerca de", path: "/acerca-de", visible: true, orden: 8 },
  ]);

  // Handler para alternar visibilidad (Habilitado / Deshabilitado)
  const handleToggleVisible = (id) => {
    setNavItems(prev =>
      prev.map(item => item.id === id ? { ...item, visible: !item.visible } : item)
    );
  };

  // Handler para cambiar el orden numérico
  const handleOrderChange = (id, newOrder) => {
    const ordenNum = parseInt(newOrder) || 1;
    setNavItems(prev =>
      prev.map(item => item.id === id ? { ...item, orden: ordenNum } : item)
        .sort((a, b) => a.orden - b.orden)
    );
  };

  const handleSaveContact = () => {
    setConfigData({ ...tempContact });
    setIsEditingContact(false);
    alert("¡Datos de contacto actualizados correctamente!");
  };

  const handleSaveSocial = () => {
    setSocialData({ ...tempSocial });
    setIsEditingSocial(false);
    alert("¡Redes sociales actualizadas correctamente!");
  };

  const handleAddNetwork = () => {
    const nuevaRed = prompt("Ingrese el nombre de la nueva red social:");
    if (nuevaRed) {
      alert(`Simulación: Campo para "${nuevaRed}" agregado exitosamente.`);
    }
  };

  return (
    <div className="cms-config-wrapper">
      {/* HEADER PRINCIPAL */}
      <div className="config-header-main">
        <span className="sobretitulo">CONTENIDO INSTITUCIONAL</span>
        <h1 className="titulo-principal">Gestión de Configuración</h1>
        <p className="subtitulo">
          Administre de forma segura la información pública y la estructura visual del Portal Red Evita Formosa.
        </p>
      </div>

      {/* --- TARJETA 1: DATOS DE CONTACTO --- */}
      <div className="config-card">
        <div className="config-card-header">
          <div>
            <h2 className="config-card-title">Datos de contacto</h2>
            <p className="config-card-subtitle">Información de contacto y atención</p>
          </div>
          
          {!isEditingContact ? (
            <button className="btn-config-edit" onClick={() => { setTempContact({...configData}); setIsEditingContact(true); }}>
              Editar
            </button>
          ) : (
            <div className="config-actions">
              <button className="btn-config-cancel" onClick={() => setIsEditingContact(false)}>Cancelar</button>
              <button className="btn-config-save" onClick={handleSaveContact}>Guardar</button>
            </div>
          )}
        </div>

        <div className="config-card-divider"></div>

        <div className="config-form-grid">
          <div className="form-group">
            <label>Nombre del portal</label>
            <input
              type="text"
              value={isEditingContact ? tempContact.nombrePortal : configData.nombrePortal}
              onChange={(e) => setTempContact({...tempContact, nombrePortal: e.target.value})}
              disabled={!isEditingContact}
              className={!isEditingContact ? "input-readonly" : ""}
            />
          </div>

          <div className="form-group">
            <label>Correo institucional</label>
            <input
              type="email"
              value={isEditingContact ? tempContact.correo : configData.correo}
              onChange={(e) => setTempContact({...tempContact, correo: e.target.value})}
              disabled={!isEditingContact}
              className={!isEditingContact ? "input-readonly" : ""}
            />
          </div>

          <div className="form-group">
            <label>Teléfono de contacto</label>
            <input
              type="text"
              value={isEditingContact ? tempContact.telefono : configData.telefono}
              onChange={(e) => setTempContact({...tempContact, telefono: e.target.value})}
              disabled={!isEditingContact}
              className={!isEditingContact ? "input-readonly" : ""}
            />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              value={isEditingContact ? tempContact.direccion : configData.direccion}
              onChange={(e) => setTempContact({...tempContact, direccion: e.target.value})}
              disabled={!isEditingContact}
              className={!isEditingContact ? "input-readonly" : ""}
            />
          </div>
        </div>
      </div>

      {/* --- TARJETA 2: REDES SOCIALES OFICIALES --- */}
      <div className="config-card" style={{ marginTop: "30px" }}>
        <div className="config-card-header">
          <div>
            <h2 className="config-card-title">Redes sociales oficiales</h2>
            <p className="config-card-subtitle">Enlaces visibles en el portal público.</p>
          </div>
          
          <div className="config-actions">
            {!isEditingSocial ? (
              <>
                <button className="btn-config-add-red" onClick={handleAddNetwork}>
                  + Redes
                </button>
                <button className="btn-config-edit" onClick={() => { setTempSocial({...socialData}); setIsEditingSocial(true); }}>
                  Editar
                </button>
              </>
            ) : (
              <>
                <button className="btn-config-cancel" onClick={() => setIsEditingSocial(false)}>Cancelar</button>
                <button className="btn-config-save" onClick={handleSaveSocial}>Guardar</button>
              </>
            )}
          </div>
        </div>

        <div className="config-card-divider"></div>

        <div className="config-form-grid">
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Facebook</label>
            <input
              type="text"
              value={isEditingSocial ? tempSocial.facebook : socialData.facebook}
              onChange={(e) => setTempSocial({...tempSocial, facebook: e.target.value})}
              disabled={!isEditingSocial}
              className={!isEditingSocial ? "input-readonly" : ""}
            />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Instagram</label>
            <input
              type="text"
              value={isEditingSocial ? tempSocial.instagram : socialData.instagram}
              onChange={(e) => setTempSocial({...tempSocial, instagram: e.target.value})}
              disabled={!isEditingSocial}
              className={!isEditingSocial ? "input-readonly" : ""}
            />
          </div>
        </div>
      </div>

      {/* --- TARJETA 3: CONFIGURACIÓN DE BARRA DE NAVEGACIÓN (NAVBAR) --- */}
      <div className="config-card" style={{ marginTop: "30px" }}>
        <div className="config-card-header">
          <div>
            <h2 className="config-card-title">Navegación del Portal (Navbar)</h2>
            <p className="config-card-subtitle">Reordene o deshabilite secciones visibles en el encabezado público.</p>
          </div>
          <span className="badge-info-simulado">Modo Interactivo (Mock)</span>
        </div>

        <div className="config-card-divider"></div>

        <div className="nav-gestion-list">
          {navItems.map((item) => (
            <div className={`nav-gestion-row ${!item.visible ? 'disabled-row' : ''}`} key={item.id}>
              <div className="nav-item-info">
                <span className="nav-item-name">{item.name}</span>
                <span className="nav-item-path">{item.path}</span>
              </div>

              <div className="nav-item-controls">
                <div className="order-input-group">
                  <label>Orden:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={item.orden}
                    onChange={(e) => handleOrderChange(item.id, e.target.value)}
                  />
                </div>

                <div className="toggle-wrapper" onClick={() => handleToggleVisible(item.id)}>
                  <div className={`toggle-switch ${item.visible ? 'active' : ''}`}>
                    <div className="toggle-knob"></div>
                  </div>
                  {/* Corregido: usando operador ternario en lugar de división de strings */}
                  <span className="toggle-label">{item.visible ? "Visible" : "Oculto"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CmsConfiguracionView;