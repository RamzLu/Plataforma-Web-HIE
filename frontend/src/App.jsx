import React from 'react';
import Header from './components/Header';
import Carousel from './components/Carousel';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <Carousel />
      </main>
      
    </div>
  );
}

export default App;