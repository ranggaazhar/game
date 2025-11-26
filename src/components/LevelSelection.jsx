import React from "react";
import '../styles/LevelSelection.css';

const quizQuestions = {
  EASY: {
    title: "Easy",
    color: "green",
    questions: [
      { q: "Metode p5.js untuk menggambar lingkaran adalah?", options: ["rect()", "circle()", "line()"], ans: 1 },
      { q: "Hook React untuk menyimpan state adalah?", options: ["useEffect", "useState", "useHistory"], ans: 1 },
      { q: "Warna default background web adalah?", options: ["Putih", "Hitam", "Biru"], ans: 0 },
      { q: "Apa nama library untuk menggambar di React?", options: ["react-dom", "react-p5", "react-redux"], ans: 1 },
      { q: "Fungsi untuk inisialisasi p5.js adalah?", options: ["draw()", "setup()", "loop()"], ans: 1 },
    ]
  },
  MEDIUM: {
    title: "Medium",
    color: "yellow",
    questions: [
      { q: "CSS properti untuk mengubah warna teks adalah?", options: ["background-color", "color", "text-color"], ans: 1 },
      { q: "Apa kepanjangan dari DOM?", options: ["Document Object Model", "Design Object Markup", "Digital Overlay Manager"], ans: 0 },
      { q: "Operasi '&&' dalam JS disebut?", options: ["OR", "XOR", "AND"], ans: 2 },
      { q: "Node.js digunakan untuk sisi?", options: ["Frontend", "Backend", "Fullstack"], ans: 1 },
      { q: "Di React, komponen fungsi menggunakan 'props' sebagai?", options: ["Objek", "Array", "String"], ans: 0 },
      { q: "Format file gambar yang mendukung transparansi terbaik?", options: ["JPG", "BMP", "PNG"], ans: 2 },
    ]
  },
  HARD: {
    title: "Hard",
    color: "red",
    questions: [
      { q: "Syntax 'async/await' adalah fitur dari JS versi?", options: ["ES5", "ES6", "ES8"], ans: 2 },
      { q: "Apa itu 'closure' dalam JavaScript?", options: ["Fungsi yang mengembalikan nilai", "Fungsi dan lingkungan leksikalnya", "Struktur data array"], ans: 1 },
      { q: "Sebutan untuk 'Side Effect' di React Hook?", options: ["Render", "State", "Effect"], ans: 2 },
      { q: "Apa itu 'Virtual DOM'?", options: ["DOM tiruan di browser", "Abstraksi DOM di memori", "Versi DOM yang lebih cepat"], ans: 1 },
      { q: "Metode array JS yang tidak mengubah array asli (immutable)?", options: ["push()", "splice()", "map()"], ans: 2 },
      { q: "Protokol standar untuk transfer file aman?", options: ["HTTP", "SSH", "FTP"], ans: 1 },
      { q: "Tipe data p5.js untuk menyimpan warna?", options: ["String", "p5.Color", "Integer"], ans: 1 },
    ]
  },
};

const LevelSelection = ({ onSelectLevel }) => {
  const levels = Object.keys(quizQuestions);

  return (
    <div className="level-selection-container">
      {/* Background Effects */}
      <div className="water-ripple ripple-1"></div>
      <div className="water-ripple ripple-2"></div>
      <div className="water-ripple ripple-3"></div>
      
      {/* Bubbles */}
      <div className="bubble bubble-1"></div>
      <div className="bubble bubble-2"></div>
      <div className="bubble bubble-3"></div>
      <div className="bubble bubble-4"></div>

      {/* Main Card */}
      <div className="level-selection-card">
        {/* Card Header */}
        <div className="card-header">
          <div className="title-section">
            <div className="title-decoration">
              <div className="decoration-line"></div>
              <div className="decoration-dot"></div>
              <div className="decoration-line"></div>
            </div>
            <h1 className="main-title">PILIH LEVEL</h1>
            <p className="subtitle">Pilih tantangan sesuai kemampuan coding-mu!</p>
          </div>
        </div>

        {/* Level Cards - Horizontal Layout */}
        <div className="level-cards-horizontal">
          {levels.map((levelKey, index) => {
            const levelData = quizQuestions[levelKey];
            
            return (
              <div 
                key={levelKey}
                className={`level-card-horizontal ${levelKey.toLowerCase()}`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <button 
                  className="level-card-content"
                  onClick={() => onSelectLevel(levelData.title, levelData.questions)}
                >
                  <div className="card-background-glow"></div>
                  <div className="level-card-main">
                    {/* Level Header */}
                    <div className="level-header">
                      <div className="level-title-section">
                        <div className="level-badge">{levelData.title}</div>
                        <div className="level-subtitle">
                          LEVEL {levelKey === 'EASY' ? 'DASAR' : levelKey === 'MEDIUM' ? 'MENENGAH' : 'LANJUT'}
                        </div>
                      </div>
                      <div className="questions-count">
                        <span className="count-number">{levelData.questions.length}</span>
                        <span className="count-label">SOAL</span>
                      </div>
                    </div>

                    {/* Difficulty Section */}
                    <div className="difficulty-section">
                      <div className="difficulty-header">
                        <span className="difficulty-title">TINGKAT KESULITAN</span>
                        <span className="difficulty-percentage">
                          {levelKey === 'EASY' ? '33%' : levelKey === 'MEDIUM' ? '66%' : '100%'}
                        </span>
                      </div>
                      <div className="difficulty-meter">
                        <div className="difficulty-track">
                          <div className={`difficulty-progress ${levelKey.toLowerCase()}`}></div>
                        </div>
                        <div className="difficulty-labels">
                          <span>MUDAH</span>
                          <span>SEDANG</span>
                          <span>SULIT</span>
                        </div>
                      </div>
                    </div>

                    {/* Spacer untuk mengisi ruang */}
                    <div className="content-spacer"></div>

                    {/* Action Button */}
                    <div className="level-action">
                      <span className="action-text">MULAI QUIZ</span>
                      <span className="action-arrow">→</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Card Footer */}
        <div className="card-footer">
          <div className="footer-decoration">
            <div className="footer-dot"></div>
            <div className="footer-line"></div>
            <div className="footer-dot"></div>
          </div>
          <p className="footer-text">Setiap level memberikan pengalaman belajar yang berbeda!</p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      <div className="lily-pad lily-pad-1"></div>
      <div className="lily-pad lily-pad-2"></div>
      <div className="lily-pad lily-pad-3"></div>
      <div className="animated-frog"></div>
      <div className="water-plant water-plant-1"></div>
      <div className="water-plant water-plant-2"></div>
      <div className="floating-leaf leaf-1"></div>
      <div className="floating-leaf leaf-2"></div>
    </div>
  );
};

export default LevelSelection;