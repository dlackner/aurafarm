import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { GameMenu } from './components/GameMenu';
import { useGameLoop } from './hooks/useGameLoop';
import { GameState, InputState, LeaderboardEntry } from './types/game';
import { generateGardenObjects, GAME_CONFIG } from './utils/gameHelpers';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    rakePosition: { x: GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.CANVAS_HEIGHT / 2 },
    aura: 100,
    maxAura: 100,
    gardenObjects: generateGardenObjects(),
    rakePatterns: [],
    isGameOver: false,
    sandResetProgress: 0,
    isColliding: false,
    lastCollisionTime: 0,
    dog: null,
    pawPrints: [],
    lastDogSpawn: 0,
    sushi: null,
    lastSushiSpawn: 0,
    placementMode: 'none',
    placementsAvailable: 0,
    gamePhase: 'menu',
    startTime: 0,
    currentTime: 0,
    timeLimit: 120, // 2 minutes to rake the garden
    coverage: 0,
    coveredTiles: new Set<string>(),
  });

  const [inputState, setInputState] = useState<InputState>({
    mousePosition: { x: 0, y: 0 },
    isMouseDown: false,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('aurafarm-leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  const [playerName, setPlayerName] = useState('');

  useGameLoop(gameState, setGameState, inputState);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    // Handle both mouse and touch events
    let clientX: number, clientY: number;
    if ('touches' in e) {
      // Touch event
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    setInputState(prev => ({
      ...prev,
      mousePosition: {
        x: clientX - rect.left,
        y: clientY - rect.top,
      },
    }));
  }, []);

  const handleMouseDown = useCallback(() => {

    // Check if we're in placement mode
    if (gameState.placementMode !== 'none' && gameState.placementsAvailable > 0) {
      const mousePos = inputState.mousePosition;

      // Place a new garden object at mouse position
      const newObject = {
        id: `placed-${Date.now()}`,
        position: {
          x: Math.max(0, Math.min(mousePos.x - 24, GAME_CONFIG.CANVAS_WIDTH - 48)),
          y: Math.max(0, Math.min(mousePos.y - 30, GAME_CONFIG.CANVAS_HEIGHT - 60))
        },
        width: gameState.placementMode === 'pond' ? 96 : gameState.placementMode === 'tree' ? 48 : 36,
        height: gameState.placementMode === 'pond' ? 72 : gameState.placementMode === 'tree' ? 60 : 36,
        type: gameState.placementMode as 'rock' | 'tree' | 'pond'
      };

      setGameState(prev => ({
        ...prev,
        gardenObjects: [...prev.gardenObjects, newObject],
        placementsAvailable: prev.placementsAvailable - 1,
        placementMode: prev.placementsAvailable > 1 ? prev.placementMode : 'none',
        aura: Math.min(prev.maxAura, prev.aura + 20) // +20 aura bonus
      }));

      return; // Don't start dragging when placing
    }

    setInputState(prev => ({ ...prev, isMouseDown: true }));
  }, [gameState.placementMode, gameState.placementsAvailable, inputState.mousePosition]);

  const handleMouseUp = useCallback(() => {
    setInputState(prev => ({ ...prev, isMouseDown: false }));
  }, []);

  // Add keyboard controls for placement mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.placementsAvailable > 0) {
        switch(e.key) {
          case '1':
            setGameState(prev => ({ ...prev, placementMode: 'rock' }));
            break;
          case '2':
            setGameState(prev => ({ ...prev, placementMode: 'tree' })); // Still 'tree' type but displays as cactus
            break;
          case '3':
            setGameState(prev => ({ ...prev, placementMode: 'pond' }));
            break;
          case 'Escape':
            setGameState(prev => ({ ...prev, placementMode: 'none' }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.placementsAvailable]);


  const startGame = useCallback(() => {
    setGameState({
      rakePosition: { x: GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.CANVAS_HEIGHT / 2 },
      aura: 100,
      maxAura: 100,
      gardenObjects: generateGardenObjects(),
      rakePatterns: [],
      isGameOver: false,
      sandResetProgress: 0,
      isColliding: false,
      lastCollisionTime: 0,
      dog: null,
      pawPrints: [],
      lastDogSpawn: 0,
      sushi: null,
      lastSushiSpawn: 0,
      placementMode: 'none',
      placementsAvailable: 0,
      gamePhase: 'playing',
      startTime: Date.now(),
      currentTime: Date.now(),
      timeLimit: 120,
      coverage: 0,
      coveredTiles: new Set<string>(),
    });
  }, []);

  const handleRestart = useCallback(() => {
    startGame();
  }, [startGame]);

  const submitScore = useCallback(() => {
    if (!playerName.trim()) return;

    const entry: LeaderboardEntry = {
      name: playerName.trim(),
      time: Math.floor((gameState.currentTime - gameState.startTime) / 1000),
      coverage: gameState.coverage,
      date: new Date().toISOString(),
    };

    const newLeaderboard = [...leaderboard, entry]
      .sort((a, b) => b.coverage - a.coverage || a.time - b.time)
      .slice(0, 10); // Keep top 10

    setLeaderboard(newLeaderboard);
    localStorage.setItem('aurafarm-leaderboard', JSON.stringify(newLeaderboard));
    setGameState(prev => ({ ...prev, gamePhase: 'menu' }));
    setPlayerName('');
  }, [playerName, gameState, leaderboard]);

  return (
    <div className="App">
      <h1 className="game-title">AURA FARM</h1>

      {gameState.gamePhase === 'menu' ? (
        <GameMenu
          onStartGame={startGame}
          leaderboard={leaderboard}
        />
      ) : gameState.gamePhase === 'victory' || gameState.gamePhase === 'gameOver' ? (
        <GameMenu
          onStartGame={startGame}
          leaderboard={leaderboard}
          isVictory={gameState.gamePhase === 'victory'}
          coverage={gameState.coverage}
          time={Math.floor((gameState.currentTime - gameState.startTime) / 1000)}
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          onSubmitScore={submitScore}
        />
      ) : (
        <>
          <HUD
            aura={gameState.aura}
            maxAura={gameState.maxAura}
            isGameOver={gameState.isGameOver}
            onRestart={handleRestart}
            timeRemaining={gameState.timeLimit - Math.floor((gameState.currentTime - gameState.startTime) / 1000)}
            coverage={gameState.coverage}
          />
          <div className="game-container">
            <GameCanvas
              gameState={gameState}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
          </div>
          <div className="instructions">
            Rake {(95 - gameState.coverage).toFixed(1)}% more to complete! • Time: {gameState.timeLimit - Math.floor((gameState.currentTime - gameState.startTime) / 1000)}s
            {gameState.placementsAvailable > 0 && (
              <>
                <br />
                Press 1 (rock), 2 (cactus), 3 (pond) to select • Esc to cancel
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
