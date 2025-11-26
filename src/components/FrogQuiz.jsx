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
const JUMP_SPEED = 0.035; 
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
let winSound;
let loseSound;

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
    const [gameStatus, setGameStatus] = useState("PLAYING");
    const [feedback, setFeedback] = useState("");
    const [questionBoxHeight, setQuestionBoxHeight] = useState(120);

    // Lily pad state
    const [currentPads, setCurrentPads] = useState([]);
    const [padToHide, setPadToHide] = useState(null);

    // Refs for P5.js logic
    const gameState = useRef("PLAYING");
    const yOffset = useRef(0);
    const scrollTargetY = useRef(0);
    const timerRef = useRef(null);
    const animationRef = useRef(null);

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
        action: "IDLE",
        startX: CANVAS_WIDTH / 2,
        startY: INITIAL_FROG_Y,
    });

    // Dynamic lily pad positions based on question box height
    const getPadPositions = () => {
        const questionAreaBottom = 100 + questionBoxHeight + 50;
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
            label: String.fromCharCode(65 + idx),
        }));

        setCurrentPads(labeledPads);
        resetFrogPosition();
    };

    /**
     * Handle game over or reset after wrong answer
     */
    const finishSinkingAndReset = () => {
        const newLives = lives - 1;
        setLives(newLives);
        
        if (newLives <= 0) {
            setGameOver(true);
            setGameStatus("LOSE");
            gameState.current = "GAMEOVER";
            if (loseSound) loseSound.play();
        } else {
            resetFrogPosition();
            setTimer(INITIAL_TIMER);
            setPadToHide(null);
        }
    };

    /**
     * Move to next question or end game with win
     */
    const nextQuestion = () => {
        if (questionIndex < totalQuestions - 1) {
            setQuestionIndex((prev) => prev + 1);
            setTimer(INITIAL_TIMER);
            setFeedback("");
            setPadToHide(null);
            initializeQuestionPads();
        } else {
            setFeedback("Selamat! Anda Hebat! 🎉");
            setGameOver(true);
            setGameStatus("WIN");
            gameState.current = "GAMEOVER";
            if (winSound) winSound.play();
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

    /**
     * Handle time out - FIXED VERSION
     */
    const handleTimeout = () => {
        // Clear timer immediately
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setFeedback("Waktu Habis!");
        if (wrongSound) wrongSound.play();

        gameState.current = "ANIMATING";
        frog.current.action = "SINK";

        // Use setTimeout with proper cleanup
        const timeoutId = setTimeout(() => {
            finishSinkingAndReset();
        }, 1500);

        return () => clearTimeout(timeoutId);
    };

    // --------------------------------------------------------------------------
    // EFFECTS
    // --------------------------------------------------------------------------

    // Initialize game on mount and when question changes
    useEffect(() => {
        initializeQuestionPads();
    }, [questionIndex]);

    // Timer countdown with proper cleanup - FIXED VERSION
    useEffect(() => {
        if (timer > 0 && !gameOver && gameState.current === "PLAYING") {
            timerRef.current = setInterval(() => {
                setTimer((t) => {
                    const newTime = t - 1;
                    if (newTime <= 0) {
                        handleTimeout();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
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
            const labeledPads = currentPads.map((pad, idx) => ({
                ...pad,
                y: padPositions[idx % padPositions.length].y + yShift, 
                label: String.fromCharCode(65 + idx),
            }));
            setCurrentPads(labeledPads);
        }
    }, [questionBoxHeight]);

    // Cleanup on unmount - FIXED VERSION
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, []);

    // --------------------------------------------------------------------------
    // P5.JS FUNCTIONS (FIXED VERSION)
    // --------------------------------------------------------------------------

    /**
     * Preload audio files
     */
    const preload = () => {
        try {
            // Use try-catch to prevent audio loading errors
            jumpSound = new Audio("/sounds/jump.mp3"); 
            correctSound = new Audio("/sounds/correct.mp3");
            wrongSound = new Audio("/sounds/wrong.mp3");
            winSound = new Audio("/sounds/win_fanfare.mp3");
            loseSound = new Audio("/sounds/lose_buzz.mp3");
            
            // Preload audio files
            [jumpSound, correctSound, wrongSound, winSound, loseSound].forEach(sound => {
                if (sound) {
                    sound.load();
                    sound.volume = 0.7; // Set reasonable volume
                }
            });
        } catch (error) {
            console.warn("Audio loading failed:", error);
        }
    };

    /**
     * P5.js setup
     */
    const setup = (p5, canvasParentRef) => {
        const canvas = p5.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).parent(canvasParentRef);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.ellipseMode(p5.CENTER);
        
        // Prevent context menu on right click
        canvas.elt.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    /**
     * Draw a lily pad (FIXED radius calculation)
     */
    const drawLilyPad = (p5, x, y, size, text, idx, scale) => {
        p5.push();
        p5.translate(x, y);
        
        // FIX: Ensure scale is never zero or negative
        const safeScale = Math.max(0.01, scale);
        p5.scale(safeScale);

        const sizeRatio = size / PAD_SIZE;
        
        // FIX: Ensure size values are positive
        const safeSize = Math.max(1, size);
        const safeSizeRatio = Math.max(0.01, sizeRatio);

        const padDark = p5.color(20, 100, 20);
        const padMid = p5.color(34, 139, 34);
        const padLight = p5.color(107, 180, 78);

        // --- 1. Realistic Shadow ---
        p5.noStroke();
        for(let i = 3; i > 0; i--) {
            p5.fill(0, 0, 0, 10 * i * safeScale);
            // FIX: Ensure ellipse dimensions are positive
            p5.ellipse(0, 20 * safeSizeRatio, safeSize * 1.05, Math.max(1, safeSize * 0.4));
        }
        
        // --- 2. Main Leaf Surface ---
        p5.noStroke();
        p5.fill(padMid);
        p5.beginShape();
        const angleStart = 0.1 * p5.PI;
        const angleEnd = 1.9 * p5.PI;
        for (let a = angleStart; a <= angleEnd; a += 0.05) {
            // FIX: Ensure radius is always positive
            const baseRadius = safeSize / 2;
            const variation = p5.map(p5.sin(a * 4), -1, 1, 0.95, 1.05);
            const r = Math.max(1, baseRadius * variation);
            p5.vertex(r * p5.cos(a), r * p5.sin(a) * 0.7);
        }
        p5.endShape(p5.CLOSE);
        
        // --- 3. Dark Edge/Inner Shadow ---
        p5.fill(padDark);
        // FIX: Ensure arc dimensions are positive
        p5.arc(0, 0, Math.max(1, safeSize * 0.9), Math.max(1, safeSize * 0.63), 0.1 * p5.PI, 1.9 * p5.PI, p5.PIE);
        
        // --- 4. Light Highlight ---
        p5.fill(padLight, 180);
        p5.arc(0, -15 * safeSizeRatio, Math.max(1, safeSize * 0.8), Math.max(1, safeSize * 0.55), 0.2 * p5.PI, 1.8 * p5.PI, p5.PIE);

        // --- 5. Leaf Veins ---
        p5.stroke(padDark);
        // FIX: Ensure stroke weight is positive
        p5.strokeWeight(Math.max(1, 3 * safeSizeRatio));
        p5.noFill();
        p5.curve(-safeSize / 2, 0, 0, 0, safeSize / 2, 0, safeSize / 2, 0);
        p5.curve(-safeSize / 2, -safeSize / 4, 0, 0, safeSize / 3, -safeSize / 5, safeSize / 2, -safeSize / 4);
        p5.curve(-safeSize / 2, safeSize / 4, 0, 0, safeSize / 3, safeSize / 5, safeSize / 2, safeSize / 4);

        // --- 6. Label and text ---
        if (idx !== -1) {
            p5.noStroke();
            // FIX: Ensure text size is positive
            p5.textSize(Math.max(1, 18 * safeSizeRatio));
            p5.textStyle(p5.BOLD);

            // Label circle
            p5.fill(255, 180, 0);
            // FIX: Ensure ellipse dimensions are positive
            p5.ellipse(0, -safeSize / 2 + 10 * safeSizeRatio, Math.max(1, 40 * safeSizeRatio), Math.max(1, 30 * safeSizeRatio));
            
            // Shine on label
            p5.fill(255, 220, 100);
            p5.ellipse(0, -safeSize / 2 + 8 * safeSizeRatio, Math.max(1, 30 * safeSizeRatio), Math.max(1, 15 * safeSizeRatio));

            p5.fill(50);
            p5.text(["A", "B", "C"][idx], 0, -safeSize / 2 + 10 * safeSizeRatio);

            // Answer text
            p5.fill(255);
            p5.textSize(Math.max(1, 18 * safeSizeRatio));
            p5.textStyle(p5.NORMAL);
            p5.text(text, 0, 15 * safeSizeRatio);
        } else {
            p5.noStroke();
            p5.fill(255);
            p5.textSize(Math.max(1, 22 * safeSizeRatio));
            p5.textStyle(p5.BOLD);
            p5.text(text, 0, -10 * safeSizeRatio);
        }

        p5.pop();
    };

    /**
     * Draw the frog character (FIXED radius calculation)
     */
    const drawFrog = (p5, x, y, scale) => {
        try {
            p5.push();
            p5.translate(x, y);
            
            // FIX: Ensure scale is never zero or negative
            const safeScale = Math.max(0.01, scale);
            p5.scale(safeScale);

            const frogBodyDark = p5.color(30, 90, 30);
            const frogBodyMid = p5.color(40, 120, 40);
            const frogBodyLight = p5.color(80, 160, 80);
            const frogBelly = p5.color(180, 220, 180);
            const eyeIrisColor = p5.color(180, 120, 0);
            const backpackColor = p5.color(100, 50, 150);

            // --- 1. Realistic Shadow ---
            p5.noStroke();
            p5.fill(0, 0, 0, 80);
            // FIX: Ensure ellipse dimensions are positive
            p5.ellipse(0, 35 * safeScale, Math.max(1, 70 * safeScale), Math.max(1, 20 * safeScale));

            // --- 2. Back Legs ---
            p5.fill(frogBodyMid);
            p5.stroke(frogBodyDark);
            // FIX: Ensure stroke weight is positive
            p5.strokeWeight(Math.max(1, 2 * safeScale));

            // Left back leg
            p5.beginShape();
            p5.curveVertex(-30 * safeScale, 20 * safeScale);
            p5.curveVertex(-35 * safeScale, 10 * safeScale);
            p5.curveVertex(-45 * safeScale, 30 * safeScale);
            p5.curveVertex(-30 * safeScale, 45 * safeScale);
            p5.curveVertex(-15 * safeScale, 35 * safeScale);
            p5.endShape(p5.CLOSE);

            // Right back leg
            p5.beginShape();
            p5.curveVertex(30 * safeScale, 20 * safeScale);
            p5.curveVertex(35 * safeScale, 10 * safeScale);
            p5.curveVertex(45 * safeScale, 30 * safeScale);
            p5.curveVertex(30 * safeScale, 45 * safeScale);
            p5.curveVertex(15 * safeScale, 35 * safeScale);
            p5.endShape(p5.CLOSE);

            // --- 3. Body ---
            p5.noStroke();
            
            // Darker base for depth
            p5.fill(frogBodyDark);
            p5.ellipse(0, 5 * safeScale, Math.max(1, 80 * safeScale), Math.max(1, 70 * safeScale));

            // Mid-tone for main body
            p5.fill(frogBodyMid);
            p5.ellipse(0, 0, Math.max(1, 75 * safeScale), Math.max(1, 65 * safeScale));
            
            // Highlight for roundness
            p5.fill(frogBodyLight, 200);
            p5.ellipse(0, -15 * safeScale, Math.max(1, 60 * safeScale), Math.max(1, 50 * safeScale));

            // --- 4. Belly ---
            p5.fill(frogBelly);
            p5.ellipse(0, 10 * safeScale, Math.max(1, 45 * safeScale), Math.max(1, 35 * safeScale));
            
            // --- 5. Front Arms ---
            p5.fill(frogBodyMid);
            p5.ellipse(-30 * safeScale, -5 * safeScale, Math.max(1, 15 * safeScale), Math.max(1, 30 * safeScale));
            p5.ellipse(30 * safeScale, -5 * safeScale, Math.max(1, 15 * safeScale), Math.max(1, 30 * safeScale));

            // --- 6. Purple Backpack ---
            p5.noStroke();
            p5.fill(p5.red(backpackColor) * 0.7, p5.green(backpackColor) * 0.7, p5.blue(backpackColor) * 0.7);
            p5.rect(-12 * safeScale, 15 * safeScale, Math.max(1, 24 * safeScale), Math.max(1, 20 * safeScale), Math.max(1, 8 * safeScale));
            p5.fill(backpackColor);
            p5.rect(-10 * safeScale, 12 * safeScale, Math.max(1, 20 * safeScale), Math.max(1, 15 * safeScale), Math.max(1, 6 * safeScale));
            p5.fill(p5.red(backpackColor) * 1.2, p5.green(backpackColor) * 1.2, p5.blue(backpackColor) * 1.2, 100);
            p5.rect(-8 * safeScale, 10 * safeScale, Math.max(1, 16 * safeScale), Math.max(1, 8 * safeScale), Math.max(1, 4 * safeScale));

            // --- 7. Eyes ---
            const eyeY = -30 * safeScale;
            const eyeXOffset = 20 * safeScale;
            // FIX: Ensure eye size is positive
            const eyeSize = Math.max(1, 28 * safeScale);

            // Eyestalk/Base
            p5.fill(frogBodyDark);
            p5.ellipse(-eyeXOffset, eyeY - 5 * safeScale, Math.max(1, eyeSize * 1.1), Math.max(1, eyeSize * 1.2));
            p5.ellipse(eyeXOffset, eyeY - 5 * safeScale, Math.max(1, eyeSize * 1.1), Math.max(1, eyeSize * 1.2));

            // Eye Whites
            p5.fill(240, 240, 240);
            p5.ellipse(-eyeXOffset, eyeY - 5 * safeScale, Math.max(1, eyeSize * 0.9), Math.max(1, eyeSize));
            p5.ellipse(eyeXOffset, eyeY - 5 * safeScale, Math.max(1, eyeSize * 0.9), Math.max(1, eyeSize));

            // Iris
            p5.fill(eyeIrisColor);
            p5.ellipse(-eyeXOffset, eyeY - 5 * safeScale, Math.max(1, eyeSize * 0.5), Math.max(1, eyeSize * 0.6));
            p5.ellipse(eyeXOffset, eyeY - 5 * safeScale, Math.max(1, eyeSize * 0.5), Math.max(1, eyeSize * 0.6));

            // Pupil
            p5.fill(0);
            p5.rect(-eyeXOffset - (eyeSize * 0.05), eyeY - 5 * safeScale - (eyeSize * 0.25), Math.max(1, eyeSize * 0.1), Math.max(1, eyeSize * 0.5), Math.max(1, 2 * safeScale));
            p5.rect(eyeXOffset - (eyeSize * 0.05), eyeY - 5 * safeScale - (eyeSize * 0.25), Math.max(1, eyeSize * 0.1), Math.max(1, eyeSize * 0.5), Math.max(1, 2 * safeScale));
            
            // Shine dot/Highlight
            p5.fill(255, 255, 255, 180);
            p5.ellipse(-eyeXOffset - eyeSize * 0.15, eyeY - 5 * safeScale - eyeSize * 0.2, Math.max(1, eyeSize * 0.2), Math.max(1, eyeSize * 0.15));
            p5.ellipse(eyeXOffset - eyeSize * 0.15, eyeY - 5 * safeScale - eyeSize * 0.2, Math.max(1, eyeSize * 0.2), Math.max(1, eyeSize * 0.15));

            // --- 8. Mouth ---
            p5.noFill();
            p5.stroke(0);
            p5.strokeWeight(Math.max(1, 3 * safeScale));
            p5.curve(
                -50 * safeScale, 0 * safeScale,
                -20 * safeScale, 15 * safeScale,
                20 * safeScale, 15 * safeScale,
                50 * safeScale, 0 * safeScale
            );

            p5.pop();
        } catch (error) {
            console.warn('Error drawing frog:', error);
            // Prevent crash if drawing fails
        }
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
     * Draw water surface effects
     */
    const drawWaterEffects = (p5) => {
        const noiseScale = 0.015;
        const time = p5.frameCount * 0.015;
        const yStart = currentPlatform.current.y - CANVAS_HEIGHT * 0.5;
        const yEnd = currentPlatform.current.y + CANVAS_HEIGHT * 0.5;

        // Perlin noise waves
        p5.stroke(255, 255, 255, 50);
        p5.strokeWeight(1);
        p5.noFill();

        for (let yWorld = yStart; yWorld < yEnd; yWorld += 15) {
            p5.beginShape();
            
            for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
                const n = p5.noise(x * noiseScale, yWorld * noiseScale * 0.5, time);
                const rippleHeight = n * 30 - 15;
                p5.curveVertex(x, yWorld + rippleHeight);
            }
            
            p5.endShape();
        }

        // Circular ripples
        p5.noFill();
        p5.stroke(255, 255, 255, 100);
        p5.strokeWeight(1.5);

        for (let i = 0; i < 7; i++) {
            const yWorld =
                currentPlatform.current.y -
                500 + 
                i * 200 +
                Math.sin(p5.frameCount * 0.01 + i) * 50;
            const xPos =
                CANVAS_WIDTH * 0.5 +
                Math.cos(p5.frameCount * 0.008 + i * 0.7) * (CANVAS_WIDTH * 0.4);
            const size = 300;
            const heightVariation = 100 + Math.sin(p5.frameCount * 0.02 + i) * 30;
            
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
                drawLilyPad(p5, pad.x, pad.y + floatY, PAD_SIZE, optionText, idx, 1);
            } else if (padToHide === idx) {
                let shrinkScale = 1;
                let sinkY = pad.y;

                if (frog.current.action === "SINK_AFTER_JUMP") {
                    const progress = p5.constrain((frog.current.y - pad.y) / SINK_DEPTH, 0, 1);
                    shrinkScale = p5.lerp(1, 0, progress);
                    sinkY = p5.lerp(pad.y, pad.y + 200, progress);
                } else if (frog.current.action === "SINK") {
                    shrinkScale = p5.lerp(1, 0, frog.current.animT * 2);
                    sinkY = p5.lerp(pad.y, pad.y + 100, frog.current.animT * 2);
                }

                if (shrinkScale > 0.05) {
                    drawLilyPad(p5, pad.x, sinkY + floatY, PAD_SIZE, optionText, idx, shrinkScale);
                }
            } else {
                drawLilyPad(p5, pad.x, pad.y + floatY, PAD_SIZE, optionText, idx, 1);
            }
        });
    };

    /**
     * Update frog animation (FIXED animation logic)
     */
    const updateFrog = (p5) => {
        const f = frog.current;

        switch (f.action) {
            case "JUMP":
            case "JUMP_TO_CHECK":
                if (f.animT < 1) {
                    f.animT += JUMP_SPEED;
                    f.animT = p5.constrain(f.animT, 0, 1);

                    const easeT = p5.pow(f.animT, 2);

                    f.x = p5.lerp(f.startX, f.targetX, easeT);

                    const baseY = p5.lerp(f.startY, f.targetY, f.animT);
                    const jumpHeight = Math.sin(f.animT * p5.PI) * JUMP_HEIGHT;
                    f.y = baseY - jumpHeight;

                    f.scale = 1 + Math.sin(f.animT * p5.PI) * 0.2;
                } else {
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
                    finishSinkingAndReset();
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
                frog.current.action = "SINK_AFTER_JUMP";
                if (wrongSound) wrongSound.play();
            } else {
                frog.current.action = "LAND";
                setFeedback("Benar!");
                if (correctSound) correctSound.play();

                const clickedPad = currentPads[clickedPadIndex];
                const scrollDistance = clickedPad.y - currentPlatform.current.y;
                scrollTargetY.current = yOffset.current - scrollDistance;

                currentPlatform.current = {
                    x: clickedPad.x,
                    y: clickedPad.y,
                    isStart: false,
                };

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
        try {
            // Update scroll offset
            yOffset.current = p5.lerp(yOffset.current, scrollTargetY.current, 0.15);

            // Draw water background
            drawWaterBackground(p5);

            // Apply world transform
            p5.push();
            p5.translate(0, yOffset.current);

            // Draw water effects
            drawWaterEffects(p5);

            // Draw answer pads
            drawAnswerPads(p5);

            // Draw platform
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
        } catch (error) {
            console.warn('Error in draw loop:', error);
        }
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