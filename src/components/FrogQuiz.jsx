// src/components/FrogQuiz.js
import React, { useState, useEffect, useRef } from "react";
import Sketch from "react-p5";

// ============================================================================
// CONSTANTS & UTILITY FUNCTIONS
// ============================================================================

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const INITIAL_FROG_Y = CANVAS_HEIGHT * 0.75;

// Game Settings
const INITIAL_LIVES = 5;
const INITIAL_TIMER = 20;
const BASE_SCORE = 100;
const TIME_BONUS_MULTIPLIER = 5;

// Animation Settings
const JUMP_SPEED = 0.05;
const JUMP_HEIGHT = 120;
const SINK_SPEED = 5;
const SINK_DEPTH = 150;
const SCALE_CHANGE_SPEED = 0.03;

// Lily Pad Settings
const PAD_SIZE = 130;
const PLATFORM_SIZE = 150;
const PAD_CLICK_RADIUS = 60;

// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Sound variables
let jumpSound;
let correctSound;
let wrongSound;
let gameOverSound;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FrogQuiz = ({ onBack, questions, currentLevel }) => {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  // Game state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState("PLAYING"); // "PLAYING" | "WIN" | "LOSE"
  const [feedback, setFeedback] = useState("");
  const [questionBoxHeight, setQuestionBoxHeight] = useState(120);
  
  // Lily pad state
  const [currentPads, setCurrentPads] = useState([]);
  const [padToHide, setPadToHide] = useState(null);

  // Refs for P5.js logic
  const gameState = useRef("PLAYING");
  const yOffset = useRef(0);
  const scrollTargetY = useRef(0);
  
  const currentPlatform = useRef({
    x: CANVAS_WIDTH / 2,
    y: INITIAL_FROG_Y,
    isStart: true,
  });

  const frog = useRef({
    x: CANVAS_WIDTH / 2,
    y: INITIAL_FROG_Y,
    scale: 1,
    targetX: CANVAS_WIDTH / 2,
    targetY: INITIAL_FROG_Y,
    animT: 0,
    action: "IDLE", // "IDLE" | "JUMP" | "JUMP_TO_CHECK" | "LAND" | "SINK" | "SINK_AFTER_JUMP" | "IDLE_SINKED"
    startX: CANVAS_WIDTH / 2,
    startY: INITIAL_FROG_Y,
  });

  // Dynamic lily pad positions based on question box height
  const getPadPositions = () => {
    const questionAreaBottom = 100 + questionBoxHeight + 50; // top + height + margin
    const availableHeight = CANVAS_HEIGHT - questionAreaBottom;
    const verticalSpacing = availableHeight * 0.3;
    
    return [
      { x: CANVAS_WIDTH * 0.25, y: questionAreaBottom + verticalSpacing },
      { x: CANVAS_WIDTH * 0.5, y: questionAreaBottom + verticalSpacing * 0.5 },
      { x: CANVAS_WIDTH * 0.75, y: questionAreaBottom + verticalSpacing },
    ];
  };

  const totalQuestions = questions.length;

  // --------------------------------------------------------------------------
  // GAME LOGIC FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Calculate question box height based on text length
   */
  const calculateQuestionBoxHeight = (questionText) => {
    const baseHeight = 120;
    const charCount = questionText.length;
    
    if (charCount <= 50) return baseHeight;
    if (charCount <= 100) return baseHeight + 40;
    if (charCount <= 150) return baseHeight + 80;
    return baseHeight + 120;
  };

  /**
   * Reset frog to current platform position
   */
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

  /**
   * Initialize lily pads for current question
   */
  const initializeQuestionPads = () => {
    const currentQuestion = questions[questionIndex];
    const newHeight = calculateQuestionBoxHeight(currentQuestion.q);
    setQuestionBoxHeight(newHeight);
    
    const yShift = currentPlatform.current.y - INITIAL_FROG_Y;
    const padPositions = getPadPositions();
    const shuffledPads = shuffleArray(padPositions);
    
    const labeledPads = shuffledPads.map((pad, idx) => ({
      ...pad,
      y: pad.y + yShift,
      label: String.fromCharCode(65 + idx), // A, B, C
    }));

    setCurrentPads(labeledPads);
    resetFrogPosition();
  };

  /**
   * Handle game over or reset after wrong answer
   */
  const finishSinkingAndReset = () => {
    if (lives <= 1) {
      // Game Over - No lives left
      setGameOver(true);
      setGameStatus("LOSE");
      gameState.current = "GAMEOVER";
      if (gameOverSound) gameOverSound.play();
    } else {
      // Continue game with reduced lives
      setLives((l) => l - 1);
      resetFrogPosition();
      initializeQuestionPads();
    }
  };

  /**
   * Move to next question or end game with win
   */
  const nextQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      // Move to next question
      setQuestionIndex((prev) => prev + 1);
      setTimer(INITIAL_TIMER);
      setFeedback("");
      setPadToHide(null);
      initializeQuestionPads();
    } else {
      // All questions completed - Win!
      setFeedback("Selamat! Anda Hebat! 🎉");
      setGameOver(true);
      setGameStatus("WIN");
      gameState.current = "GAMEOVER";
      if (gameOverSound) gameOverSound.play();
    }
  };

  /**
   * Handle answer selection
   */
  const handleAnswer = (selectedIndex) => {
    if (gameState.current !== "PLAYING" || gameOver) return;

    const currentQuestion = questions[questionIndex];
    const correctOptionIndex = currentQuestion.ans;
    const clickedOptionText = currentQuestion.options[selectedIndex];
    const clickedPad = currentPads[selectedIndex];
    const isCorrect = clickedOptionText === currentQuestion.options[correctOptionIndex];

    // Start jump animation
    gameState.current = "ANIMATING";
    frog.current.action = "JUMP_TO_CHECK";
    frog.current.targetX = clickedPad.x;
    frog.current.targetY = clickedPad.y;
    frog.current.startX = frog.current.x;
    frog.current.startY = frog.current.y;
    frog.current.animT = 0;
    
    if (jumpSound) jumpSound.play();

    // Mark pad to hide if incorrect
    if (!isCorrect) {
      setPadToHide(selectedIndex);
    }
  };

  /**
   * Handle time out
   */
  const handleTimeout = () => {
    setFeedback("Waktu Habis! 😭");
    if (wrongSound) wrongSound.play();
    
    gameState.current = "ANIMATING";
    frog.current.action = "SINK";
    
    setTimeout(() => {
      finishSinkingAndReset();
    }, 1500);
  };

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  // Initialize game on mount and when question changes
  useEffect(() => {
    initializeQuestionPads();
  }, [questionIndex]);

  // Timer countdown with visual feedback
  useEffect(() => {
    if (timer > 0 && !gameOver && gameState.current === "PLAYING") {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && gameState.current === "PLAYING") {
      handleTimeout();
    }
  }, [timer, gameOver]);

  // Update timer display class for low time warning
  useEffect(() => {
    const timerElement = document.querySelector('.timer-display');
    if (timerElement) {
      if (timer <= 5) {
        timerElement.classList.add('low-time');
      } else {
        timerElement.classList.remove('low-time');
      }
    }
  }, [timer]);

  // Update pad positions when question box height changes
  useEffect(() => {
    if (currentPads.length > 0) {
      const yShift = currentPlatform.current.y - INITIAL_FROG_Y;
      const padPositions = getPadPositions();
      const shuffledPads = shuffleArray(padPositions);
      
      const labeledPads = shuffledPads.map((pad, idx) => ({
        ...pad,
        y: pad.y + yShift,
        label: String.fromCharCode(65 + idx),
      }));

      setCurrentPads(labeledPads);
    }
  }, [questionBoxHeight]);

  // --------------------------------------------------------------------------
  // P5.JS FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Preload audio files
   */
  const preload = () => {
    try {
      jumpSound = new Audio("/sounds/jump.mp3");
      correctSound = new Audio("/sounds/correct.mp3");
      wrongSound = new Audio("/sounds/wrong.mp3");
      gameOverSound = new Audio("/sounds/gameover.mp3");
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  };

  /**
   * P5.js setup
   */
  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).parent(canvasParentRef);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.ellipseMode(p5.CENTER);
  };

  /**
   * Draw a lily pad
   */
  const drawLilyPad = (p5, x, y, size, text, idx, scale) => {
    p5.push();
    p5.translate(x, y);
    p5.scale(scale);

    const sizeRatio = size / PAD_SIZE;
    const padColor = p5.color(34, 139, 34);
    const lightColor = p5.color(107, 180, 78);

    // Shadow
    p5.noStroke();
    p5.fill(0, 0, 0, 50);
    p5.ellipse(0, 20 * sizeRatio, size * 1.05, size * 0.4);

    // Main leaf
    p5.noStroke();
    p5.fill(padColor);
    p5.arc(0, 0, size, size * 0.7, 0.1 * p5.PI, 1.9 * p5.PI, p5.PIE);

    // Light highlight
    p5.fill(lightColor);
    p5.arc(0, -10 * sizeRatio, size * 0.9, size * 0.65, 0.1 * p5.PI, 1.9 * p5.PI, p5.PIE);

    // Leaf veins
    p5.stroke(20, 100, 20);
    p5.strokeWeight(2 * sizeRatio);
    p5.noFill();
    p5.curve(-size / 2, 0, 0, 0, size / 2, 0, size / 2, 0);
    p5.curve(-size / 2, -size / 4, 0, 0, size / 3, -size / 5, size / 2, -size / 4);
    p5.curve(-size / 2, size / 4, 0, 0, size / 3, size / 5, size / 2, size / 4);

    // Label and text
    if (idx !== -1) {
      // Answer pad with label (A, B, C)
      p5.noStroke();
      p5.textSize(16 * sizeRatio);
      p5.textStyle(p5.BOLD);

      // Label circle
      p5.fill(255, 165, 0);
      p5.ellipse(0, -size / 2 + 10 * sizeRatio, 35 * sizeRatio, 25 * sizeRatio);
      p5.fill(255);
      p5.text(["A", "B", "C"][idx], 0, -size / 2 + 10 * sizeRatio);

      // Answer text
      p5.fill(255);
      p5.textSize(18 * sizeRatio);
      p5.text(text, 0, 15 * sizeRatio);
    } else {
      // Platform pad (Start or Q#)
      p5.noStroke();
      p5.fill(255);
      p5.textSize(20 * sizeRatio);
      p5.textStyle(p5.BOLD);
      p5.text(text, 0, 0);
    }

    p5.pop();
  };

  /**
   * Draw the frog character
   */
  const drawFrog = (p5, x, y, scale) => {
    p5.push();
    p5.translate(x, y);
    p5.scale(scale);

    // Shadow
    p5.noStroke();
    p5.fill(0, 0, 0, 80);
    p5.ellipse(0, 20, 50, 10);

    // Back legs
    p5.fill(50, 205, 50);
    p5.ellipse(-25, 10, 20, 40);
    p5.ellipse(25, 10, 20, 40);

    // Body
    p5.fill(34, 139, 34);
    p5.ellipse(0, 0, 60, 50);

    // Belly
    p5.fill(144, 238, 144);
    p5.ellipse(0, 5, 30, 25);

    // Eyes
    p5.fill(34, 139, 34);
    p5.circle(-15, -20, 20);
    p5.circle(15, -20, 20);
    p5.fill(255);
    p5.circle(-15, -20, 15);
    p5.circle(15, -20, 15);
    p5.fill(0);
    p5.circle(-15, -20, 5);
    p5.circle(15, -20, 5);

    // Smile
    p5.noFill();
    p5.stroke(0);
    p5.strokeWeight(2);
    p5.arc(0, 0, 20, 20, 0.2 * p5.PI, 0.8 * p5.PI);

    // Purple backpack
    p5.noStroke();
    p5.fill(128, 0, 128);
    p5.rect(-10, 10, 20, 15, 5);

    p5.pop();
  };

  /**
   * Draw water background with gradient
   */
  const drawWaterBackground = (p5) => {
    p5.noStroke();
    const startYWorld = -yOffset.current;

    for (let yScreen = 0; yScreen < CANVAS_HEIGHT; yScreen++) {
      const yWorld = yScreen - yOffset.current;
      let inter = p5.map(
        yWorld,
        startYWorld - CANVAS_HEIGHT,
        startYWorld + CANVAS_HEIGHT,
        0,
        1
      );
      inter = p5.constrain(inter, 0, 1);

      const c = p5.lerpColor(
        p5.color(60, 200, 255),
        p5.color(20, 100, 150),
        inter
      );
      p5.stroke(c);
      p5.line(0, yScreen, CANVAS_WIDTH, yScreen);
    }
  };

  /**
   * Draw water surface effects (ripples and waves)
   */
  const drawWaterEffects = (p5) => {
    const noiseScale = 0.02;
    const time = p5.frameCount * 0.01;
    const yStart = currentPlatform.current.y - CANVAS_HEIGHT * 0.5;
    const yEnd = currentPlatform.current.y + CANVAS_HEIGHT * 0.5;

    // Perlin noise waves
    p5.noStroke();
    p5.fill(255, 255, 255, 30);

    for (let yWorld = yStart; yWorld < yEnd; yWorld += 15) {
      p5.beginShape();
      p5.vertex(0, yWorld);
      
      for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
        const n = p5.noise(x * noiseScale, yWorld * noiseScale * 0.5, time);
        const rippleHeight = n * 20 - 10;
        p5.curveVertex(x, yWorld + rippleHeight);
      }
      
      p5.vertex(CANVAS_WIDTH, yWorld);
      p5.endShape();
    }

    // Circular ripples
    p5.noFill();
    p5.stroke(255, 255, 255, 80);
    p5.strokeWeight(1.5);

    for (let i = 0; i < 7; i++) {
      const yWorld =
        currentPlatform.current.y -
        300 +
        i * 150 +
        Math.sin(p5.frameCount * 0.02 + i) * 30;
      const xPos =
        CANVAS_WIDTH * 0.5 +
        Math.cos(p5.frameCount * 0.01 + i * 0.5) * (CANVAS_WIDTH * 0.3);
      const size = 200;
      const heightVariation = 80 + Math.sin(p5.frameCount * 0.05 + i) * 20;
      
      p5.ellipse(xPos, yWorld, size, heightVariation);
    }
  };

  /**
   * Draw all lily pads (answer options)
   */
  const drawAnswerPads = (p5) => {
    currentPads.forEach((pad, idx) => {
      const optionText = questions[questionIndex]?.options[idx] || "";
      const floatY =
        gameState.current === "PLAYING"
          ? Math.sin(p5.frameCount * 0.03 + idx) * 5
          : 0;

      if (padToHide === idx && frog.current.action === "JUMP_TO_CHECK") {
        // Keep pad visible during jump
        drawLilyPad(p5, pad.x, pad.y + floatY, PAD_SIZE, optionText, idx, 1);
      } else if (padToHide === idx) {
        // Animate sinking pad
        let shrinkScale = 1;
        let sinkY = pad.y;

        if (frog.current.action === "SINK_AFTER_JUMP") {
          const progress = p5.constrain((frog.current.y - pad.y) / SINK_DEPTH, 0, 1);
          shrinkScale = p5.lerp(1, 0, progress);
          sinkY = p5.lerp(pad.y, pad.y + 200, progress);
        } else if (
          gameState.current === "ANIMATING" &&
          frog.current.action !== "JUMP_TO_CHECK"
        ) {
          shrinkScale = p5.lerp(1, 0, frog.current.animT * 2);
          sinkY = p5.lerp(pad.y, pad.y + 100, frog.current.animT * 2);
        }

        if (shrinkScale > 0.05) {
          drawLilyPad(p5, pad.x, sinkY, PAD_SIZE, optionText, idx, shrinkScale);
        }
      } else {
        // Normal pad
        drawLilyPad(p5, pad.x, pad.y + floatY, PAD_SIZE, optionText, idx, 1);
      }
    });
  };

  /**
   * Update frog animation
   */
  const updateFrog = (p5) => {
    const f = frog.current;

    switch (f.action) {
      case "JUMP":
      case "JUMP_TO_CHECK":
        if (f.animT < 1) {
          // Animate jump
          f.animT += JUMP_SPEED;
          f.x = p5.lerp(f.startX, f.targetX, f.animT);
          
          const baseY = p5.lerp(f.startY, f.targetY, f.animT);
          const jumpHeight = Math.sin(f.animT * p5.PI) * JUMP_HEIGHT;
          f.y = baseY - jumpHeight;
          f.scale = 1 + Math.sin(f.animT * p5.PI) * 0.2;
        } else {
          // Jump complete - land on pad
          f.x = f.targetX;
          f.y = f.targetY;
          f.scale = 1;
          f.animT = 1;

          if (f.action === "JUMP_TO_CHECK") {
            handleJumpComplete(p5);
          } else {
            f.action = "LAND";
          }
        }
        break;

      case "LAND":
        if (f.animT < 1.1) {
          f.animT += 0.05;
          f.scale = 1 - Math.sin((f.animT - 1) * p5.PI * 5) * 0.1;
        } else {
          f.scale = 1;
          f.action = "IDLE";
        }
        break;

      case "SINK_AFTER_JUMP":
        if (f.y < f.targetY + SINK_DEPTH) {
          f.y += SINK_SPEED;
          f.scale = p5.lerp(1, 0, (f.y - f.targetY) / SINK_DEPTH);
        } else {
          f.action = "IDLE_SINKED";
          setTimeout(() => {
            finishSinkingAndReset();
          }, 500);
        }
        break;

      case "SINK":
        if (f.scale > 0) {
          f.scale -= SCALE_CHANGE_SPEED;
          f.y += 3;
          f.y = Math.min(f.y, currentPlatform.current.y + 200);
        } else {
          f.scale = 0;
        }
        break;
    }

    // Reset to playing state if animation complete
    if (f.action === "IDLE" && gameState.current === "ANIMATING" && padToHide === null) {
      gameState.current = "PLAYING";
    }
  };

  /**
   * Handle frog landing after jump (check answer)
   */
  const handleJumpComplete = (p5) => {
    const currentQuestion = questions[questionIndex];
    const clickedPadIndex = currentPads.findIndex(
      (pad) => pad.x === frog.current.targetX && pad.y === frog.current.targetY
    );

    if (clickedPadIndex !== -1) {
      const clickedOptionText = currentQuestion.options[clickedPadIndex];
      const isCorrect =
        clickedOptionText === currentQuestion.options[currentQuestion.ans];

      if (!isCorrect) {
        // Wrong answer
        frog.current.action = "SINK_AFTER_JUMP";
        setFeedback("Salah!");
        if (wrongSound) wrongSound.play();
      } else {
        // Correct answer
        frog.current.action = "LAND";
        setFeedback("Benar!");
        if (correctSound) correctSound.play();

        // Update platform and scroll
        const clickedPad = currentPads[clickedPadIndex];
        const scrollDistance = clickedPad.y - currentPlatform.current.y;
        scrollTargetY.current = yOffset.current - scrollDistance;

        currentPlatform.current = {
          x: clickedPad.x,
          y: clickedPad.y,
          isStart: false,
        };

        // Update score with time bonus
        setScore((s) => s + BASE_SCORE + timer * TIME_BONUS_MULTIPLIER);
        setPadToHide(clickedPadIndex);

        setTimeout(() => {
          nextQuestion();
        }, 700);
      }
    }
  };

  /**
   * Main draw loop
   */
  const draw = (p5) => {
    // Update scroll offset
    yOffset.current = p5.lerp(yOffset.current, scrollTargetY.current, 0.1);

    // Draw water background
    drawWaterBackground(p5);

    // Apply world transform
    p5.push();
    p5.translate(0, yOffset.current);

    // Draw water effects
    drawWaterEffects(p5);

    // Draw answer pads
    drawAnswerPads(p5);

    // Draw platform (start or last answered question)
    const platformLabel = currentPlatform.current.isStart
      ? "Mulai"
      : `Q${questionIndex}`;
    const platformFloatY =
      gameState.current === "PLAYING"
        ? Math.sin(p5.frameCount * 0.03 + 5) * 5
        : 0;
    drawLilyPad(
      p5,
      currentPlatform.current.x,
      currentPlatform.current.y + platformFloatY,
      PLATFORM_SIZE,
      platformLabel,
      -1,
      1
    );

    // Update and draw frog
    updateFrog(p5);
    drawFrog(p5, frog.current.x, frog.current.y, frog.current.scale);

    p5.pop();
  };

  /**
   * Handle mouse click
   */
  const mousePressed = (p5) => {
    if (gameState.current === "PLAYING") {
      currentPads.forEach((pad, index) => {
        const distance = p5.dist(
          p5.mouseX,
          p5.mouseY,
          pad.x,
          pad.y + yOffset.current
        );
        if (distance < PAD_CLICK_RADIUS) {
          handleAnswer(index);
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------------------------

  return (
    <div className="quiz-container">
      {/* Back Button */}
      {!gameOver && onBack && (
        <button className="back-button" onClick={onBack}>
          ← Menu Utama
        </button>
      )}

      {/* Game Header */}
      <div className="quiz-header">
        <div className="header-item level-display">Level: {currentLevel}</div>
        <div className="header-item">
          Lives:{" "}
          <span role="img" aria-label="heart" className="lives-display">
            {"❤️".repeat(lives)}
          </span>
        </div>
        <div className={`header-item timer-display ${timer <= 5 ? 'low-time' : ''}`}>
          Time: {timer}s
        </div>
        <div className="header-item score-display">Score: {score}</div>
      </div>

      {/* Question Display */}
      {!gameOver && questions[questionIndex] && (
        <div 
          className="question-box"
          style={{ height: `${questionBoxHeight}px` }}
        >
          <div className="question-number">
            Pertanyaan {questionIndex + 1}/{totalQuestions}
          </div>
          <div className="question-text">
            {questions[questionIndex].q}
          </div>
        </div>
      )}

      {/* Game Over / Win Overlay */}
      {gameOver && (
        <div className={`game-over-overlay ${gameStatus}`}>
          <div className="game-over-content">
            <h1>{gameStatus === "WIN" ? "ANDA MENANG!" : "GAME OVER"}</h1>
            <h2>Skor Akhir: {score}</h2>
            <div className="final-stats">
              <p>Level: {currentLevel}</p>
              <p>Pertanyaan Selesai: {questionIndex + 1}/{totalQuestions}</p>
            </div>
            <button onClick={onBack} className="restart-button">
              Menu Level
            </button>
          </div>
        </div>
      )}

      {/* Feedback Message */}
      {feedback && <div className="feedback-text">{feedback}</div>}

      {/* P5.js Canvas */}
      <Sketch setup={setup} draw={draw} mousePressed={mousePressed} preload={preload} />
    </div>
  );
};

export default FrogQuiz;