// src/components/LevelSelection.jsx

import React from "react";
import '../LevelSelection.css'; // Import file CSS khusus

// --- DATA PERTANYAAN DIPINDAHKAN DARI GameLobby.js ---
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

// Komponen LevelSelection baru
const LevelSelection = ({ onSelectLevel }) => {
  const levels = Object.keys(quizQuestions);

  return (
    <div className="lobby-container"> 
      <div className="lobby-menu-card level-selection-card"> 
        <h1 className="lobby-title level-title-animated">Pilih Level Petualangan 🗺️</h1>
        <p className="lobby-hint">Kodok siap melompat!</p>
        
        <div className="level-buttons-container">
          {levels.map((levelKey, index) => {
            const levelData = quizQuestions[levelKey];
            return (
              <button 
                key={levelKey}
                className={`level-button ${levelKey.toLowerCase()}`} 
                onClick={() => onSelectLevel(levelData.title, levelData.questions)}
                style={{ animationDelay: `${index * 0.15}s` }} // Animasi urutan
              >
                {levelData.title} ({levelData.questions.length} Soal)
                <span className="level-icon">{levelKey === 'EASY' ? '🟢' : levelKey === 'MEDIUM' ? '🟡' : '🔴'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Elemen Dekorasi Bergerak - Pindahkan ke sini */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      <div className="lily-pad lily-pad-1"></div>
      <div className="lily-pad lily-pad-2"></div>
      <div className="lily-pad lily-pad-3"></div>
      <div className="animated-frog"></div>
    </div>
  );
};

export default LevelSelection;