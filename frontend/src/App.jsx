import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/especialidades" element={<EspecialidadesPage />} />
        <Route path="/noticias" element={<NoticiasPage />} />
        <Route path="/documentacion" element={<DocumentacionPage />} />
        <Route path="/profesionales" element={<ProfesionalesPage />} />

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

      <WhatsAppButton />
      <Footer />
    </Router>
  );
};

export default App;
