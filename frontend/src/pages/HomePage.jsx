import React from "react";
import Carousel from "../components/Carousel";
import HomeNewsPreview from "../components/HomeNewsPreview";
import NewsSection from "../components/NewsSection";
import PatientInfoSection from "../components/PatientInfoSection";
import AprendeSection from "../components/AprendeSection";
import HomeMapBanner from "../components/HomeMapBanner";

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
