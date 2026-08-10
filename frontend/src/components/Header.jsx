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
              <Link
                to="/especialidades"
                className={
                  location.pathname === "/especialidades" ? "active" : ""
                }
              >
                ESPECIALIDADES
              </Link>
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
              <Link
                to="/documentacion"
                className={
                  location.pathname === "/documentacion" ? "active" : ""
                }
              >
                DOCUMENTACIÓN
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/profesionales"
                className={
                  location.pathname === "/profesionales" ? "active" : ""
                }
              >
                PROFESIONALES
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/capacitacion"
                className={
                  location.pathname === "/capacitacion" ? "active" : ""
                }
              >
                CAPACITACIÓN
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/contacto"
                className={location.pathname === "/contacto" ? "active" : ""}
              >
                CONTACTO
              </Link>
            </li>
            <li className="nav-item">
              <a href="/#acerca-de">ACERCA DE</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
