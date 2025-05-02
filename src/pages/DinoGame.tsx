import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Gamepad2 } from 'lucide-react';

// Game constants
const GRAVITY = 1;
const JUMP_SPEED = -20;
const CACTUS_SPEED = 8;
const CACTUS_SPAWN_INTERVAL = 1500; // Increased interval for easier gameplay
const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;

// Game state
interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Dino extends GameObject {
  yVelocity: number;
  isJumping: boolean;
}

interface Cactus extends GameObject {}

// Game components
const DinoComponent: React.FC<{ dino: Dino }> = ({ dino }) => (
  <div
    style={{
      position: 'absolute',
      left: `${dino.x}px`,
      bottom: `${dino.y}px`,
      width: `${dino.width}px`,
      height: `${dino.height}px`,
      backgroundColor: 'white',
    }}
  />
);

const CactusComponent: React.FC<{ cactus: Cactus }> = ({ cactus }) => (
  <div
    style={{
      position: 'absolute',
      left: `${cactus.x}px`,
      bottom: '0px',
      width: `${cactus.width}px`,
      height: `${cactus.height}px`,
      backgroundColor: 'green',
    }}
  />
);

// Collision detection
const checkCollision = (a: GameObject, b: GameObject): boolean => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

const DinoGame: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [dino, setDino] = useState<Dino>({
    x: 50,
    y: 0,
    width: 20,
    height: 30,
    yVelocity: 0,
    isJumping: false,
  });
  const [cacti, setCacti] = useState<Cactus[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  // Jumping function
  const jump = () => {
    if (!dino.isJumping) {
      setDino({ ...dino, yVelocity: JUMP_SPEED, isJumping: true });
    }
  };

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const intervalId = setInterval(() => {
      setScore((prevScore) => prevScore + 1);

      // Dino physics
      setDino((prevDino) => {
        let newYVelocity = prevDino.yVelocity + GRAVITY;
        let newY = prevDino.y + newYVelocity;
        let newIsJumping = prevDino.isJumping;

        if (newY <= 0) {
          newY = 0;
          newYVelocity = 0;
          newIsJumping = false;
        }

        return { ...prevDino, y: newY, yVelocity: newYVelocity, isJumping: newIsJumping };
      });

      // Cactus movement
      setCacti((prevCacti) =>
        prevCacti
          .map((cactus) => ({ ...cactus, x: cactus.x - CACTUS_SPEED }))
          .filter((cactus) => cactus.x > -20)
      );

      // Spawn new cacti
      if (Math.random() < 0.01) {
        setCacti((prevCacti) => [
          ...prevCacti,
          { x: GAME_WIDTH, y: 0, width: 15, height: Math.floor(Math.random() * 30) + 20 },
        ]);
      }

      // Collision detection
      for (const cactus of cacti) {
        if (checkCollision(dino, cactus)) {
          setGameOver(true);
          break;
        }
      }
    }, 20);

    return () => clearInterval(intervalId);
  }, [dino, cacti, gameOver]);

  // Cactus spawning
  useEffect(() => {
    if (gameOver) return;

    const spawnIntervalId = setInterval(() => {
      setCacti((prevCacti) => [
        ...prevCacti,
        { x: GAME_WIDTH, y: 0, width: 15, height: Math.floor(Math.random() * 30) + 20 },
      ]);
    }, CACTUS_SPAWN_INTERVAL);

    return () => clearInterval(spawnIntervalId);
  }, [gameOver]);

  // Key press event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus on gameRef when component mounts
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.focus();
    }
  }, []);
  
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} users={users} />
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="container px-4 py-8">
          <div className="mb-8 bg-teleport-gray rounded-lg p-6 shadow-lg border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Gamepad2 className="h-6 w-6 text-indigo-400" />
              <h1 className="text-2xl font-bold text-white">Teleport Dino Game</h1>
            </div>
            <p className="text-gray-300 mb-4">Press Space or Up Arrow to jump. Avoid the cacti!</p>
            
            <div
              ref={gameRef}
              className="relative overflow-hidden"
              style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px`, backgroundColor: 'black' }}
              tabIndex={0}
            >
              <DinoComponent dino={dino} />
              {cacti.map((cactus, index) => (
                <CactusComponent cactus={cactus} key={index} />
              ))}
            </div>
            
            <div className="mt-4 flex justify-center gap-4">
              <p className="text-white">Score: {score}</p>
              {gameOver && <p className="text-red-500">Game Over!</p>}
              {gameOver && (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => {
                    setDino({
                      x: 50,
                      y: 0,
                      width: 20,
                      height: 30,
                      yVelocity: 0,
                      isJumping: false,
                    });
                    setCacti([]);
                    setScore(0);
                    setGameOver(false);
                    if (gameRef.current) {
                      gameRef.current.focus();
                    }
                  }}
                >
                  Restart
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DinoGame;
