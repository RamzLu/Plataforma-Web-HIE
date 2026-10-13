import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMapPin, FiMap, FiMenu, FiX } from "react-icons/fi";
import "../../styles/layout/Header.css";
import logoCompleto from "../../assets/logo-completo.png";
import HospitalLocationModal from "../ui/HospitalLocationModal"; 

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false); 
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleOpenModal = () => setIsLocationModalOpen(true);
    window.addEventListener("openLocationModal", handleOpenModal);
    
    return () => window.removeEventListener("openLocationModal", handleOpenModal);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleNavClick = () => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
  };

  return (
    <header className="hospital-header-container">
      <div className="hospital-main-nav">
        <Link to="/" className="brand-container" onClick={handleNavClick}>
          <img src={logoCompleto} alt="Hospital Evita" className="header-logo-img" />
        </Link>
        <div 
          ref={sidebarRef} 
          className={`nav-content-wrapper ${isMenuOpen ? "active" : ""}`}
        >
          <nav aria-label="Menú principal">
            <ul className="nav-menu-list">
              <li><Link to="/" onClick={handleNavClick} className={`nav-link-item ${isActive("/") ? "active" : ""}`}>INICIO</Link></li>
              <li><Link to="/especialidades" onClick={handleNavClick} className={`nav-link-item ${isActive("/especialidades") ? "active" : ""}`}>ESPECIALIDADES</Link></li>
              <li><Link to="/noticias" onClick={handleNavClick} className={`nav-link-item ${isActive("/noticias") ? "active" : ""}`}>NOTICIAS</Link></li>
              <li><Link to="/documentacion" onClick={handleNavClick} className={`nav-link-item ${isActive("/documentacion") ? "active" : ""}`}>DOCUMENTACIÓN</Link></li>
              <li><Link to="/capacitacion" onClick={handleNavClick} className={`nav-link-item ${isActive("/capacitacion") ? "active" : ""}`}>CAPACITACIÓN</Link></li>
              <li><Link to="/residencias" onClick={handleNavClick} className={`nav-link-item ${isActive("/residencias") ? "active" : ""}`}>RESIDENCIAS</Link></li>
              <li><Link to="/profesionales" onClick={handleNavClick} className={`nav-link-item ${isActive("/profesionales") ? "active" : ""}`}>PROFESIONALES</Link></li>
              <li><Link to="/contacto" onClick={handleNavClick} className={`nav-link-item ${isActive("/contacto") ? "active" : ""}`}>CONTACTO</Link></li>
              <li><Link to="/acerca-de" onClick={handleNavClick} className={`nav-link-item ${isActive("/acerca-de") ? "active" : ""}`}>ACERCA DE</Link></li>
            </ul>
          </nav>
        </div>

        <div className="header-controls">
          <div className="nav-actions-group">
            <button 
              type="button"
              onClick={() => {
                handleNavClick(); 
                setIsLocationModalOpen(true); 
              }} 
              className="btn-location-action" 
              title="Ubicación"
            >
              <div className="action-icon-bubble">
                <FiMapPin size={15} strokeWidth={2.5} />
              </div>
              <div className="action-text-wrapper">
                <span className="action-eyebrow">ACCESO</span>
                <span className="action-title">Ubicación</span>
              </div>
            </button>

            <Link to="/plano" onClick={handleNavClick} className="btn-blueprint-action" title="Plano Institucional">
              <FiMap size={18} strokeWidth={2.2} className="blueprint-icon" />
              <div className="action-text-wrapper">
                <span className="action-eyebrow">EDIFICIO</span>
                <span className="action-title">Plano Institucional</span>
              </div>
            </Link>
          </div>

          <button 
            ref={buttonRef}
            className="mobile-menu-btn" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Alternar menú"
          >
            {isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
          </button>
        </div>
      </div>

      <div className="hospital-bottom-gradient-border"></div>
      <HospitalLocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />
    </header>
  );
};

export default Header;