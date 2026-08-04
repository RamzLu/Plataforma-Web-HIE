import React from 'react';
import './Header.css';

// 1. Importamos la imagen dinámicamente desde la carpeta assets
import logoIcon from '../assets/pngIcon.png';

const Header = () => {
  return (
    <header className="main-header">
      <div className="header-container">
        {/* 2. Usamos la variable importada en el atributo src */}
        <div className="logo-container">
          <img src={logoIcon} alt="Logo Red Evita Formosa" className="logo" />
        </div>

        {/* Menú de navegación principal */}
        <nav className="header-nav">
          <ul className="nav-list">
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