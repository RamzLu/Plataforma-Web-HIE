import React from "react";
import "../styles/components/NewsSection.css";
import AnimatedContent from "./AnimatedContent";

import mapaFormosa from "../assets/mapaFormosaParaNewsSection.png";
import logosGobierno from "../assets/logosGobierno.png";

const NewsSection = () => {
  return (
    <section className="news-section">
      <div className="news-container">
        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          <div className="news-header">
            <div className="news-title-group">
              <span className="news-subtitle">REQUISITOS Y PROCEDIMIENTOS</span>
              <h2 className="news-title">CÓMO SACAR TURNO</h2>
            </div>
          </div>
        </AnimatedContent>

        <div className="news-cards-grid">
          <AnimatedContent distance={50} direction="vertical" delay={0.15}>
            <div
              className="news-card"
              style={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              <div className="card-header-line">
                <span className="card-tag">SISTEMA DE TURNOS</span>
                <h4>
                  Hospital Interdistrital <strong>Evita</strong>
                </h4>
              </div>

              <h5 className="card-question">¿Venís por primera vez?</h5>

              <p className="card-paragraph">
                Para la atención en consultorios de las diferentes
                especialidades, los pedidos son solicitados por sistema de{" "}
                <strong>referencia</strong> y <strong>contrarreferencia</strong>{" "}
                emitido por el Centro de Salud más cercano a tu domicilio.
              </p>

              <div
                className="card-map-placeholder"
                style={{
                  marginTop: "auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1rem 0"
                }}
              >
                <img
                  src={mapaFormosa}
                  alt="Mapa de Formosa"
                  className="map-image"
                  style={{
                    maxHeight: "180px",
                    width: "auto",
                    objectFit: "contain",
                    filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.15))",
                    transition: "transform 0.3s ease"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>

              <div className="card-logos-placeholder">
                <img
                  src={logosGobierno}
                  alt="Logos Ministerio y Gobierno"
                  className="logos-image"
                  style={{ transition: "opacity 0.3s", opacity: 0.9 }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "0.9")}
                />
              </div>
            </div>
          </AnimatedContent>

          <AnimatedContent distance={50} direction="vertical" delay={0.25}>
            <div
              className="news-card"
              style={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              <div className="card-header-line">
                <span className="card-tag">TURNO PRESENCIAL</span>
                <h4>Si ya sos paciente institucional</h4>
              </div>

              <div className="card-list-item">
                <span className="bullet-icon">•</span>
                <p>
                  Se brindan turnos con cada especialista según nuestro{" "}
                  <strong>calendario mensual</strong>. Debés presentar:
                </p>
              </div>

              <div className="info-pills-grid">
                <div
                  className="info-pill"
                  style={{ transition: "all 0.3s ease", cursor: "default" }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>D.N.I. del paciente</span>
                </div>

                <div
                  className="info-pill"
                  style={{ transition: "all 0.3s ease", cursor: "default" }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  <span>Interconsulta Médica</span>
                </div>

                <div
                  className="info-pill"
                  style={{ transition: "all 0.3s ease", cursor: "default" }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>A partir de las 06:00 Hs.</span>
                </div>

                <div
                  className="info-pill"
                  style={{ transition: "all 0.3s ease", cursor: "default" }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>Av. 28 de Junio N° 250</span>
                </div>
              </div>

              <div className="card-list-item">
                <span className="bullet-icon">•</span>
                <p>
                  Pacientes derivados del Hospital de Alta Complejidad deben
                  presentar <strong>ficha de derivación</strong>.
                </p>
              </div>

              {/* SOLUCIÓN APLICADA AQUÍ: Incorporamos los logos a la 2da tarjeta y le damos margen top automático */}
              <div className="card-logos-placeholder" style={{ marginTop: "auto" }}>
                <img
                  src={logosGobierno}
                  alt="Logos Ministerio y Gobierno"
                  className="logos-image"
                  style={{ transition: "opacity 0.3s", opacity: 0.9 }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "0.9")}
                />
              </div>
            </div>
          </AnimatedContent>

          <AnimatedContent distance={50} direction="vertical" delay={0.35}>
            <div
              className="news-card"
              style={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              <div className="card-header-line">
                <span className="card-tag alert">RECOMENDACIÓN</span>
                <h4>INFORMACIÓN IMPORTANTE</h4>
              </div>

              <div className="important-items">
                <div
                  className="important-item"
                  style={{ transition: "background 0.3s ease", padding: "8px", borderRadius: "8px" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="imp-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </div>
                  <p>
                    Los turnos <strong>no</strong> se brindan telefónicamente a
                    pacientes.
                  </p>
                </div>

                <div
                  className="important-item"
                  style={{ transition: "background 0.3s ease", padding: "8px", borderRadius: "8px" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.02)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="imp-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <p>
                    Para <strong>reagendar</strong> un turno, debés dar aviso
                    presencial o telefónico con al menos 24 hs. de anticipación.
                  </p>
                </div>
              </div>

              <div
                className="important-phone"
                style={{
                  marginTop: "auto",
                  background: "linear-gradient(135deg, rgba(230,240,255,0.6) 0%, rgba(200,220,255,0.6) 100%)",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0, 51, 102, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  color: "#003366",
                  fontWeight: "bold",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 12px rgba(0,0,0,0.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "20px", height: "20px" }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>4445561 - 4445541</span>
              </div>
              <div className="card-logos-placeholder">
                <img
                  src={logosGobierno}
                  alt="Logos Ministerio y Gobierno"
                  className="logos-image"
                  style={{ transition: "opacity 0.3s", opacity: 0.9 }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "0.9")}
                />
              </div>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;