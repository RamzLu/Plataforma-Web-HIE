import "../../styles/ui/PortalLoader.css";

const PortalLoader = ({ message = "Cargando contenido...", compact = false }) => {
  return (
    <div
      className={`portal-loader-container ${compact ? "compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="portal-loader-ring" aria-hidden="true"></div>
      {message && <p className="portal-loader-text">{message}</p>}
    </div>
  );
};

export default PortalLoader;
