import defaultHospitalPhoto from "../../assets/fotoFachadaHIE.jpg";
import defaultLogoCompleto from "../../assets/logo-completo-blanco.png";
import defaultLogoEscudo from "../../assets/logoHospitalEvita-blanco.png";
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
        <img
          src={compact ? defaultLogoEscudo : defaultLogoCompleto}
          alt="Gobierno de Formosa - Hospital Interdistrital Evita"
          className={compact ? "default-news-logo-compact" : "default-news-logo-full"}
        />
      </div>
    </div>
  );
};

export default DefaultNewsImage;

