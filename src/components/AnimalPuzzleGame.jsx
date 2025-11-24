import React, { useState, useEffect } from "react";

// URL Gambar Hewan (Ganti dengan URL/path asli di folder public)
const animalImages = [
  "https://via.placeholder.com/300x300/FF5733/ffffff?text=GAJAH",
  "https://via.placeholder.com/300x300/33FF57/ffffff?text=SINGA",
  "https://via.placeholder.com/300x300/3357FF/ffffff?text=JERAPAH",
  // Tambahkan gambar Anda di sini!
];

const GRID_SIZE = 3; // 3x3 grid

// Fungsi untuk inisialisasi potongan puzzle
const createPuzzlePieces = (rows, cols) => {
  const pieces = [];
  let idCounter = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pieces.push({
        id: idCounter++,
        // Target posisi gambar latar belakang (0% sampai 100%)
        bgX: (c / (cols - 1)) * 100, // Misal: 0, 50, 100
        bgY: (r / (rows - 1)) * 100,
      });
    }
  }
  
  // Acak posisi saat ini untuk memulai game, pastikan puzzle bisa diselesaikan
  // Untuk menyederhanakan, kita acak saja.
  return pieces.sort(() => Math.random() - 0.5); 
};

const AnimalPuzzleGame = ({ onBack }) => {
  const [pieces, setPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null); // Index array dari potongan yang dipilih
  const [isSolved, setIsSolved] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    // 1. Pilih gambar acak saat inisialisasi
    const randomImage = animalImages[Math.floor(Math.random() * animalImages.length)];
    setCurrentImage(randomImage);
    // 2. Buat dan acak potongan
    setPieces(createPuzzlePieces(GRID_SIZE, GRID_SIZE));
    setMoves(0);
    setIsSolved(false);
  }, []);

  const checkSolved = (currentPieces) => {
    // Periksa apakah ID potongan sesuai dengan indeks array-nya (urutan 0, 1, 2, ...)
    const solved = currentPieces.every((piece, index) => piece.id === index);
    if (solved) {
        setIsSolved(true);
    }
  };

  const handlePieceClick = (index) => {
    if (isSolved) return;

    if (selectedPiece === null) {
      // Potongan pertama dipilih
      setSelectedPiece(index);
    } else {
      // Potongan kedua dipilih, lakukan penukaran
      if (selectedPiece === index) {
        setSelectedPiece(null);
        return;
      }
      
      const newPieces = [...pieces];
      // Tukar objek potongan di array
      [newPieces[selectedPiece], newPieces[index]] = [newPieces[index], newPieces[selectedPiece]];
      
      setPieces(newPieces);
      setSelectedPiece(null);
      setMoves(m => m + 1);
      checkSolved(newPieces);
    }
  };

  const restartGame = () => {
    const randomImage = animalImages[Math.floor(Math.random() * animalImages.length)];
    setCurrentImage(randomImage);
    setPieces(createPuzzlePieces(GRID_SIZE, GRID_SIZE));
    setMoves(0);
    setIsSolved(false);
    setSelectedPiece(null);
  }

  // Tampilan visual setiap potongan puzzle
  const renderPieces = () => {
    const pieceSize = 100 / GRID_SIZE; // %
    const backgroundSize = GRID_SIZE * 100; // 300%
    
    return pieces.map((piece, index) => (
      <div 
        key={piece.id}
        onClick={() => handlePieceClick(index)}
        style={{
          ...styles.puzzlePiece,
          width: `${pieceSize}%`,
          height: `${pieceSize}%`,
          backgroundImage: `url(${currentImage})`,
          // Mengatur posisi latar belakang untuk menampilkan fragmen yang benar
          backgroundPosition: `-${piece.bgX}% -${piece.bgY}%`, 
          backgroundSize: `${backgroundSize}% ${backgroundSize}%`, 
          // Highlight potongan yang sedang dipilih
          border: selectedPiece === index ? "4px solid yellow" : "1px solid #333",
          opacity: isSolved ? 1 : 0.9,
        }}
      >
        {/* Opsional: Tampilkan ID untuk debug */}
        {/* <span style={{color: 'red', fontSize: '12px'}}>{piece.id}</span> */} 
      </div>
    ));
  };

  // --- STYLING ---
  const styles = {
    puzzleContainer: {
      padding: "20px",
      textAlign: "center",
      width: "100vw",
      height: "100vh",
      backgroundColor: "#add8e6",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial, sans-serif",
    },
    header: {
        width: '300px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
    },
    puzzleGrid: {
      width: "300px",
      height: "300px",
      display: "flex",
      flexWrap: "wrap",
      border: "5px solid #333",
      boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      marginBottom: "20px",
    },
    puzzlePiece: {
      boxSizing: "border-box",
      cursor: "pointer",
      backgroundRepeat: "no-repeat",
      transition: 'border 0.2s',
    },
    backButton: {
      position: "absolute",
      top: "20px",
      left: "20px",
      padding: "10px 15px",
      cursor: "pointer",
      backgroundColor: '#333',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
    },
    restartButton: {
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#ff4500",
        color: "white",
        border: "none",
        borderRadius: "5px",
        margin: "0 10px",
    }
  };


  return (
    <div style={styles.puzzleContainer}>
      <button onClick={onBack} style={styles.backButton}>
        ← Kembali ke Menu
      </button>
      <h2>🧩 Animal Puzzle ({GRID_SIZE}x{GRID_SIZE})</h2>
      
      <div style={styles.header}>
        <p>Langkah: **{moves}**</p>
        <button onClick={restartGame} style={styles.restartButton}>
            Acak Ulang
        </button>
      </div>

      <div style={styles.puzzleGrid}>
        {renderPieces()}
      </div>

      {isSolved && <h3 style={{color: '#006400', backgroundColor: 'yellow', padding: '10px', borderRadius: '5px'}}>🎉 Selamat! Puzzle Terpecahkan dalam {moves} langkah!</h3>}

    </div>
  );
};

export default AnimalPuzzleGame;