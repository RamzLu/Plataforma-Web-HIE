import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./App.css";

// Componentes Globales
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";

// Páginas
import HomePage from "./pages/HomePage";
import EspecialidadesPage from "./pages/EspecialidadesPage";
import NoticiasPage from "./pages/NoticiasPage";
import DocumentacionPage from "./pages/DocumentacionPage";
import ProfesionalesPage from "./pages/ProfesionalesPage";
import CapacitacionPage from "./pages/CapacitacionPage";
import ContactoPage from "./pages/ContactoPage";
import AboutPage from "./pages/AboutPage";
import CmsPage from "./pages/CmsPage";

const AppLayout = () => {
  const location = useLocation();
  const isCmsRoute = location.pathname.startsWith("/cms");

  return (
    <>
      <ScrollToTop />

      {/* Solo mostramos el Header público si NO estamos en el CMS */}
      {!isCmsRoute && <Header />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/especialidades" element={<EspecialidadesPage />} />
        <Route path="/noticias" element={<NoticiasPage />} />
        <Route path="/documentacion" element={<DocumentacionPage />} />
        <Route path="/profesionales" element={<ProfesionalesPage />} />
        <Route path="/capacitacion" element={<CapacitacionPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/acerca-de" element={<AboutPage />} />
        <Route path="/cms" element={<CmsPage />} />

        <Route
          path="*"
          element={
            <div
              style={{
                textAlign: "center",
                padding: "100px 20px",
                minHeight: "calc(100vh - 80px)",
              }}
            >
              <h2 style={{ color: "#006eb3", fontSize: "2rem" }}>
                404 - Página no encontrada
              </h2>
              <p style={{ marginTop: "20px", color: "#666" }}>
                Lo sentimos, la página que buscas no existe o fue movida.
              </p>
            </div>
          }
        />
      </Routes>

      {!isCmsRoute && (
        <>
          <WhatsAppButton />
          <Footer />
        </>
      )}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
