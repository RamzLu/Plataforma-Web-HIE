import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import logoIcon from "../assets/pngIcon.png";

const Header = () => {
  const location = useLocation();

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo-container">
          <Link to="/">
            <img src={logoIcon} alt="Logo Red Evita Formosa" className="logo" />
          </Link>
        </div>

        <nav className="header-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link
                to="/"
                className={location.pathname === "/" ? "active" : ""}
              >
                INICIO
              </Link>
            </li>
            <li className="nav-item">
              {/* Navegamos al ID de la misma página si estamos en el Home */}
              <a href="/#especialidades">ESPECIALIDADES</a>
            </li>
            <li className="nav-item">
              <Link
                to="/noticias"
                className={location.pathname === "/noticias" ? "active" : ""}
              >
                NOTICIAS
              </Link>
            </li>
            <li className="nav-item">
              <a href="/#documentacion">DOCUMENTACIÓN</a>
            </li>
            <li className="nav-item">
              <a href="#contacto">CONTACTO</a>
            </li>
            <li className="nav-item">
              <a href="#profesionales">PROFESIONALES</a>
            </li>
            <li className="nav-item">
              <a href="#acerca-de">ACERCA DE</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
