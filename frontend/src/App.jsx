import React from 'react';
import Header from './components/Header';
import Carousel from './components/Carousel';
import ContactBar from './components/ContactBar';
import NewsSection from './components/NewsSection';
import WhatsAppButton from './components/WhatsAppButton';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      
      <main>
        <Carousel />
        <ContactBar />
        <NewsSection />
      </main>

      <WhatsAppButton />
      
    </div>
  );
}

export default App;