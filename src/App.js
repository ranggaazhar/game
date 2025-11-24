import React from 'react';
import FrogQuiz from './FrogQuiz'; // Import komponen game

function App() {
  return (
    // Style untuk memusatkan game di tengah layar
    <div className="App" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: '#eee', 
      margin: 0, 
      padding: 0 
    }}>
      <FrogQuiz />
    </div>
  );
}

export default App;