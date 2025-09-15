import { useEffect, useRef, useCallback } from 'react';
import { GameState, InputState } from '../types/game';
import {
  GAME_CONFIG,
  checkCollision,
  createRakePattern
} from '../utils/gameHelpers';

export const useGameLoop = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  inputState: InputState
) => {
  const animationFrameId = useRef<number>(0);
  const lastPatternTime = useRef<number>(0);
  const inputStateRef = useRef<InputState>(inputState);

  // Update the ref whenever inputState changes
  useEffect(() => {
    inputStateRef.current = inputState;
  }, [inputState]);

  const gameLoop = useCallback((timestamp: number) => {
    setGameState(prevState => {
      if (prevState.isGameOver) return prevState;

      console.log('GAMELOOP START: Previous patterns:', prevState.rakePatterns.length);

      let newState = {
        ...prevState,
        rakePatterns: [...prevState.rakePatterns],  // Make sure to copy the array
      };
      newState.isColliding = false;

      console.log('GAMELOOP: Copied patterns:', newState.rakePatterns.length);

      // Log input state periodically
      if (timestamp % 1000 < 20) {
        console.log('GAMELOOP: inputState.isMouseDown =', inputStateRef.current.isMouseDown, 'mousePos:', inputStateRef.current.mousePosition);
      }

      if (inputStateRef.current.isMouseDown) {
        console.log('GAMELOOP: Mouse is down, processing movement');
        const dx = inputStateRef.current.mousePosition.x - newState.rakePosition.x;
        const dy = inputStateRef.current.mousePosition.y - newState.rakePosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        console.log('GAMELOOP: Distance moved:', distance);

        if (distance > 2) {
          console.log('GAMELOOP: Distance > 2, updating position');
          const moveSpeed = 0.15;
          newState.rakePosition = {
            x: newState.rakePosition.x + (dx * moveSpeed),
            y: newState.rakePosition.y + (dy * moveSpeed),
          };

          newState.rakePosition.x = Math.max(0, Math.min(
            GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.RAKE_SIZE,
            newState.rakePosition.x
          ));
          newState.rakePosition.y = Math.max(0, Math.min(
            GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.RAKE_SIZE,
            newState.rakePosition.y
          ));

          // Check for collisions
          for (const object of newState.gardenObjects) {
            if (checkCollision(newState.rakePosition, GAME_CONFIG.RAKE_SIZE, object)) {
              newState.isColliding = true;
              if (timestamp - newState.lastCollisionTime > 500) {
                newState.aura = Math.max(0, newState.aura - GAME_CONFIG.AURA_LOSS);
                newState.lastCollisionTime = timestamp;

                if (newState.aura <= 0) {
                  newState.isGameOver = true;
                }
              }
              break;
            }
          }

          // Always add patterns when moving (regardless of collision)
          console.log('GAMELOOP: Checking pattern timer:', timestamp - lastPatternTime.current);
          if (timestamp - lastPatternTime.current > 10) {  // Very frequent patterns for continuous trail
            console.log('GAMELOOP: Time to add pattern, isColliding:', newState.isColliding);
            // Only add pattern if not colliding
            if (!newState.isColliding) {
              const newPattern = createRakePattern(newState.rakePosition);
              console.log('GAMELOOP: Creating pattern at', newState.rakePosition);
              // Create a new array with the new pattern
              newState.rakePatterns = [...newState.rakePatterns, newPattern];
              console.log('GAMELOOP: Pattern added! Total:', newState.rakePatterns.length);

              // Gain aura while raking (but not above max)
              newState.aura = Math.min(newState.maxAura, newState.aura + 0.02);
            }
            lastPatternTime.current = timestamp;
          }
        }
      }

      // Don't update patterns since we want them to persist
      // Just limit the array size if needed
      if (newState.rakePatterns.length > GAME_CONFIG.MAX_PATTERNS) {
        newState.rakePatterns = newState.rakePatterns.slice(-GAME_CONFIG.MAX_PATTERNS);
      }

      // Always log what we're returning
      console.log('GAMELOOP END: Returning state with', newState.rakePatterns.length, 'patterns');

      return newState;
    });

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [setGameState]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop]);
};