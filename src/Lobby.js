// src/GameLobby.js (DIPERBARUI)

import React, { useState, useEffect, useRef } from "react";
import FrogQuiz from "./components/FrogQuiz";
import LevelSelection from "./components/LevelSelection";
import './styles/Lobby.css'; // Tetap import App.css
import './FrogQuiz.css';

// --- GLOBAL VARIABLES ---
let backgroundMusic;

const GameLobby = () => {
  const [currentGame, setCurrentGame] = useState("MENU");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const musicRef = useRef(null);

  // --- MUSIC HANDLER ---
  useEffect(() => {
    if (!musicRef.current) {
      try {
        backgroundMusic = new Audio('/sounds/main_bgm.mp3'); 
        backgroundMusic.loop = true;
        backgroundMusic.volume = isMuted ? 0 : 0.4;
        musicRef.current = backgroundMusic;
      } catch (error) {
        console.error("Gagal memuat musik latar:", error);
      }
    }

    const playMusic = () => {
      if (musicRef.current && !isMuted) {
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
  }, [isMuted]);

  useEffect(() => {
    if (musicRef.current) {
      if (currentGame === "MENU") {
        musicRef.current.volume = isMuted ? 0 : 0.4;
      } else {
        musicRef.current.volume = isMuted ? 0 : 0.1;
      }
    }
  }, [currentGame, isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSelectLevel = (levelTitle, levelQuestions) => {
    setSelectedLevel({ title: levelTitle, questions: levelQuestions });
    setCurrentGame("FROG_QUIZ");
  };

  const renderContent = () => {
    switch (currentGame) {
      case "FROG_QUIZ":
        return <FrogQuiz onBack={() => setCurrentGame("LEVEL_SELECTION")} questions={selectedLevel?.questions} currentLevel={selectedLevel?.title} />; 
      case "LEVEL_SELECTION":
        return <LevelSelection onSelectLevel={handleSelectLevel} />;
      case "MENU":
      default:
        return (
          <div className="lobby-main-container"> {/* GANTI CLASS */}
            {/* Mute Button */}
            <button 
              className={`lobby-mute-button ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
            >
              {isMuted ? "🔇 Unmute" : "🔊 Mute"}
            </button>

            <div className="lobby-container"> {/* Tetap sama */}
              <div className="lobby-menu-card"> {/* Tetap sama */}
                <h1 className="lobby-title">
                  Froggy Quiz Adventure! 
                </h1>
                <button
                  className="lobby-play-button"
                  onClick={() => setCurrentGame("LEVEL_SELECTION")}
                >
                  Mulai Quiz!
                </button>
                <p className="lobby-hint">
                  {isMuted ? "🔇 Sound dimatikan" : "🔊 Sound aktif"} - Klik tombol mute untuk mengatur
                </p>
              </div>

              {/* Elemen Dekorasi dengan Class Baru */}
              <div className="lobby-cloud lobby-cloud-1"></div>
              <div className="lobby-cloud lobby-cloud-2"></div>
              <div className="lobby-cloud lobby-cloud-3"></div>

              <div className="lobby-lily-pad lily-pad-1"></div>
              <div className="lobby-lily-pad lily-pad-2"></div>
              <div className="lobby-lily-pad lily-pad-3"></div>

              <div className="lobby-bubble bubble-1"></div>
              <div className="lobby-bubble bubble-2"></div>
              <div className="lobby-bubble bubble-3"></div>

              <div className="lobby-animated-frog"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <>{renderContent()}</>
  );
};

export default GameLobby;