import React, { useState, useEffect, useRef } from "react";
import Sketch from "react-p5";

// --- GLOBAL VARIABLES & HELPER FUNCTIONS ---
// Menggunakan dimensi dinamis untuk Fullscreen
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const INITIAL_FROG_Y = CANVAS_HEIGHT * 0.75; // Posisi kodok di 75% tinggi layar

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

let jumpSound;
let correctSound;
let wrongSound;
let gameOverSound;

const FrogQuiz = () => {
  // --- STATE REACT (Untuk UI Overlay) ---
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(20);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [currentPads, setCurrentPads] = useState([]);
  const [padToHide, setPadToHide] = useState(null);

  const allQuestions = [
    { q: "Metode p5.js untuk menggambar lingkaran adalah?", options: ["rect()", "circle()", "line()"], ans: 1 },
    { q: "Hook React untuk menyimpan state adalah?", options: ["useEffect", "useState", "useHistory"], ans: 1 },
    { q: "Warna default background web adalah?", options: ["Putih", "Hitam", "Biru"], ans: 0 },
    { q: "Apa nama library untuk menggambar di React?", options: ["react-dom", "react-p5", "react-redux"], ans: 1 },
    { q: "Fungsi untuk inisialisasi p5.js adalah?", options: ["draw()", "setup()", "loop()"], ans: 1 },
    { q: "Apa fungsi Hook 'useEffect'?", options: ["Mengubah state", "Menggantikan componentDidMount/Update", "Membuat komponen baru"], ans: 1 },
  ];

  // --- STATE REF (P5.js Logic) ---
  const gameState = useRef("PLAYING");
  const yOffset = useRef(0); // Offset untuk scrolling
  const scrollTargetY = useRef(0); // Target Y Offset

  const currentPlatform = useRef({
    x: CANVAS_WIDTH / 2,
    y: INITIAL_FROG_Y,
    isStart: true
  });
  const frog = useRef({
    x: CANVAS_WIDTH / 2,
    y: INITIAL_FROG_Y,
    scale: 1,
    targetX: CANVAS_WIDTH / 2,
    targetY: INITIAL_FROG_Y,
    animT: 0,
    action: "IDLE",
    startX: CANVAS_WIDTH / 2,
    startY: INITIAL_FROG_Y,
  });

  // Posisi pad diatur relatif terhadap lebar layar
  const defaultPadPositions = [
    { x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.4 },
    { x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.3 },
    { x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.4 },
  ];

  // --- GAMEPLAY HANDLER FUNCTIONS ---

  const resetFrogPosition = () => {
    frog.current = {
      x: currentPlatform.current.x,
      y: currentPlatform.current.y,
      scale: 1,
      targetX: currentPlatform.current.x,
      targetY: currentPlatform.current.y,
      animT: 0,
      action: "IDLE",
      startX: currentPlatform.current.x,
      startY: currentPlatform.current.y,
    };
    gameState.current = "PLAYING";
    setFeedback("");
  };

  const initializeQuestionPads = () => {
    // yShift harus dihitung relatif terhadap INITIAL_FROG_Y
    const yShift = currentPlatform.current.y - INITIAL_FROG_Y;

    const shuffledPads = shuffleArray([...defaultPadPositions]);
    const labeledPads = shuffledPads.map((pad, idx) => ({
      ...pad,
      // Posisi Y baru dihitung dari posisi mutlak (tergeser)
      y: pad.y + yShift,
      label: String.fromCharCode(65 + idx),
    }));
    setCurrentPads(labeledPads);
    resetFrogPosition();
  };

  const handleWrongAnswer = () => {
    setFeedback("Waktu Habis/Salah!");
    if (wrongSound) wrongSound.play();
    frog.current.action = "SINK";
    frog.current.animT = 0;

    setTimeout(() => {
      if (lives <= 1) {
        setGameOver(true);
        gameState.current = "GAMEOVER";
        if (gameOverSound) gameOverSound.play();
      } else {
        setLives((l) => l - 1);
        resetFrogPosition();
        initializeQuestionPads();
      }
    }, 1500);
  };

  const nextQuestion = () => {
    if (questionIndex < allQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setTimer(20);
      setFeedback("");
      initializeQuestionPads();
    } else {
      setFeedback("Menang!");
      setGameOver(true);
      gameState.current = "GAMEOVER";
      if (gameOverSound) gameOverSound.play();
    }
  };

  const handleAnswer = (selectedIndex) => {
    if (gameState.current !== "PLAYING") return;

    const currentQuestion = allQuestions[questionIndex];
    const originalCorrectOptionIndex = currentQuestion.ans;
    const clickedOptionText = currentQuestion.options[selectedIndex];
    const clickedPad = currentPads[selectedIndex];
    const isCorrect = clickedOptionText === currentQuestion.options[originalCorrectOptionIndex];

    gameState.current = "ANIMATING";

    if (isCorrect) {
      setFeedback("Benar!");
      if (correctSound) correctSound.play();
      if (jumpSound) jumpSound.play();

      // Hitung Scroll Target
      const scrollDistance = clickedPad.y - currentPlatform.current.y;
      scrollTargetY.current = yOffset.current - scrollDistance;

      // UPDATE POSISI PLATFORM SAAT INI (Mutlak di dunia game)
      currentPlatform.current = {
        x: clickedPad.x,
        y: clickedPad.y,
        isStart: false
      };

      // Kodok lompat ke teratai yang diklik (Posisi mutlak)
      frog.current.action = "JUMP";
      frog.current.targetX = clickedPad.x;
      frog.current.targetY = clickedPad.y;
      frog.current.startX = frog.current.x;
      frog.current.startY = frog.current.y;
      frog.current.animT = 0;

      setPadToHide(selectedIndex);

      setTimeout(() => {
        setScore((s) => s + 100);
        setPadToHide(null);
        nextQuestion();
      }, 1500);
    } else {
      handleWrongAnswer();
    }
  };

  // --- EFFECTS / LIFECYCLES ---

  useEffect(() => {
    initializeQuestionPads();
  }, []);

  useEffect(() => {
    if (timer > 0 && !gameOver && gameState.current === "PLAYING") {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && gameState.current === "PLAYING") {
      handleWrongAnswer();
    }
  }, [timer, gameOver, lives]);

  // --- P5.JS FUNCTIONS ---

  const preload = (p5) => {
    try {
      // Pastikan path audio benar (asumsi di folder 'public/sounds')
      jumpSound = new Audio('/sounds/jump.mp3');
      correctSound = new Audio('/sounds/correct.mp3');
      wrongSound = new Audio('/sounds/wrong.mp3');
      gameOverSound = new Audio('/sounds/gameover.mp3');
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  };

  const setup = (p5, canvasParentRef) => {
    // Menggunakan CANVAS_WIDTH dan CANVAS_HEIGHT yang sudah diset di atas
    p5.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).parent(canvasParentRef);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.ellipseMode(p5.CENTER);
  };

  const draw = (p5) => {
    // 0. UPDATE SCROLL OFFSET
    yOffset.current = p5.lerp(yOffset.current, scrollTargetY.current, 0.05);

    // 1. Background Air
    p5.background(40, 180, 255);

    // 2. Geser Seluruh Dunia P5.js
    p5.push();
    p5.translate(0, yOffset.current);

    // Efek riak air
    p5.noFill();
    p5.stroke(255, 255, 255, 70);
    p5.strokeWeight(2);
    for (let i = 0; i < 8; i++) {
      let xPos = (p5.frameCount * 2 + i * 150) % (CANVAS_WIDTH + 100);
      let yPos = CANVAS_HEIGHT / 2 + Math.sin(xPos * 0.01 + p5.frameCount * 0.05) * 50;
      p5.ellipse(xPos - 50, yPos, 150, 80);
    }

    // 3. Gambar Teratai (Jawaban)
    currentPads.forEach((pad, idx) => {
      const optionText = allQuestions[questionIndex] ? allQuestions[questionIndex].options[idx] : "";

      if (padToHide === idx) {
        // Animasi teratai tenggelam
        let t = frog.current.animT;
        let shrinkScale = p5.lerp(1, 0, t);
        let sinkY = p5.lerp(pad.y, pad.y + 200, t);

        if (shrinkScale > 0.05) {
          drawLilyPad(p5, pad.x, sinkY, 130, optionText, idx, shrinkScale);
        }
      } else {
        // Gambar teratai normal
        // Tambahkan efek mengambang saat IDLE
        let floatY = (gameState.current === "PLAYING") ? Math.sin(p5.frameCount * 0.03 + idx) * 5 : 0;
        drawLilyPad(p5, pad.x, pad.y + floatY, 130, optionText, idx, 1);
      }
    });

    // 4. Gambar Teratai Awal/Platform Terakhir
    const platformLabel = currentPlatform.current.isStart ? "Mulai" : `Q${questionIndex}`;
    // Tambahkan efek mengambang pada platform
    let platformFloatY = (gameState.current === "PLAYING") ? Math.sin(p5.frameCount * 0.03 + 5) * 5 : 0;
    drawLilyPad(p5, currentPlatform.current.x, currentPlatform.current.y + 50 + platformFloatY, 150, platformLabel, -1, 1);

    // 5. Update & Gambar Kodok
    updateFrog(p5);
    drawFrog(p5, frog.current.x, frog.current.y, frog.current.scale);

    p5.pop(); // Selesai menggeser
  };

  const updateFrog = (p5) => {
    const f = frog.current;

    if (f.action === "JUMP") {
      if (f.animT < 1) {
        f.animT += 0.05;
        // Animasi lompatan
        f.x = p5.lerp(f.startX, f.targetX, f.animT);
        let baseY = p5.lerp(f.startY, f.targetY, f.animT);
        let jumpHeight = Math.sin(f.animT * Math.PI) * 120;
        f.y = baseY - jumpHeight;
        f.scale = 1 + Math.sin(f.animT * Math.PI) * 0.2;
      } else {
        f.x = f.targetX;
        f.y = f.targetY;
        f.scale = 1;
        f.action = "LAND"; // Ganti ke LAND untuk animasi pendaratan
      }
    } else if (f.action === "LAND") {
        if (f.animT < 1.1) { // Lanjutkan animT sedikit untuk animasi LAND
            f.animT += 0.05;
            // Animasi 'squish' kecil saat mendarat
            f.scale = 1 - Math.sin((f.animT - 1) * p5.PI * 5) * 0.1; 
        } else {
            f.scale = 1;
            f.action = "IDLE";
        }
    } else if (f.action === "SINK") {
      if (f.scale > 0) {
        f.scale -= 0.03;
        f.y += 3;
        f.y = Math.min(f.y, currentPlatform.current.y + 200);
      } else {
        f.scale = 0;
      }
    }

    // Pastikan game state kembali ke PLAYING setelah animasi selesai
    if (f.action === "IDLE" && gameState.current === "ANIMATING" && padToHide === null) {
      gameState.current = "PLAYING";
    }
  };

  // --- ASSET GAMBAR (Prosedural) ---

  const drawLilyPad = (p5, x, y, size, text, idx, scale) => {
    p5.push();
    p5.translate(x, y);
    p5.scale(scale);

    // Scaling font dan posisi agar proporsional
    const baseSize = 130;
    const sizeRatio = size / baseSize;

    p5.noStroke();
    // Daun Utama
    p5.fill(34, 139, 34);
    p5.arc(0, 0, size, size, 0.1 * p5.PI, 1.9 * p5.PI, p5.PIE);
    // Detail Urat Daun
    p5.stroke(20, 100, 20);
    p5.strokeWeight(2 * sizeRatio);
    p5.line(0, 0, size / 2.2, 0);
    p5.line(0, 0, size / 2.5, size / 3);
    p5.line(0, 0, size / 2.5, -size / 3);

    if (idx !== -1) {
      p5.noStroke();
      p5.fill(255);
      p5.textSize(14 * sizeRatio);
      p5.textStyle(p5.BOLD);
      // Label (A, B, C) circle
      p5.fill(100, 200, 0);
      p5.circle(0, -size / 2 + 10 * sizeRatio, 30 * sizeRatio);
      p5.fill(255);
      p5.text(["A", "B", "C"][idx], 0, -size / 2 + 10 * sizeRatio);

      // Konten Jawaban
      p5.fill(255);
      p5.textSize(16 * sizeRatio);
      p5.text(text, 0, 10 * sizeRatio);
    } else {
      p5.noStroke();
      p5.fill(255);
      p5.textSize(18 * sizeRatio);
      p5.textStyle(p5.BOLD);
      p5.text(text, 0, 0);
    }
    p5.pop();
  };

  const drawFrog = (p5, x, y, s) => {
    p5.push();
    p5.translate(x, y);
    p5.scale(s);

    p5.noStroke();
    // Kaki Belakang
    p5.fill(50, 205, 50);
    p5.ellipse(-25, 10, 20, 40);
    p5.ellipse(25, 10, 20, 40);
    // Badan
    p5.fill(34, 139, 34);
    p5.ellipse(0, 0, 60, 50);
    // Perut
    p5.fill(144, 238, 144);
    p5.ellipse(0, 5, 30, 25);
    // Mata
    p5.fill(34, 139, 34);
    p5.circle(-15, -20, 20);
    p5.circle(15, -20, 20);
    p5.fill(255);
    p5.circle(-15, -20, 15);
    p5.circle(15, -20, 15);
    p5.fill(0);
    p5.circle(-15, -20, 5);
    p5.circle(15, -20, 5);
    // Mulut (Senyum)
    p5.noFill();
    p5.stroke(0);
    p5.strokeWeight(2);
    p5.arc(0, 0, 20, 20, 0.2 * p5.PI, 0.8 * p5.PI);
    // Tas Ungu
    p5.noStroke();
    p5.fill(128, 0, 128);
    p5.rect(-10, 10, 20, 15, 5);

    p5.pop();
  };

  const mousePressed = (p5) => {
    if (gameState.current === "PLAYING") {
      currentPads.forEach((pad, index) => {
        // Perhitungan jarak klik harus memperhitungkan yOffset
        let d = p5.dist(p5.mouseX, p5.mouseY, pad.x, pad.y + yOffset.current);
        if (d < 60) {
          handleAnswer(index);
        }
      });
    }
  };

  // --- STYLING (CSS-in-JS sederhana) ---
  const styles = {
    container: {
      position: "fixed", // Menggunakan fixed agar tidak ada scrollbar
      top: 0,
      left: 0,
      width: "100vw", // Penuh layar
      height: "100vh", // Penuh layar
      margin: 0,
      padding: 0,
      fontFamily: "Arial, sans-serif",
      // Menghilangkan border karena sudah fullscreen
      // boxShadow: "0 0 20px rgba(0,0,0,0.5)", 
      overflow: "hidden",
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "60px", // Dibuat sedikit lebih besar
      background: "#2e8b57",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 40px",
      color: "white",
      boxSizing: "border-box",
      zIndex: 10,
      fontSize: "1.2em",
      fontWeight: "bold",
    },
    questionBox: {
      position: "absolute",
      // Disesuaikan agar berada di tengah atas, lebih jauh dari header
      top: "100px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "80%", // Lebih lebar untuk layar besar
      maxWidth: "600px", // Batasi lebar maksimum
      background: "#fff",
      padding: "20px",
      borderRadius: "10px",
      textAlign: "center",
      border: "4px solid #6dbf44",
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333",
      zIndex: 10,
    },
    feedback: {
      position: "absolute",
      bottom: "20%",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "40px",
      fontWeight: "bold",
      color: "#fff",
      textShadow: "2px 2px 4px #000",
      zIndex: 20,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.8)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 30,
      fontSize: "2em",
    },
    restartButton: {
      padding: "15px 30px",
      fontSize: "24px",
      cursor: "pointer",
      marginTop: "30px",
      backgroundColor: "#6dbf44",
      color: "white",
      border: "none",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
      transition: "transform 0.2s",
    }
  };


  return (
    <div style={styles.container}>
      {/* UI HEADER */}
      <div style={styles.header}>
        <div>
          Lives:{" "}
          <span role="img" aria-label="heart">
            {"❤️".repeat(lives)}
          </span>
        </div>
        <div>Time: {timer}s</div>
        <div>Score: {score}</div>
      </div>

      {/* QUESTION BOX */}
      {!gameOver && allQuestions[questionIndex] && (
        <div style={styles.questionBox}>
          {allQuestions[questionIndex].q}
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameOver && (
        <div style={styles.overlay}>
          <h1>Game Over</h1>
          <h2>Final Score: {score}</h2>
          <button
            onClick={() => window.location.reload()}
            style={styles.restartButton}
          >
            Main Lagi
          </button>
        </div>
      )}

      {/* FEEDBACK TEXT (Benar/Salah) */}
      {feedback && <div style={styles.feedback}>{feedback}</div>}

      {/* P5 CANVAS */}
      <Sketch setup={setup} draw={draw} mousePressed={mousePressed} preload={preload} />
    </div>
  );
};

export default FrogQuiz;