import React, { useEffect } from "react";
import "../../styles/pages/ContactoPage.css";
import Breadcrumb from "../../components/Breadcrumb";
import AnimatedContent from "../../components/ui/AnimatedContent";
import fotoAtencion from "../../assets/fotoContacto.jpg";

const ContactoPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const phoneCards = [
    {
      id: 'guardia',
      badge: { text: '24 HS', type: 'emergency' },
      title: 'Guardia y Urgencias',
      description: 'Atención médica de urgencia las 24 horas del día, los 365 días del año con triage de alta complejidad e internación crítica.',
      label: 'LÍNEA DIRECTA URGENCIAS',
      phoneNumber: '(3704) 444-5561',
      href: 'tel:37044445561',
      isEmergency: true,
      cardClass: 'emergency-card',
      icon: 'phone-emergency',
    },
    {
      id: 'conmutador',
      title: 'Teléfono Princial',
      description: 'Para consultas generales, derivaciones, estado de trámites administrativos e información institucional del hospital.',
      scheduleText: 'Lunes a Viernes: 06:00 a 20:00 hs',
      label: 'CONMUTADOR OFICIAL',
      phoneNumber: '(3704) 436-100',
      href: 'tel:3704436100',
      cardClass: 'standard-card',
      icon: 'phone-switchboard',
    },
    {
      id: 'red-interior',
      title: 'Nuestro Whatsapp Oficial',
      description: 'Canal exclusivo para Hospitales y Centros de Salud de los distritos del interior provincial y orientación de pacientes derivados.',
      scheduleText: 'Recepción & WhatsApp Habilitado',
      label: 'CANAL WHATSAPP OFICIAL',
      phoneNumber: '+54 9 3704 43-6100',
      href: 'https://wa.me/5493704436100',
      isExternal: true,
      cardClass: 'whatsapp-card',
      icon: 'whatsapp',
    },
  ];

  const emailCards = [
    {
      id: 'consultas',
      area: 'Consultas Generales & Dirección',
      description: 'Mesa de entradas, gestión documental oficial, notas y correspondencia con el Ministerio.',
      email: 'info@hospitalevita.gob.ar',
      icon: 'building',
    },
    {
      id: 'docencia',
      area: 'Docencia & Capacitación',
      description: 'Residencias médicas provinciales, convenios universitarios, ateneos y jornadas científicas.',
      email: 'docencia@hospitalevita.gob.ar',
      icon: 'book',
    },
    {
      id: 'rrhh',
      area: 'Recursos Humanos',
      description: 'Concursos profesionales, legajos de personal sanitario, certificaciones laborales y guardias.',
      email: 'rrhh@hospitalevita.gob.ar',
      icon: 'users',
    },
    {
      id: 'atencion',
      area: 'Atención al Paciente & Social',
      description: 'Acompañamiento familiar, servicio social hospitalario, quejas, sugerencias y contención.',
      email: 'atencionalpaciente@hospitalevita.gob.ar',
      icon: 'heart',
    },
  ];

  const socialChannels = [
    {
      id: 'facebook',
      platform: 'Facebook Oficial',
      handleOrDesc: '/HospitalInterdistritalEvita',
      actionText: 'Seguir →',
      url: 'https://facebook.com',
      icon: 'facebook',
    },
    {
      id: 'instagram',
      platform: 'Instagram Oficial',
      handleOrDesc: '@hospitalevitaformosa',
      actionText: 'Seguir →',
      url: 'https://instagram.com',
      icon: 'instagram',
    },
    {
      id: 'youtube',
      platform: 'Canal YouTube',
      handleOrDesc: 'Conferencias y Salud',
      actionText: 'Ver →',
      url: 'https://youtube.com',
      icon: 'youtube',
    },
    {
      id: 'boletin',
      platform: 'Boletín Informativo',
      handleOrDesc: 'Canal de Avisos y Novedades',
      actionText: 'Unirse →',
      url: 'https://whatsapp.com',
      icon: 'bulletin',
    },
  ];

  return (
    <main className="contacto-page">
      {/* 1. HERO ANIMADO */}
      <div className="contacto-container">
        <AnimatedContent distance={30} direction="vertical" delay={0.1}>
          <section className="contacto-hero">
            <div className="contacto-hero-left">
              <Breadcrumb currentPage="Contacto" />
              <h1 className="contacto-title">CONTACTO</h1>
              <p className="contacto-description">
                Para comunicarte con las diferentes áreas del Hospital
                Interdistrital Evita, utiliza los medios oficiales habilitados.
                Nuestro equipo está a disposición para resolver tus consultas.
              </p>
              <p className="contacto-subtext">¡Estamos para ayudarte!</p>
            </div>

            <div className="contacto-hero-right">
              <div className="contacto-image-wrapper">
                <img
                  src={fotoAtencion}
                  alt="Atención al paciente - Hospital Evita"
                  className="contacto-img"
                />
                <div className="contacto-overlay-box"></div>
              </div>
            </div>
          </section>
        </AnimatedContent>
      </div>

      <div className="contact-page-container">
        <section className="phone-cards-grid" aria-label="Líneas Telefónicas Directas">
          {phoneCards.map((card, index) => (
            <AnimatedContent 
              key={card.id} 
              distance={40} 
              direction="vertical" 
              delay={0.1 + (index * 0.15)} // El retraso se suma según la posición
            >
              <article className={`phone-card ${card.cardClass}`} style={{ height: '100%' }}>
                
                <div className="card-top-header">
                  <div className={`card-icon-box icon-${card.icon}`}>
                    {card.icon === 'phone-emergency' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    )}
                    {card.icon === 'phone-switchboard' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    )}
                    {card.icon === 'whatsapp' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="card-title-group">
                  <h3 className="card-title">{card.title}</h3>
                  {card.badge && (
                    <span className={`pill-badge badge-${card.badge.type}`}>
                      {card.badge.text}
                    </span>
                  )}
                </div>

                <p className="card-description">{card.description}</p>

                {card.scheduleText && (
                  <div className="schedule-bubble">
                    {card.id === 'conmutador' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    ) : (
                      <span className="dot-indicator"></span>
                    )}
                    <span>{card.scheduleText}</span>
                  </div>
                )}

                <div className="card-footer-action">
                  <div className="action-label">{card.label}</div>
                  <a
                    href={card.href}
                    className="phone-link"
                    target={card.isExternal ? '_blank' : undefined}
                    rel={card.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    <span className="phone-number-text">{card.phoneNumber}</span>
                    <span className="action-icon-circle">
                      {card.isEmergency ? (
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                         </svg>
                      ) : card.isExternal ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      )}
                    </span>
                  </a>
                </div>
              </article>
            </AnimatedContent>
          ))}
        </section>

        {/* 4. HEADER DE CORREOS */}
        <AnimatedContent distance={40} direction="horizontal" delay={0.1}>
          <section className="institutional-emails-section" aria-labelledby="emails-heading">
            <div className="section-title-wrapper">
              <div>
                <span className="section-eyebrow">DIRECCIONES Y ÁREAS ESPECÍFICAS</span>
                <h2 id="emails-heading" className="section-heading">Canales Electrónicos Institucionales</h2>
              </div>
              <p className="section-note">
                Enviá tus consultas con nombre completo, DNI y requerimiento formal para agilizar la gestión de tu nota administrativa.
              </p>
            </div>

            {/* 5. GRILLA DE CORREOS CON ANIMACIÓN EN CASCADA (INDEPENDIENTE) */}
            <div className="emails-grid">
              {emailCards.map((emailCard, index) => (
                <AnimatedContent 
                  key={emailCard.id} 
                  distance={40} 
                  direction="vertical" 
                  delay={0.1 + (index * 0.1)} // Cascada ligeramente más rápida para correos
                >
                  <article className="email-card" style={{ height: '100%' }}>
                    <div className="email-icon-box" aria-hidden="true">
                      {emailCard.icon === 'building' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                          <line x1="9" y1="22" x2="9" y2="22.01" />
                          <line x1="15" y1="22" x2="15" y2="22.01" />
                          <line x1="9" y1="6" x2="9" y2="6.01" />
                          <line x1="15" y1="6" x2="15" y2="6.01" />
                          <line x1="9" y1="10" x2="9" y2="10.01" />
                          <line x1="15" y1="10" x2="15" y2="10.01" />
                          <line x1="9" y1="14" x2="9" y2="14.01" />
                          <line x1="15" y1="14" x2="15" y2="14.01" />
                        </svg>
                      )}
                      {emailCard.icon === 'book' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      )}
                      {emailCard.icon === 'users' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      )}
                      {emailCard.icon === 'heart' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      )}
                    </div>

                    <h3 className="email-card-title">{emailCard.area}</h3>
                    <p className="email-card-description">{emailCard.description}</p>
                    
                    <a href={`mailto:${emailCard.email}`} className="email-link">
                      {emailCard.email}
                    </a>
                  </article>
                </AnimatedContent>
              ))}
            </div>
          </section>
        </AnimatedContent>

        {/* 6. TARJETAS FINALES (REDES SOCIALES Y EDIFICIO) */}
        <section className="community-location-grid" aria-label="Redes Sociales y Sede Institucional">
          
          <AnimatedContent distance={40} direction="vertical" delay={0.2}>
            <div className="social-panel-card" style={{ height: '100%' }}>
              <div className="panel-header">
                <div className="panel-icon-bubble" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div>
                  <h3 className="panel-title">Redes Sociales y Comunidad Digital</h3>
                  <p className="panel-subtitle">Seguinos para enterarte de las últimas novedades, prevención y campañas de salud.</p>
                </div>
              </div>

              <div className="social-links-subgrid">
                {socialChannels.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-item-row"
                  >
                    <div className="social-left">
                      <div className={`social-network-icon icon-${item.icon}`} aria-hidden="true">
                        {item.icon === 'facebook' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                          </svg>
                        )}
                        {item.icon === 'instagram' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        )}
                        {item.icon === 'youtube' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                          </svg>
                        )}
                        {item.icon === 'bulletin' && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="social-text">
                        <span className="platform-name">{item.platform}</span>
                        <span className="platform-handle">{item.handleOrDesc}</span>
                      </div>
                    </div>
                    <span className="social-action-btn">{item.actionText}</span>
                  </a>
                ))}
              </div>

              <div className="social-divider"></div>
              
              <p className="social-disclaimer">
                Las redes sociales se gestionan a través de la Dirección de Prensa y Comunicación del Ministerio de Desarrollo Humano.
              </p>
            </div>
          </AnimatedContent>

          <AnimatedContent distance={40} direction="horizontal" delay={0.4}>
            <aside className="main-building-card" style={{ height: '100%' }}>
              <span className="building-badge">SEDE HOSPITALARIA CENTRAL</span>
              <h3 className="building-title">Edificio Principal – Polo Sanitario</h3>

              <div className="building-info-block">
                <div className="info-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  </svg>
                </div>
                <div className="info-content">
                  <strong>Dirección:</strong>
                  <p>Av. José de Luca Barberis Nº 250<br />Formosa Capital (CP 3600), República Argentina</p>
                </div>
              </div>

              <div className="building-info-block">
                <div className="info-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                    <path d="M15 3v18" />
                  </svg>
                </div>
                <div className="info-content">
                  <strong>Instalaciones:</strong>
                  <p>19.000 m² cubiertos • Quirófanos de flujo laminar inteligente • Terapia Intensiva • Diagnóstico por Imágenes</p>
                </div>
              </div>

              <div className="building-card-footer">
                <button 
                  type="button" 
                  className="building-footer-query"
                  onClick={() => window.dispatchEvent(new Event("openLocationModal"))}
                >
                  ¿Cómo llegar a la Guardia Central?
                </button>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gps-route"
                >
                  <span>Abrir en GPS</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </aside>
          </AnimatedContent>

        </section>

      </div>
    </main>
  );
};

export default ContactoPage;