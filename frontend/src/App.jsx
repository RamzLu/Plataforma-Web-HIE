import React from "react";
import Header from "./components/Header";
import Carousel from "./components/Carousel";
import NewsSection from "./components/NewsSection";
import PatientInfoSection from "./components/PatientInfoSection";
import AprendeSection from "./components/AprendeSection";
import WhatsAppButton from "./components/WhatsAppButton";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Header />

      <main>
        <Carousel />
        <NewsSection />
        <PatientInfoSection />
        <AprendeSection />
      </main>

      <WhatsAppButton />
      <Footer />
    </div>
  );
}

export default App;
