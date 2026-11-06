import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Carousel from "../../components/Carousel";
import HomeNewsPreview from "../../components/HomeNewsPreview";
import NewsSection from "../../components/NewsSection";
import PatientInfoSection from "../../components/PatientInfoSection";
import AprendeSection from "../../components/AprendeSection";
import HomeMapBanner from "../../components/HomeMapBanner";
import AboutPage from "../public/AboutPage";

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
    <main>
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
