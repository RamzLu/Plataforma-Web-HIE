import React from "react";
import Carousel from "../components/Carousel";
import HomeNewsPreview from "../components/HomeNewsPreview";
import NewsSection from "../components/NewsSection";
import PatientInfoSection from "../components/PatientInfoSection";
import AprendeSection from "../components/AprendeSection";
import HomeMapBanner from "../components/HomeMapBanner";
import AboutPage from "./AboutPage";

const HomePage = () => {
  return (
    <main>
      <Carousel />
      <HomeNewsPreview />
      <NewsSection />
      <PatientInfoSection />
      <AprendeSection />
      <HomeMapBanner />
    </main>
  );
};

export default HomePage;
