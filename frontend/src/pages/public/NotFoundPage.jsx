import { Link } from "react-router-dom";
import "../../styles/pages/NotFoundPage.css";
import { usePageMeta } from "../../hooks/usePageMeta.js";

const NotFoundPage = () => {
  usePageMeta("Página no encontrada");
  return (
  <main className="not-found-page">
    <p className="not-found-code">404</p>
    <h1 className="not-found-title">Página no encontrada</h1>
    <p className="not-found-text">Lo sentimos, la página que buscás no existe o fue movida.</p>
    <Link to="/" className="not-found-link">
      Volver al inicio
    </Link>
  </main>
  );
};

export default NotFoundPage;
