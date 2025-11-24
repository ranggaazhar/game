// src/components/FrogQuiz.js

import React, { useState, useEffect, useRef } from "react";
import Sketch from "react-p5";
import '../FrogQuiz.css'; // Pastikan CSS diimpor

// --- GLOBAL VARIABLES & HELPER FUNCTIONS ---
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const INITIAL_FROG_Y = CANVAS_HEIGHT * 0.75; 

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

const FrogQuiz = ({ onBack }) => { 
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
  const yOffset = useRef(0); 
  const scrollTargetY = useRef(0); 

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
    const yShift = currentPlatform.current.y - INITIAL_FROG_Y;
    const shuffledPads = shuffleArray([...defaultPadPositions]);
    const labeledPads = shuffledPads.map((pad, idx) => ({
      ...pad,
      y: pad.y + yShift,
      label: String.fromCharCode(65 + idx),
    }));
    setCurrentPads(labeledPads);
    resetFrogPosition();
  };

  const finishSinkingAndReset = () => {
    if (lives <= 1) {
      setGameOver(true);
      gameState.current = "GAMEOVER";
      if (gameOverSound) gameOverSound.play();
    } else {
      setLives((l) => l - 1);
      resetFrogPosition();
      initializeQuestionPads();
    }
  };

  const nextQuestion = () => {
    if (questionIndex < allQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setTimer(20);
      setFeedback("");
      setPadToHide(null);
      initializeQuestionPads();
    } else {
      setFeedback("Menang! 🎉");
      setGameOver(true);
      gameState.current = "GAMEOVER";
      if (gameOverSound) gameOverSound.play();
    }
  };

  const handleAnswer = (selectedIndex) => {
    if (gameState.current !== "PLAYING" || gameOver) return;

    const currentQuestion = allQuestions[questionIndex];
    const originalCorrectOptionIndex = currentQuestion.ans;
    const clickedOptionText = currentQuestion.options[selectedIndex];
    const clickedPad = currentPads[selectedIndex];
    const isCorrect = clickedOptionText === currentQuestion.options[originalCorrectOptionIndex];

    gameState.current = "ANIMATING";

    frog.current.action = "JUMP_TO_CHECK"; 
    frog.current.targetX = clickedPad.x;
    frog.current.targetY = clickedPad.y;
    frog.current.startX = frog.current.x;
    frog.current.startY = frog.current.y;
    frog.current.animT = 0;
    if (jumpSound) jumpSound.play();

    if (!isCorrect) {
      setPadToHide(selectedIndex); 
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
      setFeedback("Waktu Habis! 😭");
      if (wrongSound) wrongSound.play();
      
      gameState.current = "ANIMATING"; 
      frog.current.action = "SINK"; 
      
      setTimeout(() => {
        finishSinkingAndReset();
      }, 1500); 
    }
  }, [timer, gameOver, lives]);

  // --- P5.JS FUNCTIONS (Sama seperti sebelumnya) ---

  const preload = (p5) => {
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
    p5.ellipseMode(p5.CENTER);
  };
  
  // Fungsi drawLilyPad dan drawFrog dipertahankan sama persis dari kode sebelumnya
  const drawLilyPad = (p5, x, y, size, text, idx, scale) => {
      p5.push();
      p5.translate(x, y);
      p5.scale(scale);

      const baseSize = 130;
      const sizeRatio = size / baseSize;
      const padColor = p5.color(34, 139, 34); 
      const lightColor = p5.color(107, 180, 78); 

      // Bayangan
      p5.noStroke();
      p5.fill(0, 0, 0, 50); 
      p5.ellipse(0, 20 * sizeRatio, size * 1.05, size * 0.4);

      // Daun Utama
      p5.noStroke();
      p5.fill(padColor);
      p5.arc(0, 0, size, size * 0.7, 0.1 * p5.PI, 1.9 * p5.PI, p5.PIE);
      
      // Cahaya
      p5.fill(lightColor);
      p5.arc(0, -10 * sizeRatio, size * 0.9, size * 0.65, 0.1 * p5.PI, 1.9 * p5.PI, p5.PIE);

      // Detail Urat Daun
      p5.stroke(20, 100, 20);
      p5.strokeWeight(2 * sizeRatio);
      p5.noFill();
      p5.curve(-size/2, 0, 0, 0, size/2, 0, size/2, 0); 
      p5.curve(-size/2, -size/4, 0, 0, size/3, -size/5, size/2, -size/4);
      p5.curve(-size/2, size/4, 0, 0, size/3, size/5, size/2, size/4);

      // Tulisan/Label
      if (idx !== -1) {
        p5.noStroke();
        p5.textSize(16 * sizeRatio);
        p5.textStyle(p5.BOLD);

        // Label (A, B, C) circle
        p5.fill(255, 165, 0); 
        p5.ellipse(0, -size / 2 + 10 * sizeRatio, 35 * sizeRatio, 25 * sizeRatio);
        p5.fill(255);
        p5.text(["A", "B", "C"][idx], 0, -size / 2 + 10 * sizeRatio);

        // Konten Jawaban
        p5.fill(255);
        p5.textSize(18 * sizeRatio);
        p5.text(text, 0, 15 * sizeRatio);
      } else {
        p5.noStroke();
        p5.fill(255);
        p5.textSize(20 * sizeRatio);
        p5.textStyle(p5.BOLD);
        p5.text(text, 0, 0);
      }
      p5.pop();
  };

  const drawFrog = (p5, x, y, s) => {
      p5.push();
      p5.translate(x, y);
      p5.scale(s);

      // BAYANGAN KODOK
      p5.noStroke();
      p5.fill(0, 0, 0, 80);
      p5.ellipse(0, 20, 50, 10);

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


  const draw = (p5) => {
    // 0. UPDATE SCROLL OFFSET
    yOffset.current = p5.lerp(yOffset.current, scrollTargetY.current, 0.1);

    // 1. Background Air 💧
    p5.noStroke();
    let startYWorld = -yOffset.current; 
    for (let yScreen = 0; yScreen < CANVAS_HEIGHT; yScreen++) {
      let yWorld = yScreen - yOffset.current; 
      let inter = p5.map(yWorld, startYWorld - CANVAS_HEIGHT, startYWorld + CANVAS_HEIGHT, 0, 1);
      inter = p5.constrain(inter, 0, 1); 
      
      let c = p5.lerpColor(p5.color(60, 200, 255), p5.color(20, 100, 150), inter);
      p5.stroke(c);
      p5.line(0, yScreen, CANVAS_WIDTH, yScreen); 
    }

    // 2. Geser Seluruh Dunia P5.js
    p5.push();
    p5.translate(0, yOffset.current);

    // EFEK TEKSTUR PERMUKAAN AIR (Perlin Noise) 🌊
    p5.noStroke();
    p5.fill(255, 255, 255, 30); 
    let noiseScale = 0.02; 
    let time = p5.frameCount * 0.01; 
    let yStart = currentPlatform.current.y - CANVAS_HEIGHT * 0.5;
    let yEnd = currentPlatform.current.y + CANVAS_HEIGHT * 0.5;

    for (let yWorld = yStart; yWorld < yEnd; yWorld += 15) { 
      p5.beginShape();
      let startX = 0;
      p5.vertex(startX, yWorld); 
      for (let x = startX; x <= CANVAS_WIDTH; x += 10) {
        let n = p5.noise(x * noiseScale, yWorld * noiseScale * 0.5, time); 
        let rippleHeight = n * 20 - 10; 
        p5.curveVertex(x, yWorld + rippleHeight); 
      }
      p5.vertex(CANVAS_WIDTH, yWorld); 
      p5.endShape();
    }

    // Efek riak air (lingkaran yang lebih besar, transparan)
    p5.noFill();
    p5.stroke(255, 255, 255, 80); 
    p5.strokeWeight(1.5);
    for (let i = 0; i < 7; i++) { 
      let yWorld = currentPlatform.current.y - 300 + (i * 150) + Math.sin(p5.frameCount * 0.02 + i) * 30;
      let xPos = CANVAS_WIDTH * 0.5 + Math.cos(p5.frameCount * 0.01 + i * 0.5) * (CANVAS_WIDTH * 0.3);
      p5.ellipse(xPos, yWorld, 200, 80 + Math.sin(p5.frameCount * 0.05 + i) * 20); 
    }


    // 3. Gambar Teratai (Jawaban)
    currentPads.forEach((pad, idx) => {
      const optionText = allQuestions[questionIndex] ? allQuestions[questionIndex].options[idx] : "";

      if (padToHide === idx && frog.current.action === "JUMP_TO_CHECK") {
        let floatY = (gameState.current === "PLAYING") ? Math.sin(p5.frameCount * 0.03 + idx) * 5 : 0;
        drawLilyPad(p5, pad.x, pad.y + floatY, 130, optionText, idx, 1);
      } 
      else if (padToHide === idx) {
        let shrinkScale = 1;
        let sinkY = pad.y;
        
        if (frog.current.action === "SINK_AFTER_JUMP") {
          shrinkScale = p5.lerp(1, 0, p5.constrain((frog.current.y - pad.y) / 150, 0, 1));
          sinkY = p5.lerp(pad.y, pad.y + 200, p5.constrain((frog.current.y - pad.y) / 150, 0, 1));
        }
        else if (gameState.current === "ANIMATING" && frog.current.action !== "JUMP_TO_CHECK") {
             shrinkScale = p5.lerp(1, 0, frog.current.animT * 2);
             sinkY = p5.lerp(pad.y, pad.y + 100, frog.current.animT * 2);
        }

        if (shrinkScale > 0.05) {
          drawLilyPad(p5, pad.x, sinkY, 130, optionText, idx, shrinkScale);
        }
      } 
      else {
        let floatY = (gameState.current === "PLAYING") ? Math.sin(p5.frameCount * 0.03 + idx) * 5 : 0;
        drawLilyPad(p5, pad.x, pad.y + floatY, 130, optionText, idx, 1);
      }
    });

    // 4. Gambar Teratai Awal/Platform Terakhir
    const platformLabel = currentPlatform.current.isStart ? "Mulai" : `Q${questionIndex}`;
    let platformFloatY = (gameState.current === "PLAYING") ? Math.sin(p5.frameCount * 0.03 + 5) * 5 : 0;
    drawLilyPad(p5, currentPlatform.current.x, currentPlatform.current.y + 0 + platformFloatY, 150, platformLabel, -1, 1);

    // 5. Update & Gambar Kodok
    updateFrog(p5);
    drawFrog(p5, frog.current.x, frog.current.y, frog.current.scale);

    p5.pop(); // Selesai menggeser
  };


  const updateFrog = (p5) => {
    const f = frog.current;

    // JUMP dan JUMP_TO_CHECK
    if (f.action === "JUMP" || f.action === "JUMP_TO_CHECK") {
      if (f.animT < 1) {
        f.animT += 0.05;
        f.x = p5.lerp(f.startX, f.targetX, f.animT);
        let baseY = p5.lerp(f.startY, f.targetY, f.animT);
        let jumpHeight = Math.sin(f.animT * p5.PI) * 120;
        f.y = baseY - jumpHeight;
        f.scale = 1 + Math.sin(f.animT * p5.PI) * 0.2;
      } else {
        f.x = f.targetX;
        f.y = f.targetY;
        f.scale = 1;
        f.animT = 1; 

        if (f.action === "JUMP_TO_CHECK") {
          const currentQuestion = allQuestions[questionIndex];
          const clickedPadIndex = currentPads.findIndex(pad => pad.x === f.targetX && pad.y === f.targetY);

          if (clickedPadIndex !== -1) {
            const clickedOptionText = currentQuestion.options[clickedPadIndex];
            const isCorrect = clickedOptionText === currentQuestion.options[currentQuestion.ans];

            if (!isCorrect) {
              f.action = "SINK_AFTER_JUMP"; 
              setFeedback("Salah! 😔");
              if (wrongSound) wrongSound.play();
            } else {
              f.action = "LAND"; 
              setFeedback("Benar! 🎉"); 
              if (correctSound) correctSound.play();

              const clickedPad = currentPads[clickedPadIndex];
              const scrollDistance = clickedPad.y - currentPlatform.current.y;
              scrollTargetY.current = yOffset.current - scrollDistance;

              currentPlatform.current = {
                x: clickedPad.x,
                y: clickedPad.y,
                isStart: false
              };
              
              setScore((s) => s + 100 + timer * 5); 
              setPadToHide(clickedPadIndex); 
              setTimeout(() => {
                nextQuestion();
              }, 700); 
            }
          }
        } else {
          f.action = "LAND";
        }
      }
    } else if (f.action === "LAND") {
      if (f.animT < 1.1) { 
        f.animT += 0.05;
        f.scale = 1 - Math.sin((f.animT - 1) * p5.PI * 5) * 0.1; 
      } else {
        f.scale = 1;
        f.action = "IDLE";
      }
    } else if (f.action === "SINK_AFTER_JUMP") { 
      if (f.y < f.targetY + 150) { 
        f.y += 5;
        f.scale = p5.lerp(1, 0, (f.y - f.targetY) / 150);
      } else {
        f.action = "IDLE_SINKED"; 
        setTimeout(() => {
            finishSinkingAndReset();
        }, 500);
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

    if (f.action === "IDLE" && gameState.current === "ANIMATING" && padToHide === null) {
      gameState.current = "PLAYING";
    }
  };

  const mousePressed = (p5) => {
    if (gameState.current === "PLAYING") {
      currentPads.forEach((pad, index) => {
        let d = p5.dist(p5.mouseX, p5.mouseY, pad.x, pad.y + yOffset.current);
        if (d < 60) {
          handleAnswer(index);
        }
      });
    }
  };
  
  // FUNGSI BARU UNTUK RENDER NYAWA
  const renderLives = () => {
    return Array(lives).fill(0).map((_, index) => (
        <span key={index} role="img" aria-label="heart" className="heart-icon">
            ❤️
        </span>
    ));
  };


  // --- RENDER UI ---
  return (
    <div className="quiz-container">
      {/* Tombol Kembali ke Menu */}
      {!gameOver && onBack && (
        <button className="back-button" onClick={onBack}>
          ← Menu Utama
        </button>
      )}
      
      {/* UI HEADER */}
      <div className="quiz-header">
        <div className="header-item">
          Lives:{" "}
          <div className="lives-container">
            {renderLives()}
          </div>
        </div>
        <div className="header-item timer-display">Time: {timer}s</div>
        <div className="header-item score-display">Score: {score}</div>
      </div>

      {/* QUESTION BOX */}
      {!gameOver && allQuestions[questionIndex] && (
        <div className="question-box">
          {allQuestions[questionIndex].q}
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameOver && (
        <div className="game-over-overlay">
          <h1>Game Over</h1>
          <h2>Final Score: {score}</h2>
          <button
            onClick={() => window.location.reload()}
            className="restart-button"
          >
            Main Lagi
          </button>
        </div>
      )}

      {/* FEEDBACK TEXT (Benar/Salah) */}
      {feedback && <div className="feedback-text">{feedback}</div>}

      {/* P5 CANVAS */}
      <Sketch setup={setup} draw={draw} mousePressed={mousePressed} preload={preload} />
    </div>
  );
};

export default FrogQuiz;