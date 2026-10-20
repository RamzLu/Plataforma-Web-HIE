import React, { useState, useEffect } from "react";
import "../../styles/pages/ResidenciasPage.css";
import PageBanner from "../../components/PageBanner";
import fondoBanner from "../../assets/banner_residencias.png";
import AnimatedContent from "../../components/ui/AnimatedContent";
import { getResidencias } from "../../api/residencias.api";

const ResidenciasPage = () => {
  const [residencias, setResidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchResidencias = async () => {
      try {
        const data = await getResidencias();
        // Filtrar solo las residencias publicadas para el portal público
        const publicadas = Array.isArray(data)
          ? data.filter((item) => item.estado === "PUBLICADO")
          : [];
        setResidencias(publicadas);
      } catch (error) {
        console.error("Error al cargar residencias públicas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidencias();
  }, []);

  return (
    <main className="residencias-page">
      <PageBanner
        currentPage="Residencias"
        title="RESIDENCIAS MÉDICAS"
        subtitle="Conozca las convocatorias y programas formativos de posgrado de nuestra institución"
        image={fondoBanner}
      />

      <div className="residencias-container">
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b" }}>
            Cargando programas de residencias...
          </div>
        ) : (
          <div className="residencias-content-area" style={{ width: "100%" }}>
            {/* Contenido / Módulos de residencias que se construirán en los siguientes pasos */}
          </div>
        )}
      </div>
    </main>
  );
};

export default ResidenciasPage;
