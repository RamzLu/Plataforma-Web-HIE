import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import HomePage from "./pages/HomePage";
import NoticiasPage from "./pages/NoticiasPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />

        {/* Aquí es donde la magia ocurre: el contenido central cambia según la ruta, pero Header y Footer se quedan */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/noticias" element={<NoticiasPage />} />
        </Routes>

        <Footer />
        <WhatsAppButton />
      </div>
    </Router>
  );
}

export default App;
