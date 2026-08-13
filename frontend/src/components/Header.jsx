import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import logoIcon from "../assets/logoHospitalEvita.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="header-brand" onClick={closeMenu}>
          <img src={logoIcon} alt="Hospital Evita" className="header-logo" />
          <div className="brand-text">
            <span className="brand-title">HOSPITAL INTERDISTRITAL</span>
            <span className="brand-subtitle">EVITA</span>
          </div>
        </Link>
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
            <li>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
                onClick={closeMenu}
              >
                INICIO
              </Link>
            </li>
            <li>
              <Link
                to="/especialidades"
                className={`nav-link ${isActive("/especialidades") ? "active" : ""}`}
                onClick={closeMenu}
              >
                ESPECIALIDADES
              </Link>
            </li>
            <li>
              <Link
                to="/noticias"
                className={`nav-link ${isActive("/noticias") ? "active" : ""}`}
                onClick={closeMenu}
              >
                NOTICIAS
              </Link>
            </li>
            <li>
              <Link
                to="/documentacion"
                className={`nav-link ${isActive("/documentacion") ? "active" : ""}`}
                onClick={closeMenu}
              >
                DOCUMENTACIÓN
              </Link>
            </li>
            <li>
              <Link
                to="/capacitacion"
                className={`nav-link ${isActive("/capacitacion") ? "active" : ""}`}
                onClick={closeMenu}
              >
                CAPACITACIÓN
              </Link>
            </li>
            <li>
              <Link
                to="/profesionales"
                className={`nav-link ${isActive("/profesionales") ? "active" : ""}`}
                onClick={closeMenu}
              >
                PROFESIONALES
              </Link>
            </li>
            <li>
              <Link
                to="/contacto"
                className={`nav-link ${isActive("/contacto") ? "active" : ""}`}
                onClick={closeMenu}
              >
                CONTACTO
              </Link>
            </li>
            <li>
              <Link
                to="/acerca-de"
                className={`nav-link ${isActive("/acerca-de") ? "active" : ""}`}
                onClick={closeMenu}
              >
                ACERCA DE
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
