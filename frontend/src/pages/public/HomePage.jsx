import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Carousel from "../../components/Carousel";
import HomeNewsPreview from "../../components/HomeNewsPreview";
import NewsSection from "../../components/NewsSection";
import PatientInfoSection from "../../components/PatientInfoSection";
import AprendeSection from "../../components/AprendeSection";
import HomeMapBanner from "../../components/HomeMapBanner";
import logoEstrellas from "../../assets/logoHospitalEvita.png";
import logoEstrellasBlanco from "../../assets/logoHospitalEvita-blanco.png";
import "../../styles/pages/HomePage.css";

const HomePage = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace("#", ""));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
  }, [hash]);

  return (
    <main className="home-page">
      {/* Marcas de agua decorativas (logo institucional con estrellas) */}
      <img
        src={logoEstrellas}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="home-watermark home-watermark--top"
      />
      <img
        src={logoEstrellasBlanco}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="home-watermark home-watermark--bottom"
      />

      <Carousel />
      <NewsSection />
      <HomeNewsPreview />
      <PatientInfoSection />
      <AprendeSection />
      <HomeMapBanner />
    </main>
  );
};

export default HomePage;
