import React, { useState, useMemo, useEffect, useRef } from "react";
import "../../styles/pages/CapacitacionPage.css";
import PageBanner from "../../components/PageBanner";
import AnimatedContent from "../../components/ui/AnimatedContent";
import fondoBanner from "../../assets/banner_capacitaciones.png";

// Imágenes y catálogo armonizado con las especificaciones de diseño de las compañeras
const CAPACITACIONES_INITIAL = [
  {
    id: 1,
    titulo: "Abordaje Inicial del Accidente Cerebrovascular (ACV)",
    descripcion:
      "Algoritmo de actuación en ventana terapéutica crítica, criterios de trombolisis sistémica y coordinación rápida entre la guardia de emergencias y la unidad de cuidados intensivos del HIE.",
    contenidoCompleto:
      "Módulo 1: Reconocimiento precoz y aplicación de la escala Cincinnati.\nMódulo 2: Criterios clínicos de inclusión y exclusión para trombolisis endovenosa.\nMódulo 3: Activación del protocolo Código ACV institucional del HIE.\nMódulo 4: Cuidados intensivos de enfermería crítica y neuroprotección en shock room.",
    categoria: "video",
    badgeLabel: "VIDEO ON-DEMAND",
    badgeIcon: "play_circle",
    badgeClass: "badge-video",
    fecha: "20 de Mayo de 2026",
    modalidad: "Virtual",
    duracionOInfo: "10:00 hs. • 45 min",
    formatoOPlataforma: "Campus Virtual HIE",
    iconLeft: "schedule",
    iconRight: "laptop_chromebook",
    btnText: "Reproducir Video",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0l6rG6l1pwjqcvHir9EgAsn5StiUBuE_6q4TkGO6j-uCW8as308zSvgdFz6mXNSGUqTYu0uixxnR5YcOY4YCLe7NWPKhxKisz7N5TL6E87wtlLkf2hfXyv99yvTweTcP35YnT9jxHvACfPWt-sY_ce5SELt0kgUNbP5W-m46FAYE3mR6Ye_74qX4z1zuY3gYryOpOPAP9skSR8mxJ8dRqmlVSZ63LqpGuaFT6QUrU",
    enlaceAccion: "https://campus.hospitalevita.formosa.gob.ar/acv",
    pdfUrl: "/docs/protocolo-acv-hie.pdf",
  },
  {
    id: 2,
    titulo: "Guía Clínica de Reanimación Cardiopulmonar Avanzada (PALS)",
    descripcion:
      "Normas operativas actualizadas para el soporte vital pediátrico, dosificación rápida en shock y vías aéreas complejas según los estándares hospitalarios de Formosa.",
    contenidoCompleto:
      "Pautas pediátricas basadas en consensos internacionales adaptadas a la red de salud provincial. Incluye diagramas de flujo para arritmias letales, dosificación miligramo/kilo por código de color y manejo de desfibriladores automáticos y manuales.",
    categoria: "pdf",
    badgeLabel: "GUÍA PDF",
    badgeIcon: "picture_as_pdf",
    badgeClass: "badge-pdf",
    fecha: "18 de Mayo de 2026",
    modalidad: "Clínica",
    duracionOInfo: "32 páginas • PDF Interactivo",
    formatoOPlataforma: "4.2 MB",
    iconLeft: "description",
    iconRight: "download",
    btnText: "Abrir PDF",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDzjPhcaBj_y_5-wNuvD42gVC02GMZ75IYrUKmAtQ-xJn7b-s-lGQv1SWJqKfWmA97yNUgSr1eyCQTe27KUUycAKAgMZb6TK0CQro9tJj59fb3B4DIeYKCCauOddR7KrvcsAVC-1SiYNmP_ndBVnDEFl3MYHK9HNlNm2shAekKRT89XBtmXeJeRFbrfu0LLzYNUe5Ge_WMi5Jqlkum5BicGDFTlLSryMdOqIzNcn4l6",
    enlaceAccion: "/docs/guia-pals-pediatria-hie.pdf",
    pdfUrl: "/docs/guia-pals-pediatria-hie.pdf",
  },
  {
    id: 3,
    titulo: "Manejo y Detección Temprana del Dengue en Atención Primaria",
    descripcion:
      "Esquema infográfico de signos de alarma clínica, hidratación oral protocolizada, control hematológico seriado y criterios de derivación al tercer nivel de complejidad.",
    contenidoCompleto:
      "Material didáctico para distribución en centros de salud y consultorios periféricos. Sintetiza las fases febril, crítica y de recuperación, con semaforización de hematocrito y plaquetas para la oportuna derivación hospitalaria.",
    categoria: "infografia",
    badgeLabel: "INFOGRAFÍA",
    badgeIcon: "view_quilt",
    badgeClass: "badge-infografia",
    fecha: "15 de Mayo de 2026",
    modalidad: "Salud Pública",
    duracionOInfo: "Poster Digital HD",
    formatoOPlataforma: "Uso Comunitario",
    iconLeft: "image",
    iconRight: "share",
    btnText: "Ver Infografía",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA6WZkmoGLBmnJH1XszGgJwxgC1QpV989Uh-mLMsfAetSZTS6AFnC7zmc8ZzqTY5XvMiELZuFLlqtOjEbQ_SjxEwjOtNkhjSXQYwbmnGFLvGTpJRgl-ArZSgJaG0oZ1LzewdJwM7SYN8MJp7WmgCtbKnp2KG8CCu_v3aMIPwOtL59ortrxO48do_c7YWc3a65zUiD1UhJqrCFava02p0TaXFk51Yi7YdxLJgDOlMn4a",
    enlaceAccion: "/docs/infografia-dengue-hie.pdf",
    pdfUrl: "/docs/infografia-dengue-hie.pdf",
  },
  {
    id: 4,
    titulo: "Actualización en Protocolos de Bioseguridad y Control de Infecciones",
    descripcion:
      "Medidas de aislamiento por contacto y vía aérea, esterilización hospitalaria centralizada y estrategias para la prevención de bacterias multirresistentes en áreas cerradas.",
    contenidoCompleto:
      "Curso estructurado en 4 módulos audiovisuales para el personal de internación, quirófano y unidades de cuidados intensivos. Evaluación final con certificación expedida por el Comité de Control de Infecciones del HIE.",
    categoria: "video",
    badgeLabel: "VIDEO ON-DEMAND",
    badgeIcon: "play_circle",
    badgeClass: "badge-video",
    fecha: "12 de Mayo de 2026",
    modalidad: "Epidemiología",
    duracionOInfo: "60 min • 4 Módulos",
    formatoOPlataforma: "Certificado Oficial",
    iconLeft: "schedule",
    iconRight: "verified",
    btnText: "Reproducir Video",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0EROwRr_jtAZ7imEQC0g5m7aiI1yth482a-yT67I47ePzETvVkOUrsCyI7K1YjuLeqJmdK1PV_tAC-cc86xYPv2pDBPZNO438-QW3QHxpvHo3szl9XyTmljsvNPfuN9krmiKQw5IjiVqXIab4d5xoAam8J0OwSNbNqfOupZ0YYEzZ0eeY0QmzqoJUCRmdbQ8ZTrg9UokXmffDx9ZV1XzZV8o-29NYhBkVTFRzYIXc",
    enlaceAccion: "https://campus.hospitalevita.formosa.gob.ar/bioseguridad",
    pdfUrl: "/docs/manual-bioseguridad-hie.pdf",
  },
  {
    id: 5,
    titulo: "Manual Farmacoterapéutico en Urgencias Pediátricas",
    descripcion:
      "Tablas de dilución rápida por kilogramo de peso, compatibilidades endovenosas y pautas de administración segura en el área de reanimación y terapia intermedia.",
    contenidoCompleto:
      "Compendio farmacológico de bolsillo para médicos pediatras y enfermeros. Cubre drogas inotrópicas, sedoanalgesia en intubación de secuencia rápida y corrección hidroelectrolítica de emergencia.",
    categoria: "pdf",
    badgeLabel: "GUÍA PDF",
    badgeIcon: "picture_as_pdf",
    badgeClass: "badge-pdf",
    fecha: "08 de Mayo de 2026",
    modalidad: "Farmacia",
    duracionOInfo: "54 páginas • Edición 2026",
    formatoOPlataforma: "6.8 MB",
    iconLeft: "description",
    iconRight: "download",
    btnText: "Abrir PDF",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCTZrXAiKDMSwlnJL-0gBXop50NK7LiTAsGsi4ASLscLAK8zMPlRzZQ0XYKOzlGSo8x8V4e2Yq0XXp0_N4b2dZppuB6WqzdLWV5nRDNMdyW5N2jkLKhu0Es6L2ZvHjk_lZ8Bo7pnyWpvLSd5nYAjkQDS4Rlo0vt-BiO2EETVK_MQcBDUyRshfbv-vFIscEg4P159sHEMk97ueD0kWMJ_Ul4bV2KF-Y1GpnxcXFIDpns",
    enlaceAccion: "/docs/manual-farmacia-pediatrica.pdf",
    pdfUrl: "/docs/manual-farmacia-pediatrica.pdf",
  },
  {
    id: 6,
    titulo: "Ateneo Interdisciplinario: Abordaje del Paciente Oncológico Crítico",
    descripcion:
      "Discusión de casos clínicos de alta complejidad, manejo del dolor, complicaciones neutropénicas febriles y articulación con el Servicio de Cuidados Paliativos.",
    contenidoCompleto:
      "Sesión clínica periódica con participación de oncólogos, hematólogos, intensivistas, nutricionistas y trabajadores sociales. Transmisión simultánea vía Zoom con acceso para profesionales de toda la provincia.",
    categoria: "ateneo",
    badgeLabel: "ATENEO CLÍNICO",
    badgeIcon: "groups",
    badgeClass: "badge-ateneo",
    fecha: "04 de Mayo de 2026",
    modalidad: "Auditorio",
    duracionOInfo: "11:30 hs. • Presencial / Zoom",
    formatoOPlataforma: "Auditorio A - HIE",
    iconLeft: "schedule",
    iconRight: "meeting_room",
    btnText: "Acceder al Ateneo",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4N9P2HlG5v3CLDsFlrOLl01XDii-DITQ4ctOmY4kE1ndrJGMRLF2lFila-FUjREzFuprOESyrdt5Md3sWPuqq6aZpbQoiFkG35uhXSgD2m_b3yhNuQrO0dTbTzI-CPaulDW2swb4oKNVKKN3GilQfSeraEkTRqTzgJVeJIIQAoD8tdKqXuY6K_hrX41HQcRmIYDbyIVgCGIf9jrm-7Xwf2f1uK-72FFSdRvtmJ28l",
    enlaceAccion: "https://zoom.us/j/ateneo-oncologia-hie",
    pdfUrl: "/docs/caso-clinico-ateneo-oncologia.pdf",
  },
];

const CATEGORIAS_FILTRO = [
  { id: "all", label: "TODOS" },
  { id: "video", label: "VIDEOS" },
  { id: "pdf", label: "GUÍAS PDF" },
  { id: "infografia", label: "INFOGRAFÍAS" },
  { id: "ateneo", label: "ATENEOS" },
];

const CapacitacionPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Elementos filtrados por categoría y por texto de búsqueda
  const itemsFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return CAPACITACIONES_INITIAL.filter((item) => {
      const matchCategory =
        activeFilter === "all" || item.categoria === activeFilter;

      const matchSearch =
        !term ||
        item.titulo.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term) ||
        item.modalidad.toLowerCase().includes(term);

      return matchCategory && matchSearch;
    });
  }, [activeFilter, searchTerm]);

  const handleOpenWhatsapp = (item) => {
    const mensaje = encodeURIComponent(
      `Hola! Quisiera más información sobre la capacitación: ${item?.titulo || "Capacitaciones HIE"}`
    );
    window.open(`https://wa.me/?text=${mensaje}`, "_blank");
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
  };

  return (
    <main className="documentacion-page capacitacion-page-root">
      {/* ==========================================================================
          1. BANNER INSTITUCIONAL UNIFICADO (Información pública y comunitaria)
          ========================================================================== */}
      <PageBanner
        currentPage="capacitaciones"
        title="CAPACITACIONES Y CHARLAS"
        subtitle="Capacitaciones, talleres formativos y charlas abiertas para toda la comunidad y el equipo de salud."
        image={fondoBanner}
        marginBottom={0}
      />

      <div className="documentacion-container capacitacion-container">
        {/* ==========================================================================
            2. BUSCADOR INSTITUCIONAL EN PÍLDORA (Ubicación inmediatamente bajo el banner)
            ========================================================================== */}
        <div className="doc-search-wrapper">
          <div className="doc-search-bar">
            <svg
              className="doc-search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="doc-search-input"
              placeholder="Buscar capacitación, taller, charla o ateneo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="doc-search-spacer" />
          </div>
        </div>

        {/* ==========================================================================
            3. FILTROS DE CATEGORÍA CHIPS (Estilo idéntico a Documentos)
            ========================================================================== */}
        <div className="doc-filters">
          {CATEGORIAS_FILTRO.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`filter-chip ${activeFilter === cat.id ? "active" : ""}`}
              onClick={() => setActiveFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ==========================================================================
            4. CONTENIDO PRINCIPAL: GRILLA EDITORIAL (Cápsulas/Cartas con el diseño de las compañeras)
            ========================================================================== */}
        <div className="w-full-anim-wrapper">
          <AnimatedContent distance={30} direction="vertical" delay={0.08}>
            <div className="cap-grid-section">
              <div className="cap-section-header">
                <div className="flex flex-col">
                  <span className="cap-section-overline">
                    Ciclo de Formación 2026
                  </span>
                  <h2 className="cap-section-title">
                    Capacitaciones y Charlas Comunitarias y Profesionales
                  </h2>
                </div>

                <div
                  className="cap-counter-box"
                  role="status"
                  aria-live="polite"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    auto_stories
                  </span>
                  <span id="training-counter">
                    Mostrando {itemsFiltrados.length} capacitaci
                    {itemsFiltrados.length === 1 ? "ón disponible" : "ones disponibles"}
                  </span>
                </div>
              </div>

              {itemsFiltrados.length === 0 ? (
                <div className="cap-no-results">
                  <span className="material-symbols-outlined text-[48px]">
                    sentiment_dissatisfied
                  </span>
                  <h3>No se encontraron capacitaciones</h3>
                  <p>Intenta con otro término de búsqueda o selecciona otra categoría.</p>
                  <button
                    type="button"
                    className="filter-chip active"
                    onClick={() => {
                      setSearchTerm("");
                      setActiveFilter("all");
                    }}
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div className="cap-cards-grid" id="training-grid">
                  {itemsFiltrados.map((item, index) => (
                    <AnimatedContent
                      key={item.id}
                      distance={25}
                      direction="vertical"
                      delay={index * 0.05}
                      threshold={0.1}
                      className="h-full"
                    >
                      <article
                        className="training-card group"
                        data-category={item.categoria}
                        onClick={() => handleOpenModal(item)}
                      >
                        <div className="training-card-top">
                          {/* Cabecera Gráfica con Proporción 16:9 y Badge Temático */}
                          <div className="training-media-container">
                            <img
                              className="training-media-img"
                              src={item.imageUrl}
                              alt={item.titulo}
                              loading="lazy"
                            />
                            <span className={`training-floating-badge ${item.badgeClass}`}>
                              <span className="material-symbols-outlined text-[14px]">
                                {item.badgeIcon}
                              </span>
                              <span>{item.badgeLabel}</span>
                            </span>
                          </div>

                          {/* Cuerpo Editorial de la Tarjeta */}
                          <div className="training-card-body">
                            <div className="training-date-tag">
                              <span className="material-symbols-outlined text-[15px]">
                                event
                              </span>
                              <span>
                                {item.fecha} • {item.modalidad}
                              </span>
                            </div>

                            <h3 className="training-card-title">{item.titulo}</h3>

                            <p className="training-card-desc">
                              {item.descripcion}
                            </p>

                            <div className="training-card-divider" />

                            <div className="training-card-meta">
                              <div className="training-meta-item">
                                <span className="material-symbols-outlined text-[16px]">
                                  {item.iconLeft}
                                </span>
                                <span>{item.duracionOInfo}</span>
                              </div>
                              <div className="training-meta-item">
                                <span className="material-symbols-outlined text-[16px]">
                                  {item.iconRight}
                                </span>
                                <span>{item.formatoOPlataforma}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botón de Acción Anclado */}
                        <div className="training-card-action">
                          <button
                            type="button"
                            className="training-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(item);
                            }}
                            aria-label={`${item.btnText}: ${item.titulo}`}
                          >
                            <span>{item.btnText}</span>
                            <span className="material-symbols-outlined text-[18px]">
                              arrow_forward
                            </span>
                          </button>
                        </div>
                      </article>
                    </AnimatedContent>
                  ))}
                </div>
              )}
            </div>
          </AnimatedContent>
        </div>

        {/* ==========================================================================
            5. BANNER INFORMATIVO: ACCESO A LA REVISTA CIENTÍFICA
            ========================================================================== */}
        <section className="cap-docencia-section">
          <div className="cap-docencia-card">
            <div className="cap-docencia-left">
              <div className="cap-docencia-icon-box">
                <span className="material-symbols-outlined text-[28px]">
                  menu_book
                </span>
              </div>
              <div className="flex flex-col">
                <h4 className="cap-docencia-title">
                  Revista Científica y Publicaciones Médicas
                </h4>
                <p className="cap-docencia-desc">
                  ¿Querés conocer más? ¿Sos especialista y querés investigar o ver material clínico específico?
                  Ingresá a nuestra revista científica para acceder a artículos, protocolos e investigaciones especializadas del hospital.
                </p>
              </div>
            </div>

            <div className="cap-docencia-right">
              <a
                className="cap-docencia-btn"
                href="https://revista.hospitalinterdistrital.gob.ar"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Ingresar a la Revista Científica</span>
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ verticalAlign: "middle", marginLeft: "6px" }}
                >
                  open_in_new
                </span>
              </a>
            </div>
          </div>
        </section>
      </div>

{/* ==========================================================================
          6. MODAL DETALLADO DE CAPACITACIÓN / CHARLAS
          ========================================================================== */}
{
  selectedItem && (
    <div
      className="cap-modal-backdrop"
      onClick={() => setSelectedItem(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cap-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cap-modal-header">
          <div className="flex items-center gap-2">
            <span className={`training-floating-badge ${selectedItem.badgeClass} static`}>
              <span className="material-symbols-outlined text-[15px]">
                {selectedItem.badgeIcon}
              </span>
              <span>{selectedItem.badgeLabel}</span>
            </span>
            <span className="text-secondary text-xs font-semibold" style={{ color: "#475569" }}>
              {selectedItem.modalidad}
            </span>
          </div>
          <button
            type="button"
            className="cap-modal-close-btn"
            onClick={() => setSelectedItem(null)}
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="cap-modal-content">
          <div className="cap-modal-image-box">
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.titulo}
              className="cap-modal-img"
            />
          </div>

          <h2 className="cap-modal-headline">
            {selectedItem.titulo}
          </h2>

          <p className="cap-modal-lead">
            {selectedItem.descripcion}
          </p>

          <div className="cap-modal-meta-grid">
            <div className="cap-modal-meta-card">
              <span className="cap-meta-card-label">
                Fecha y Horario
              </span>
              <span className="cap-meta-card-value">
                {selectedItem.fecha} • {selectedItem.duracionOInfo}
              </span>
            </div>
            <div className="cap-modal-meta-card">
              <span className="cap-meta-card-label">
                Sede / Formato
              </span>
              <span className="cap-meta-card-value">
                {selectedItem.formatoOPlataforma}
              </span>
            </div>
          </div>

          {selectedItem.contenidoCompleto && (
            <div className="cap-modal-topics-box">
              <h4 className="cap-topics-heading">
                Ejes Temáticos y Contenido:
              </h4>
              <div>
                {selectedItem.contenidoCompleto.split("\n").map((line, i) => (
                  <p
                    key={i}
                    style={{
                      color: "#475569",
                      margin: "0 0 6px 0",
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cap-modal-footer">
          <button
            type="button"
            className="cap-modal-btn-wa"
            onClick={() => handleOpenWhatsapp(selectedItem)}
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Consultar por WhatsApp</span>
          </button>

          <a
            href={selectedItem.enlaceAccion || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="cap-modal-btn-primary"
          >
            <span>{selectedItem.btnText}</span>
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
    </main >
  );
};

export default CapacitacionPage;
