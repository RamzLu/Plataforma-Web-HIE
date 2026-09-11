import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiSearch, FiArrowUpRight } from "react-icons/fi";
import "../../styles/layout/Header.css";
import logoCompleto from "../../assets/logo-completo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Secciones eINFORMACIÓN importante del sitio web del hospital
  const searchDatabase = [
    { title: "Especialidades médicas y servicios", type: "SECCIÓN", path: "/especialidades" },
    { title: "Últimas noticias y comunicados", type: "SECCIÓN", path: "/noticias" },
    { title: "Documentación y trámites", type: "SECCIÓN", path: "/documentacion" },
    { title: "Capacitaciones institucionales", type: "SECCIÓN", path: "/capacitacion" },
    { title: "Plantel de profesionales médicos", type: "SECCIÓN", path: "/profesionales" },
    { title: "Información de contacto y guardias", type: "SECCIÓN", path: "/contacto" },
    { title: "Acerca del Hospital Interdistrital Evita", type: "SECCIÓN", path: "/acerca-de" }
  ];

  const filteredSuggestions = searchTerm.trim() === "" 
    ? searchDatabase.slice(0, 5) 
    : searchDatabase.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/buscar") {
      setSearchTerm("");
    }
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setShowDropdown(false);
    navigate(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleSelectSuggestion = (path) => {
    setShowDropdown(false);
    setSearchTerm("");
    navigate(path);
  };

  const handleGlobalSearchClick = () => {
    if (!searchTerm.trim()) return;
    setShowDropdown(false);
    navigate(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="header-brand" onClick={closeMenu}>
          <img src={logoCompleto} alt="Hospital Evita" className="header-logo" />
        </Link>

        <div className="header-search-container" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="header-search-form">
            <span className="search-icon-wrapper">
            <FiSearch className="search-icon-svg" />
            </span>
            <input
              type="text"
              placeholder="Buscar secciones, servicios..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowDropdown(false);
                }, 200);
              }}
              className="header-search-input"
            />
          </form>

          {showDropdown && (
            <div className="search-dropdown-results">
              <div className="dropdown-section-title">Secciones principales</div>
              <ul>
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((item, index) => (
                    <li key={index} onClick={() => handleSelectSuggestion(item.path)}>
                      <div className="suggestion-info">
                        <span className="suggestion-badge">{item.type}</span>
                        <span className="suggestion-text">{item.title}</span>
                      </div>
                      <FiArrowUpRight className="suggestion-arrow" size={14} />
                    </li>
                  ))
                ) : (
                  <li className="no-results">No se encontraron secciones directas</li>
                )}

                {searchTerm.trim() !== "" && (
                  <li className="global-search-option" onClick={handleGlobalSearchClick}>
                    <FiSearch size={14} style={{ marginRight: '8px' }} />
                    <span>Buscar <strong>"{searchTerm}"</strong> en todo el sitio...</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          className={`hamburger-btn ${isMenuOpen ? "open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle Navigation Menu"
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>

        <nav className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          <ul className="nav-list">
            <li><Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`} onClick={closeMenu}>INICIO</Link></li>
            <li><Link to="/especialidades" className={`nav-link ${isActive("/especialidades") ? "active" : ""}`} onClick={closeMenu}>ESPECIALIDADES</Link></li>
            <li><Link to="/noticias" className={`nav-link ${isActive("/noticias") ? "active" : ""}`} onClick={closeMenu}>NOTICIAS</Link></li>
            <li><Link to="/documentacion" className={`nav-link ${isActive("/documentacion") ? "active" : ""}`} onClick={closeMenu}>DOCUMENTACIÓN</Link></li>
            <li><Link to="/capacitacion" className={`nav-link ${isActive("/capacitacion") ? "active" : ""}`} onClick={closeMenu}>CAPACITACIÓN</Link></li>
            <li><Link to="/profesionales" className={`nav-link ${isActive("/profesionales") ? "active" : ""}`} onClick={closeMenu}>PROFESIONALES</Link></li>
            <li><Link to="/contacto" className={`nav-link ${isActive("/contacto") ? "active" : ""}`} onClick={closeMenu}>CONTACTO</Link></li>
            <li><Link to="/acerca-de" className={`nav-link ${isActive("/acerca-de") ? "active" : ""}`} onClick={closeMenu}>ACERCA DE</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;