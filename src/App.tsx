import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
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
    dog: null,
    pawPrints: [],
    lastDogSpawn: 0,
    sushi: null,
    lastSushiSpawn: 0,
    placementMode: 'none',
    placementsAvailable: 0,
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
    console.log('APP: Mouse up detected');
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
      dog: null,
      pawPrints: [],
      lastDogSpawn: 0,
      sushi: null,
      lastSushiSpawn: 0,
      placementMode: 'none',
      placementsAvailable: 0,
    });
  }, []);

  return (
    <div className="App">
      <h1 className="game-title">AURA FARM</h1>
      <HUD
        aura={gameState.aura}
        maxAura={gameState.maxAura}
        isGameOver={gameState.isGameOver}
        onRestart={handleRestart}
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
        Click and drag to rake the sand • Avoid rocks, cacti, and ponds • Collect sushi 🍣 to place new elements (+20 aura!)
        {gameState.placementsAvailable > 0 && " • Press 1:Rock 2:Cactus 3:Pond ESC:Cancel"}
      </div>
    </div>
  );
}

export default App;
