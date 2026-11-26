import defaultHospitalPhoto from "../../assets/fotoFachadaHIE.jpg";
import defaultLogoOficial from "../../assets/logo-hie-oficial.png";
import "../../styles/ui/DefaultNewsImage.css";

const DefaultNewsImage = ({
  className = "",
  alt = "Hospital Interdistrital Evita Formosa",
  compact = false,
  onClick,
}) => {
  return (
    <div
      className={`default-news-image-container ${compact ? "compact" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <img
        src={defaultHospitalPhoto}
        alt={alt}
        className="default-news-bg-img"
        loading="lazy"
      />
      <div className="default-news-blue-overlay">
        <div className={compact ? "default-news-logo-badge compact" : "default-news-logo-badge"}>
          <img
            src={defaultLogoOficial}
            alt="Gobierno de Formosa - Hospital Interdistrital Evita"
            className={compact ? "default-news-logo-compact" : "default-news-logo-full"}
          />
          {!compact && (
            <div className="default-news-brand-text">
              <span className="default-news-brand-line">HOSPITAL</span>
              <span className="default-news-brand-line">INTERDISTRITAL</span>
              <span className="default-news-brand-evita">EVITA</span>
              <span className="default-news-brand-formosa">FORMOSA</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultNewsImage;

