import { lazy, Suspense } from "react";
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
  <div className="panel-cargando" role="status" aria-live="polite">
    Cargando panel…
  </div>
);

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