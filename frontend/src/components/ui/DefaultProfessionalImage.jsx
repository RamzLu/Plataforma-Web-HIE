import defaultProfileBg from "../../assets/perfil-generico-profesional.png";
import defaultLogoOficial from "../../assets/logo-hie-oficial.png";
import "../../styles/ui/DefaultProfessionalImage.css";

const DefaultProfessionalImage = ({
  className = "",
  alt = "Profesional del Hospital Interdistrital Evita Formosa",
  compact = false,
}) => {
  return (
    <div
      className={`default-prof-image-container ${compact ? "compact" : ""} ${className}`}
      role="img"
      aria-label={alt}
    >
      <img
        src={defaultProfileBg}
        alt=""
        aria-hidden="true"
        className="default-prof-bg-img"
        loading="lazy"
      />
      <div className="default-prof-blue-overlay">
        <div className={compact ? "default-prof-logo-badge compact" : "default-prof-logo-badge"}>
          <img
            src={defaultLogoOficial}
            alt="Hospital Interdistrital Evita"
            className={compact ? "default-prof-logo-compact" : "default-prof-logo-full"}
          />
          {!compact && (
            <div className="default-prof-brand-text">
              <span className="default-prof-brand-line">HOSPITAL</span>
              <span className="default-prof-brand-line">INTERDISTRITAL</span>
              <span className="default-prof-brand-evita">EVITA</span>
              <span className="default-prof-brand-formosa">FORMOSA</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultProfessionalImage;
