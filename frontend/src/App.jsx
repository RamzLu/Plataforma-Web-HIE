import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/ui/ScrollToTop";

import HomePage from "./pages/public/HomePage";
import EspecialidadesPage from "./pages/public/EspecialidadesPage";
import NoticiasPage from "./pages/public/NoticiasPage";
import DocumentacionPage from "./pages/public/DocumentacionPage";
import ProfesionalesPage from "./pages/public/ProfesionalesPage";
import CapacitacionPage from "./pages/public/CapacitacionPage";
import AboutPage from "./pages/public/AboutPage";
import CmsPage from "./pages/cms/CmsPage";
import AdminPage from './pages/admin/AdminPage';
import PlanoInstitucionalPage from "./pages/public/PlanoInstitucionalPage";

const AppLayout = () => {
  const location = useLocation();
  
  // Agrupamos ambas áreas protegidas para ocultar los componentes públicos
  const isPrivatePanel = location.pathname.startsWith("/cms") || location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />

      {!isPrivatePanel && <Header />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/especialidades" element={<EspecialidadesPage />} />
        <Route path="/noticias" element={<NoticiasPage />} />
        <Route path="/documentacion" element={<DocumentacionPage />} />
        <Route path="/profesionales" element={<ProfesionalesPage />} />
        <Route path="/capacitacion" element={<CapacitacionPage />} />
        <Route path="/acerca-de" element={<AboutPage />} />
        <Route path="/plano" element={<PlanoInstitucionalPage />} />
        <Route path="/cms" element={<CmsPage />} />
        <Route path="/admin" element={<AdminPage />} />

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

      {!isPrivatePanel && (
        <>
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
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        containerStyle={{
          zIndex: 99999,
        }}
      />
    </Router>
  );
};

export default App;