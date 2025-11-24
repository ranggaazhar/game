import React, { useState, useEffect, useRef } from "react";
import Sketch from "react-p5";

// --- GLOBAL VARIABLES & HELPER FUNCTIONS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Fungsi untuk mengacak array (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- AUDIO FILES (Placeholder) ---
// Pastikan Anda telah menaruh file audio di folder public/sounds/
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
  const [feedback, setFeedback] = useState(""); // "Benar!" atau "Salah!"
  const [currentPads, setCurrentPads] = useState([]); // Posisi pads yang sudah diacak

  // --- DATA PERTANYAAN ---
  const allQuestions = [
    {
      q: "Metode p5.js untuk menggambar lingkaran adalah?",
      options: ["rect()", "circle()", "line()"],
      ans: 1, // index jawaban benar (circle)
    },
    {
      q: "Hook React untuk menyimpan state adalah?",
      options: ["useEffect", "useState", "useHistory"],
      ans: 1, // useState
    },
    {
      q: "Warna default background web adalah?",
      options: ["Putih", "Hitam", "Biru"],
      ans: 0, // Putih
    },
    {
        q: "Apa nama library untuk menggambar di React?",
        options: ["react-dom", "react-p5", "react-redux"],
        ans: 1, // react-p5
    },
    {
        q: "Fungsi untuk inisialisasi p5.js adalah?",
        options: ["draw()", "setup()", "loop()"],
        ans: 1, // setup()
    },
    {
        q: "Apa fungsi Hook 'useEffect'?",
        options: ["Mengubah state", "Menggantikan componentDidMount/Update", "Membuat komponen baru"],
        ans: 1, // Menggantikan componentDidMount/Update
    },
  ];

  // --- STATE REF (Untuk Logika P5 tanpa re-render) ---
  const gameState = useRef("PLAYING"); // PLAYING, ANIMATING, GAMEOVER
  const frog = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 150, // Posisi awal kodok di teratai bawah
    scale: 1,
    targetX: CANVAS_WIDTH / 2,
    targetY: CANVAS_HEIGHT - 150,
    animT: 0, // Waktu animasi 0.0 s/d 1.0
    action: "IDLE", // IDLE, JUMP, SINK
    startX: CANVAS_WIDTH / 2, // Posisi X awal lompatan
    startY: CANVAS_HEIGHT - 150, // Posisi Y awal lompatan
  });

  // Posisi PAD yang MUNGKIN (akan diacak untuk setiap pertanyaan)
  const defaultPadPositions = [
    { x: 200, y: 250 },
    { x: 400, y: 200 },
    { x: 600, y: 250 },
  ];

  // --- INITIALIZATION ON MOUNT ---
  useEffect(() => {
    // Inisialisasi posisi pads untuk pertanyaan pertama
    initializeQuestionPads();
  }, []); // Hanya berjalan sekali saat komponen dimuat

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (timer > 0 && !gameOver && gameState.current === "PLAYING") {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && gameState.current === "PLAYING") {
      handleWrongAnswer();
    }
  }, [timer, gameOver]);

  // --- GAMEPLAY LOGIC ---

  const initializeQuestionPads = () => {
    // Acak posisi default pads
    const shuffledPads = shuffleArray([...defaultPadPositions]); // Copy array agar tidak mengubah aslinya
    // Assign label A, B, C ke pads yang sudah diacak
    const labeledPads = shuffledPads.map((pad, idx) => ({
      ...pad,
      label: String.fromCharCode(65 + idx), // A, B, C
    }));
    setCurrentPads(labeledPads);
    resetFrogPosition();
  };

  const handleAnswer = (selectedIndex) => {
    if (gameState.current !== "PLAYING") return;

    // Temukan index jawaban benar dari pertanyaan saat ini (berdasarkan urutan options asli)
    const currentQuestion = allQuestions[questionIndex];
    const originalCorrectOptionIndex = currentQuestion.ans;
    const correctOptionText = currentQuestion.options[originalCorrectOptionIndex];

    // Dapatkan teks opsi yang diklik dari pertanyaan saat ini
    const clickedOptionText = currentQuestion.options[selectedIndex];
    const clickedPad = currentPads[selectedIndex];
    const isCorrect = clickedOptionText === correctOptionText;

    gameState.current = "ANIMATING";

    if (isCorrect) {
      setFeedback("Benar!");
      if (correctSound) correctSound.play();
      if (jumpSound) jumpSound.play();

      frog.current.action = "JUMP";
      frog.current.targetX = clickedPad.x;
      frog.current.targetY = clickedPad.y;
      frog.current.startX = frog.current.x;
      frog.current.startY = frog.current.y;
      frog.current.animT = 0;

      setTimeout(() => {
        setScore((s) => s + 100);
        nextQuestion();
      }, 1500);
    } else {
      setFeedback("Salah!");
      if (wrongSound) wrongSound.play();
      frog.current.action = "SINK";
      frog.current.animT = 0;

      setTimeout(() => {
        // PERBAIKAN ERROR no-undef: Cek sebelum mengurangi life
        if (lives <= 1) { 
          setGameOver(true);
          gameState.current = "GAMEOVER";
          if (gameOverSound) gameOverSound.play();
        } else {
          setLives((l) => l - 1); // Kurangi lives dengan updater function
          resetFrogPosition();
          initializeQuestionPads(); // Acak ulang pads untuk pertanyaan yang sama
        }
      }, 1500);
    }
  };

  const nextQuestion = () => {
    if (questionIndex < allQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setTimer(20);
      setFeedback("");
      initializeQuestionPads(); // Inisialisasi pads baru untuk pertanyaan berikutnya
    } else {
      setFeedback("Menang!");
      setGameOver(true);
      gameState.current = "GAMEOVER";
      if (gameOverSound) gameOverSound.play();
    }
  };

  const handleWrongAnswer = () => {
    setFeedback("Waktu Habis!");
    if (wrongSound) wrongSound.play();
    frog.current.action = "SINK";
    frog.current.animT = 0;
    
    setTimeout(() => {
      // PERBAIKAN ERROR no-undef: Cek sebelum mengurangi life
      if (lives <= 1) { 
        setGameOver(true);
        gameState.current = "GAMEOVER";
        if (gameOverSound) gameOverSound.play();
      } else {
        setLives((l) => l - 1); // Kurangi lives
        resetFrogPosition();
        initializeQuestionPads(); // Acak ulang pads
      }
    }, 1500);
  };

  const resetFrogPosition = () => {
    frog.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 150,
      scale: 1,
      targetX: CANVAS_WIDTH / 2,
      targetY: CANVAS_HEIGHT - 150,
      animT: 0,
      action: "IDLE",
      startX: CANVAS_WIDTH / 2,
      startY: CANVAS_HEIGHT - 150,
    };
    gameState.current = "PLAYING";
    setFeedback("");
  };

  // --- P5.JS FUNCTIONS ---

  const preload = (p5) => {
    // Memuat file audio dari folder public/sounds
    try {
      jumpSound = new Audio('/sounds/jump.mp3');
      correctSound = new Audio('/sounds/correct.mp3');
      wrongSound = new Audio('/sounds/wrong.mp3');
      gameOverSound = new Audio('/sounds/gameover.mp3');
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  };

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).parent(canvasParentRef);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.ellipseMode(p5.CENTER); // Pastikan ellipse digambar dari tengah
  };

  const draw = (p5) => {
    // 1. Background Air
    p5.background(40, 180, 255);
    // Efek riak air sederhana
    p5.noFill();
    p5.stroke(255, 255, 255, 50);
    p5.strokeWeight(2);
    for (let i = 0; i < 5; i++) {
      let size = (p5.frameCount * 1.5 + i * 120) % (CANVAS_WIDTH + 200);
      p5.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, size, size * 0.6);
    }

    // 2. Gambar Teratai (Jawaban)
    // Gunakan currentPads yang sudah diacak
    currentPads.forEach((pad, idx) => {
      // Tampilkan opsi dari pertanyaan saat ini sesuai urutan pads yang diacak
      const optionText = allQuestions[questionIndex] ? allQuestions[questionIndex].options[idx] : "";
      drawLilyPad(p5, pad.x, pad.y, 130, optionText, idx);
    });

    // 3. Gambar Teratai Awal (Base)
    drawLilyPad(p5, frog.current.startX, frog.current.startY + 50, 150, "Mulai", -1); // +50 untuk sedikit di bawah kodok

    // 4. Update & Gambar Kodok
    updateFrog(p5);
    drawFrog(p5, frog.current.x, frog.current.y, frog.current.scale);
  };

  const updateFrog = (p5) => {
    const f = frog.current;

    if (f.action === "JUMP") {
      if (f.animT < 1) {
        f.animT += 0.05; // Kecepatan lompat
        f.x = p5.lerp(f.startX, f.targetX, f.animT);
        let baseY = p5.lerp(f.startY, f.targetY, f.animT);
        let jumpHeight = Math.sin(f.animT * Math.PI) * 120; // Tinggi lompatan
        f.y = baseY - jumpHeight;
        f.scale = 1 + Math.sin(f.animT * Math.PI) * 0.2;
      } else {
        f.x = f.targetX;
        f.y = f.targetY;
        f.scale = 1;
        f.action = "IDLE"; // Kodok kembali IDLE setelah lompat
        gameState.current = "PLAYING"; // Kembali ke state bermain
      }
    } else if (f.action === "SINK") {
      if (f.scale > 0) {
        f.scale -= 0.03; // Kecepatan tenggelam
        f.y += 3; // Turun ke bawah
        f.y = Math.min(f.y, CANVAS_HEIGHT + 50); // Batasi agar tidak terlalu jauh ke bawah
      } else {
        f.scale = 0; // Pastikan skala jadi 0 agar hilang
        // Setelah tenggelam, game state akan diatur di setTimeout handleAnswer/handleWrongAnswer
      }
    }
  };

  // --- ASSET GAMBAR (Prosedural) ---

  const drawLilyPad = (p5, x, y, size, text, idx) => {
    p5.push();
    p5.translate(x, y);
    p5.noStroke();
    // Daun Utama
    p5.fill(34, 139, 34); // Forest Green
    p5.arc(0, 0, size, size, 0.1 * p5.PI, 1.9 * p5.PI, p5.PIE);
    // Detail Urat Daun
    p5.stroke(20, 100, 20);
    p5.strokeWeight(2);
    p5.line(0, 0, size / 2.2, 0);
    p5.line(0, 0, size / 2.5, size / 3);
    p5.line(0, 0, size / 2.5, -size / 3);

    // Text Label (A, B, C atau Jawaban)
    if (idx !== -1) {
      p5.noStroke();
      p5.fill(255);
      p5.textSize(14);
      p5.textStyle(p5.BOLD);
      // Label (A, B, C) circle
      p5.fill(100, 200, 0); // Warna hijau lebih terang
      p5.circle(0, -size / 2 + 10, 30); // Sedikit lebih rendah
      p5.fill(255);
      p5.text(["A", "B", "C"][idx], 0, -size / 2 + 10);

      // Konten Jawaban
      p5.fill(255);
      p5.textSize(16);
      p5.text(text, 0, 10);
    } else { // Label untuk teratai "Start"
        p5.noStroke();
        p5.fill(255);
        p5.textSize(18);
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
    p5.fill(50, 205, 50); // Lime Green
    p5.ellipse(-25, 10, 20, 40);
    p5.ellipse(25, 10, 20, 40);

    // Badan
    p5.fill(34, 139, 34);
    p5.ellipse(0, 0, 60, 50); // Badan bulat

    // Perut (Warna lebih muda)
    p5.fill(144, 238, 144);
    p5.ellipse(0, 5, 30, 25);

    // Mata
    p5.fill(34, 139, 34);
    p5.circle(-15, -20, 20); // Tonjolan mata kiri
    p5.circle(15, -20, 20); // Tonjolan mata kanan

    p5.fill(255);
    p5.circle(-15, -20, 15); // Putih mata
    p5.circle(15, -20, 15);

    p5.fill(0);
    p5.circle(-15, -20, 5); // Pupil
    p5.circle(15, -20, 5);

    // Mulut (Senyum)
    p5.noFill();
    p5.stroke(0);
    p5.strokeWeight(2);
    p5.arc(0, 0, 20, 20, 0.2 * p5.PI, 0.8 * p5.PI);

    // Tas Ungu (seperti di gambar referensi)
    p5.noStroke();
    p5.fill(128, 0, 128);
    p5.rect(-10, 10, 20, 15, 5);

    p5.pop();
  };

  const mousePressed = (p5) => {
    // Deteksi klik pada pad jawaban
    if (gameState.current === "PLAYING") {
      currentPads.forEach((pad, index) => {
        let d = p5.dist(p5.mouseX, p5.mouseY, pad.x, pad.y);
        if (d < 60) {
          // 60 adalah radius hit area pad
          handleAnswer(index);
        }
      });
    }
  };

  // --- STYLING (CSS-in-JS sederhana) ---
  const styles = {
    container: {
      position: "relative",
      width: `${CANVAS_WIDTH}px`,
      margin: "0 auto",
      fontFamily: "Arial, sans-serif",
      border: "5px solid #333", // Bingkai game
      boxShadow: "0 0 20px rgba(0,0,0,0.5)",
      overflow: "hidden", // Memastikan elemen tidak keluar dari container
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "50px",
      background: "#2e8b57", // Warna hijau gelap
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px",
      color: "white",
      boxSizing: "border-box",
      zIndex: 10,
      fontSize: "1.1em",
      fontWeight: "bold",
    },
    questionBox: {
      position: "absolute",
      top: "65px", // Sedikit lebih rendah dari header
      left: "50%",
      transform: "translateX(-50%)",
      width: "90%",
      background: "#fff",
      padding: "15px",
      borderRadius: "10px",
      textAlign: "center",
      border: "4px solid #6dbf44",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
      zIndex: 10,
    },
    feedback: {
      position: "absolute",
      bottom: "20%", // Lebih ke tengah agar terlihat jelas
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
      {/* Pastikan pertanyaan hanya ditampilkan jika belum Game Over */}
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