import React from "react";
import "./Header.css";

import logoIcon from "../assets/pngIcon.png";

const Header = () => {
  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo-container">
          <a href="/">
            <img src={logoIcon} alt="Logo Red Evita Formosa" className="logo" />
          </a>
        </div>

        <nav className="header-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <a href="#inicio" className="active">
                INICIO
              </a>
            </li>
            <li className="nav-item">
              <a href="#especialidades">ESPECIALIDADES</a>
            </li>
            <li className="nav-item">
              <a href="#noticias">NOTICIAS</a>
            </li>
            <li className="nav-item">
              <a href="#documentacion">DOCUMENTACIÓN</a>
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
