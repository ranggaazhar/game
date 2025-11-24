// src/GameLobby.js

import React, { useState, useEffect, useRef } from "react";
import FrogQuiz from "./components/FrogQuiz";
import LevelSelection from "./components/LevelSelection";
import './App.css'; // Untuk gaya lobby/menu
import './FrogQuiz.css'; // Untuk gaya UI Game (header, question box, dll.)

// --- GLOBAL VARIABLES ---
let backgroundMusic;

const GameLobby = () => {
  const [currentGame, setCurrentGame] = useState("MENU");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const musicRef = useRef(null);

  // --- MUSIC HANDLER ---
  useEffect(() => {
    // ... (Logika musik tidak berubah) ...
    if (!musicRef.current) {
        try {
          backgroundMusic = new Audio('/sounds/main_bgm.mp3'); 
          backgroundMusic.loop = true;
          backgroundMusic.volume = 0.4;
          musicRef.current = backgroundMusic;
        } catch (error) {
          console.error("Gagal memuat musik latar:", error);
        }
      }
  
      const playMusic = () => {
        if (musicRef.current) {
          musicRef.current.play().catch(error => {
            console.log("Musik diblokir, menunggu interaksi pengguna.");
          });
        }
      }
  
      playMusic();
      window.addEventListener('click', playMusic, { once: true });
  
      return () => {
        window.removeEventListener('click', playMusic);
        if (musicRef.current) {
          musicRef.current.pause();
        }
      };
  }, []);

  useEffect(() => {
    if (musicRef.current) {
      if (currentGame === "MENU") {
        musicRef.current.volume = 0.4;
      } else {
        musicRef.current.volume = 0.1;
      }
    }
  }, [currentGame]);


  const handleSelectLevel = (levelTitle, levelQuestions) => {
    setSelectedLevel({ title: levelTitle, questions: levelQuestions });
    setCurrentGame("FROG_QUIZ");
  };

  const renderContent = () => {
    switch (currentGame) {
      case "FROG_QUIZ":
        // Panggil FrogQuiz dengan prop onBack untuk kembali ke pemilihan level
        return <FrogQuiz onBack={() => setCurrentGame("LEVEL_SELECTION")} questions={selectedLevel?.questions} currentLevel={selectedLevel?.title} />; 
      case "LEVEL_SELECTION":
        return <LevelSelection onSelectLevel={handleSelectLevel} />;
      case "MENU":
      default:
        return (
          <div className="lobby-container"> 
            <div className="lobby-menu-card"> 
              <h1 className="lobby-title">🐸 Froggy Quiz Adventure! </h1>
              <button
                className="lobby-play-button"
                onClick={() => setCurrentGame("LEVEL_SELECTION")}
              >
                Mulai Petualangan!
              </button>
              <p className="lobby-hint">*Klik di mana saja untuk memutar musik latar</p>
            </div>

            {/* Elemen Dekorasi Bergerak */}
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>

            <div className="lily-pad lily-pad-1"></div>
            <div className="lily-pad lily-pad-2"></div>
            <div className="lily-pad lily-pad-3"></div>

            <div className="animated-frog"></div>
          </div>
        );
    }
  };

  return (
    <div className="main-container"> 
        {renderContent()}
    </div>
  );
};

export default GameLobby;