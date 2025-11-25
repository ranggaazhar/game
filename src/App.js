// src/GameLobby.js (DIPERBARUI DENGAN FITUR MUTE/UNMUTE & SOUND EFFECT)

import React, { useState, useEffect, useRef } from "react";
import FrogQuiz from "./components/FrogQuiz";
import LevelSelection from "./components/LevelSelection";
import './App.css';

const GameLobby = () => {
  const [currentGame, setCurrentGame] = useState("MENU");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const musicRef = useRef(null);
  const sfxRef = useRef(null); // Ref untuk Sound Effects (SFX)

  // --- MUSIC & SFX HANDLERS ---
  useEffect(() => {
    // Inisialisasi Musik Latar
    if (!musicRef.current) {
      try {
        const audio = new Audio('/sounds/main_bgm.mp3'); 
        audio.loop = true;
        audio.volume = isMuted ? 0 : 0.4;
        musicRef.current = audio;
      } catch (error) {
        console.error("Gagal memuat musik latar:", error);
      }
    }

    // Inisialisasi Sound Effect
    if (!sfxRef.current) {
      sfxRef.current = {
        click: new Audio('/sounds/click.mp3'), // Asumsikan Anda punya file click.mp3
        start: new Audio('/sounds/start.mp3') // Asumsikan Anda punya file start.mp3
      };
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

  const playSFX = (type) => {
    if (!isMuted && sfxRef.current && sfxRef.current[type]) {
        try {
            // Clone audio untuk menghindari pemotongan suara saat tombol diklik cepat
            const sfx = sfxRef.current[type].cloneNode(); 
            sfx.volume = 0.8;
            sfx.play().catch(error => console.log(`Gagal memutar SFX ${type}:`, error));
        } catch (error) {
            console.error("Kesalahan saat memutar SFX:", error);
        }
    }
  };

  const toggleMute = () => {
    playSFX('click');
    setIsMuted(!isMuted);
  };

  const handleSelectLevel = (levelTitle, levelQuestions) => {
    playSFX('click');
    setSelectedLevel({ title: levelTitle, questions: levelQuestions });
    setCurrentGame("FROG_QUIZ");
  };
  
  const handleStartAdventure = () => {
    playSFX('start');
    setCurrentGame("LEVEL_SELECTION");
  };

  const renderContent = () => {
    switch (currentGame) {
      case "FROG_QUIZ":
        return <FrogQuiz 
          onBack={() => {
            playSFX('click');
            setCurrentGame("LEVEL_SELECTION");
          }} 
          questions={selectedLevel?.questions} 
          currentLevel={selectedLevel?.title} 
          isMuted={isMuted}
          toggleMute={toggleMute}
        />; 
      case "LEVEL_SELECTION":
        return <LevelSelection onSelectLevel={handleSelectLevel} />;
      case "MENU":
      default:
        return (
          <div className="lobby-container"> 
            {/* Mute Button */}
            <button 
              className={`mute-button ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
              title={isMuted ? "Klik untuk unmute" : "Klik untuk mute"}
            >
              {isMuted ? (
                <>
                  <span className="mute-icon">🔇</span> Unmute
                </>
              ) : (
                <>
                  <span className="mute-icon">🔊</span> Mute
                </>
              )}
            </button>

            <div className="lobby-menu-card"> 
              <h1 className="lobby-title">
                Froggy Quiz Adventure! 
              </h1>
              <button
                className="lobby-play-button"
                onClick={handleStartAdventure}
              >
                Mulai Petualangan!
              </button>
              <p className="lobby-hint">
                {isMuted ? "🔇 Sound dimatikan" : "🔊 Sound aktif"} - Klik tombol mute untuk mengatur
              </p>
            </div>

            {/* Enhanced Decoration Elements (Tanpa Perubahan Posisi) */}
            <div className="water-ripple"></div>
            <div className="water-ripple"></div>
            
            <div className="bubble bubble-1"></div> {/* Memberi class spesifik */}
            <div className="bubble bubble-2"></div>
            <div className="bubble bubble-3"></div>

            <div className="floating-leaf floating-leaf-1">🍃</div>
            <div className="floating-leaf floating-leaf-2">🌿</div>
            <div className="floating-leaf floating-leaf-3">🍂</div>

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