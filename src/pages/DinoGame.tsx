
import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

// Game constants
const GRAVITY = 0.6;
const JUMP_FORCE = -16;
const SPEED = 6;
const CACTUS_INTERVAL_MIN = 500;
const CACTUS_INTERVAL_MAX = 2000;

// Game objects
interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DinoState extends GameObject {
  velocityY: number;
  isJumping: boolean;
}

interface CactusState extends GameObject {
  speed: number;
}

const DinoGame = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Game state refs
  const dinoRef = useRef<DinoState>({
    x: 50,
    y: 200,
    width: 40,
    height: 60,
    velocityY: 0,
    isJumping: false
  });
  
  const cactiRef = useRef<CactusState[]>([]);
  const gameSpeedRef = useRef(SPEED);
  
  const spawnCactus = () => {
    const cactus: CactusState = {
      x: 800,
      y: 200,
      width: 20,
      height: 40 + Math.random() * 20,
      speed: gameSpeedRef.current
    };
    
    cactiRef.current.push(cactus);
    
    // Schedule next cactus
    const nextSpawnTime = CACTUS_INTERVAL_MIN + 
      Math.random() * (CACTUS_INTERVAL_MAX - CACTUS_INTERVAL_MIN);
      
    setTimeout(spawnCactus, nextSpawnTime);
  };

  const checkCollision = (dino: DinoState, cactus: CactusState) => {
    return (
      dino.x < cactus.x + cactus.width &&
      dino.x + dino.width > cactus.x &&
      dino.y < cactus.y + cactus.height &&
      dino.y + dino.height > cactus.y
    );
  };

  const jump = () => {
    if (!dinoRef.current.isJumping && !gameOver) {
      dinoRef.current.velocityY = JUMP_FORCE;
      dinoRef.current.isJumping = true;
    }
  };

  const resetGame = () => {
    dinoRef.current = {
      x: 50,
      y: 200,
      width: 40,
      height: 60,
      velocityY: 0,
      isJumping: false
    };
    cactiRef.current = [];
    gameSpeedRef.current = SPEED;
    setScore(0);
    setGameOver(false);
    setGameActive(true);
    
    // Start spawning cacti
    setTimeout(spawnCactus, 1000);
    
    // Start score interval
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    scoreIntervalRef.current = setInterval(() => {
      setScore(prevScore => prevScore + 1);
    }, 100);
    
    // Start game loop
    lastTimeRef.current = performance.now();
    requestIdRef.current = requestAnimationFrame(gameLoop);
  };
  
  const gameLoop = (timestamp: number) => {
    if (!gameActive) return;
    
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    
    // Clear canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = '#444444';
      ctx.fillRect(0, 260, canvas.width, 2);
      
      // Update dino
      const dino = dinoRef.current;
      dino.velocityY += GRAVITY;
      dino.y += dino.velocityY;
      
      // Ground collision
      if (dino.y > 200) {
        dino.y = 200;
        dino.velocityY = 0;
        dino.isJumping = false;
      }
      
      // Draw dino
      ctx.fillStyle = '#8B5CF6';
      ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
      
      // Update and draw cacti
      cactiRef.current.forEach((cactus, index) => {
        cactus.x -= cactus.speed * (deltaTime / 16);
        
        // Remove cacti that are off-screen
        if (cactus.x < -cactus.width) {
          cactiRef.current.splice(index, 1);
        }
        
        // Draw cactus
        ctx.fillStyle = '#10B981';
        ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);
        
        // Check collision
        if (checkCollision(dino, cactus)) {
          endGame();
        }
      });
      
      // Draw score
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${score}`, 650, 40);
      ctx.fillText(`High Score: ${highScore}`, 620, 70);
      
      // Increase speed over time
      gameSpeedRef.current = SPEED + Math.floor(score / 500) * 0.5;
    }
    
    if (!gameOver) {
      requestIdRef.current = requestAnimationFrame(gameLoop);
    }
  };
  
  const endGame = () => {
    setGameActive(false);
    setGameOver(true);
    cancelAnimationFrame(requestIdRef.current);
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    
    // Update high score
    if (score > highScore) {
      setHighScore(score);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && gameActive) {
        e.preventDefault();
        jump();
      } else if ((e.code === 'Space' || e.key === 'Enter') && gameOver) {
        resetGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(requestIdRef.current);
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    };
  }, [gameActive, gameOver]);
  
  return (
    <div className="min-h-screen bg-teleport-darkgray">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} users={[]} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="container px-4 py-8">
          <div className="mb-8 bg-teleport-gray rounded-lg p-6 shadow-lg border border-slate-800">
            <h1 className="text-2xl font-bold text-white mb-2">Teleport Dino Game</h1>
            <p className="text-gray-300 mb-4">Press Space or Up Arrow to jump. Avoid the cacti!</p>
            
            <div className="flex justify-center">
              <div className="canvas-container relative bg-teleport-darkgray border-2 border-indigo-800 rounded-md overflow-hidden">
                <canvas 
                  ref={canvasRef} 
                  width="800" 
                  height="300" 
                  onClick={gameActive ? jump : gameOver ? resetGame : undefined}
                  className="cursor-pointer"
                />
                
                {!gameActive && !gameOver && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <h2 className="text-2xl font-bold text-white mb-4">Teleport Dino Runner</h2>
                    <Button onClick={resetGame} className="bg-indigo-600 hover:bg-indigo-700">
                      Start Game
                    </Button>
                  </div>
                )}
                
                {gameOver && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <h2 className="text-2xl font-bold text-white mb-2">Game Over</h2>
                    <p className="text-lg text-gray-300 mb-4">Score: {score}</p>
                    <Button onClick={resetGame} className="bg-indigo-600 hover:bg-indigo-700">
                      Play Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 text-gray-300 text-center">
              <p>Controls:</p>
              <p>Press <span className="px-2 py-1 bg-slate-800 rounded text-white">Space</span> or <span className="px-2 py-1 bg-slate-800 rounded text-white">↑</span> to jump</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Button component for the game controls
const Button = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded text-white font-medium ${className}`}
  >
    {children}
  </button>
);

export default DinoGame;
