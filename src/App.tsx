import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { AudioPlayer } from './components/AudioPlayer';
import { TestPatterns } from './components/TestPatterns';
import { useGameLoop } from './hooks/useGameLoop';
import { GameState, InputState } from './types/game';
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
  });

  const [inputState, setInputState] = useState<InputState>({
    mousePosition: { x: 0, y: 0 },
    isMouseDown: false,
  });

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
    console.log('APP: Mouse down detected');
    setInputState(prev => ({ ...prev, isMouseDown: true }));
  }, []);

  const handleMouseUp = useCallback(() => {
    console.log('APP: Mouse up detected');
    setInputState(prev => ({ ...prev, isMouseDown: false }));
  }, []);

  // Add debug logging for state changes
  useEffect(() => {
    console.log('APP: Game state updated, patterns:', gameState.rakePatterns.length);
    if (gameState.rakePatterns.length > 0) {
      console.log('APP: First pattern position:', gameState.rakePatterns[0].position);
      console.log('APP: Last pattern position:', gameState.rakePatterns[gameState.rakePatterns.length - 1].position);
    }
  }, [gameState.rakePatterns]);

  const handleRestart = useCallback(() => {
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
    });
  }, []);

  return (
    <div className="App">
      <h1 className="game-title">AURA FARM</h1>
      <div className="game-container">
        <HUD
          aura={gameState.aura}
          maxAura={gameState.maxAura}
          isGameOver={gameState.isGameOver}
          onRestart={handleRestart}
        />
        <AudioPlayer />
        <GameCanvas
          gameState={gameState}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      </div>
      <div className="instructions">
        Click and drag to rake the sand • Avoid rocks, trees, and ponds • Maintain your aura
      </div>
    </div>
  );
}

export default App;
