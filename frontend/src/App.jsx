import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { getNoticias } from "./api/noticias.api.js";
import { getEspecialidades } from "./api/especialidades.api.js";
import { getProfesionales } from "./api/profesionales.api.js";
import { getDocumentos } from "./api/documentos.api.js";
import { getCapacitacionesPublicas } from "./api/capacitaciones.api.js";
import { getResidencias } from "./api/residencias.api.js";
import { getInstitucional } from "./api/autoridades.api.js";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/ui/ScrollToTop";
import PortalLoader from "./components/ui/PortalLoader";

import HomePage from "./pages/public/HomePage";
import EspecialidadesPage from "./pages/public/EspecialidadesPage";
import NoticiasPage from "./pages/public/NoticiasPage";
import DocumentacionPage from "./pages/public/DocumentacionPage";
import ProfesionalesPage from "./pages/public/ProfesionalesPage";
import CapacitacionPage from "./pages/public/CapacitacionPage";
import ResidenciasPage from "./pages/public/ResidenciasPage";
import AboutPage from "./pages/public/AboutPage";
// Los paneles se descargan recién al entrar a /cms o /admin: el portal no carga su código ni CKEditor.
// Su CSS está limitado a .panel-scope, así que cargarlo después no cambia el aspecto del portal.
const CmsPage = lazy(() => import("./pages/cms/CmsPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
// Reglas de los paneles que el portal heredaba (ver el archivo): van en esta posición de la cascada.
import "./styles/legacy/panel-heredado-portal.css";
import PlanoInstitucionalPage from "./pages/public/PlanoInstitucionalPage";
import NoticiasCategoriaPage from "./pages/public/NoticiasCategoriaPage";
import NotFoundPage from "./pages/public/NotFoundPage";

const CargandoPanel = () => (
  <div className="panel-cargando" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
    <PortalLoader message="Cargando panel..." />
  </div>
);

const AppLayout = () => {
  const location = useLocation();
  
  // Agrupamos ambas áreas protegidas para ocultar los componentes públicos
  const isPrivatePanel = location.pathname.startsWith("/cms") || location.pathname.startsWith("/admin");

  // Precarga silenciosa en segundo plano del catálogo público del portal para que
  // al cambiar de sección no haya que esperar al spinner de carga.
  useEffect(() => {
    if (isPrivatePanel) return;
    const warmPortalData = () => {
      Promise.allSettled([
        getNoticias(false),
        getEspecialidades(),
        getProfesionales(),
        getDocumentos(),
        getCapacitacionesPublicas(),
        getResidencias(),
        getInstitucional(),
      ]);
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warmPortalData, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(warmPortalData, 600);
    return () => clearTimeout(timer);
  }, [isPrivatePanel]);

  return (
    <>
      <ScrollToTop />

      {!isPrivatePanel && <Header />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/especialidades" element={<EspecialidadesPage />} />
        <Route path="/noticias" element={<NoticiasPage />} />
        <Route path="/noticias/:categoria" element={<NoticiasCategoriaPage />} />
        <Route path="/documentacion" element={<DocumentacionPage />} />
        <Route path="/profesionales" element={<ProfesionalesPage />} />
        <Route path="/capacitacion" element={<CapacitacionPage />} />
        <Route path="/residencias" element={<ResidenciasPage />} />
        <Route path="/acerca-de" element={<AboutPage />} />
        <Route path="/plano" element={<PlanoInstitucionalPage />} />
        <Route path="/cms/:seccion?" element={<Suspense fallback={<CargandoPanel />}><CmsPage /></Suspense>} />
        <Route path="/admin/:seccion?" element={<Suspense fallback={<CargandoPanel />}><AdminPage /></Suspense>} />

        <Route path="*" element={<NotFoundPage />} />
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
          zIndex: "var(--z-modal-top)",
        }}
      />
    </Router>
  );
};

export default App;