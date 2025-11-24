import React, { useState, useEffect, useRef } from "react";
import FrogQuiz from "./components/FrogQuiz";
import AnimalPuzzleGame from "./components/AnimalPuzzleGame";

// --- GLOBAL VARIABLES ---
let backgroundMusic;

const styles = {
  mainContainer: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #87ceeb, #a9d4f4)", // Gradien Biru Muda
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },
  menuContainer: {
    padding: "60px 40px",
    borderRadius: "15px",
    background: "white",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    textAlign: "center",
    border: '5px solid #2e8b57',
  },
  menuButton: {
    display: "block",
    width: "300px",
    padding: "18px",
    margin: "25px auto",
    fontSize: "18px",
    cursor: "pointer",
    backgroundColor: "#6dbf44",
    color: "white",
    border: "none",
    borderRadius: "8px",
    transition: "background-color 0.3s, transform 0.1s",
    fontWeight: 'bold',
    boxShadow: '0 4px 0 #4f8a33',
  },
  title: {
      color: '#2e8b57',
      fontSize: '2.5em',
      marginBottom: '30px'
  }
};

const GameLobby = () => {
  // State untuk melacak game mana yang sedang ditampilkan:
  // "MENU", "FROG_QUIZ", atau "ANIMAL_PUZZLE"
  const [currentGame, setCurrentGame] = useState("MENU");
  const musicRef = useRef(null);

  // --- MUSIC HANDLER ---
  useEffect(() => {
    // Inisialisasi dan putar musik latar
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
                // Seringkali browser memblokir autoplay. 
                // Musik akan mulai diputar setelah interaksi pertama pengguna.
                console.log("Musik diblokir, menunggu interaksi pengguna.");
            });
        }
    }

    // Coba putar musik saat komponen dimuat
    playMusic();

    // Tambahkan event listener untuk memutar musik saat ada klik (untuk mengatasi blokir autoplay)
    window.addEventListener('click', playMusic, { once: true });

    // Bersihkan listener saat unmount
    return () => {
        window.removeEventListener('click', playMusic);
        if (musicRef.current) {
            musicRef.current.pause();
        }
    };
  }, []);

  useEffect(() => {
      // Kelola musik saat transisi game
      if (musicRef.current) {
          if (currentGame === "MENU") {
              musicRef.current.volume = 0.4; // Naikkan volume di menu
          } else {
              musicRef.current.volume = 0.1; // Kecilkan volume saat game berjalan
          }
      }
  }, [currentGame]);


  const renderContent = () => {
    switch (currentGame) {
      case "FROG_QUIZ":
        // Prop onBack akan memanggil setCurrentGame("MENU")
        return <FrogQuiz onBack={() => setCurrentGame("MENU")} />;
      case "ANIMAL_PUZZLE":
        // Prop onBack akan memanggil setCurrentGame("MENU")
        return <AnimalPuzzleGame onBack={() => setCurrentGame("MENU")} />;
      case "MENU":
      default:
        return (
          <div style={styles.menuContainer}>
            <h1 style={styles.title}>🕹️ Game Lobby </h1>
            <button
              style={styles.menuButton}
              onClick={() => setCurrentGame("FROG_QUIZ")}
            >
              🐸 Game 1: Frog Quiz (React-P5)
            </button>
            <button
              style={styles.menuButton}
              onClick={() => setCurrentGame("ANIMAL_PUZZLE")}
            >
              🧩 Game 2: Puzzle Hewan (Acak Gambar)
            </button>
            <p style={{fontSize: '0.9em', color: '#666'}}>*Klik di mana saja untuk memutar musik latar</p>
          </div>
        );
    }
  };

  return (
    <div style={styles.mainContainer}>
        {renderContent()}
    </div>
  );
};

// Ganti App.js agar menggunakan GameLobby
export default GameLobby;