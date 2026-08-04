import React from 'react';
import './ContactBar.css';

const ContactBar = () => {
  return (
    <section className="contact-bar-section">
      <div className="contact-bar-container">
        
        {/* Ítem de Teléfono */}
        <div className="contact-item">
          <div className="contact-icon">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <span className="contact-text">+54 9 3704673728</span>
        </div>

        {/* Ítem de Correo Electrónico */}
        <div className="contact-item">
          <div className="contact-icon email-icon-special">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0-5.5 8.28"></path>
            </svg>
          </div>
          <span className="contact-text">portalevita@gmail.com</span>
        </div>

      </div>
    </section>
  );
};

export default ContactBar;