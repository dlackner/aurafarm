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
        pawPrints: [...prevState.pawPrints],
      };
      newState.isColliding = false;

      console.log('GAMELOOP: Copied patterns:', newState.rakePatterns.length);

      // Spawn dog occasionally (every 15-30 seconds)
      const DOG_SPAWN_MIN = 15000;
      const DOG_SPAWN_MAX = 30000;
      if (!newState.dog && timestamp - newState.lastDogSpawn > DOG_SPAWN_MIN) {
        const shouldSpawn = Math.random() < 0.02; // 2% chance per frame after minimum time
        if (shouldSpawn || timestamp - newState.lastDogSpawn > DOG_SPAWN_MAX) {
          // Spawn dog from left or right side
          const fromRight = Math.random() > 0.5;
          newState.dog = {
            position: {
              x: fromRight ? GAME_CONFIG.CANVAS_WIDTH + 30 : -30,
              y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 100) + 50
            },
            velocity: { x: fromRight ? -2 : 2, y: 0 },
            isActive: true,
            animationFrame: 0,
            facingRight: !fromRight
          };
          newState.lastDogSpawn = timestamp;
          console.log('DOG SPAWNED!');
        }
      }

      // Update dog movement and create paw prints
      if (newState.dog && newState.dog.isActive) {
        // Move dog
        newState.dog.position.x += newState.dog.velocity.x;
        newState.dog.animationFrame = (newState.dog.animationFrame + 0.2) % 4;

        // Add paw prints every few pixels
        if (Math.floor(newState.dog.position.x) % 15 === 0) {
          // Add two paw prints (front and back paws)
          newState.pawPrints.push({
            position: {
              x: newState.dog.position.x - 5,
              y: newState.dog.position.y + 10
            },
            age: 0
          });
          newState.pawPrints.push({
            position: {
              x: newState.dog.position.x + 5,
              y: newState.dog.position.y + 15
            },
            age: 0
          });
        }

        // Remove dog when it goes off screen
        if (newState.dog.position.x < -50 || newState.dog.position.x > GAME_CONFIG.CANVAS_WIDTH + 50) {
          newState.dog = null;
        }
      }

      // Limit paw prints
      if (newState.pawPrints.length > 200) {
        newState.pawPrints = newState.pawPrints.slice(-200);
      }

      // Spawn sushi occasionally (every 20-40 seconds)
      const SUSHI_SPAWN_MIN = 20000;
      const SUSHI_SPAWN_MAX = 40000;
      if (!newState.sushi && timestamp - newState.lastSushiSpawn > SUSHI_SPAWN_MIN) {
        const shouldSpawn = Math.random() < 0.01; // 1% chance per frame after minimum time
        if (shouldSpawn || timestamp - newState.lastSushiSpawn > SUSHI_SPAWN_MAX) {
          // Spawn sushi at random position
          newState.sushi = {
            position: {
              x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 40) + 20,
              y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - 40) + 20
            },
            isActive: true,
            animationFrame: 0
          };
          newState.lastSushiSpawn = timestamp;
          console.log('SUSHI SPAWNED!');
        }
      }

      // Animate sushi
      if (newState.sushi && newState.sushi.isActive) {
        newState.sushi.animationFrame = (newState.sushi.animationFrame + 0.1) % (Math.PI * 2);

        // Check if rake collects sushi
        const dx = newState.rakePosition.x - newState.sushi.position.x;
        const dy = newState.rakePosition.y - newState.sushi.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < GAME_CONFIG.RAKE_SIZE + 20) {
          // Collected sushi!
          console.log('SUSHI COLLECTED!');
          newState.sushi = null;
          newState.placementsAvailable += 1;
          // Could show a selection UI here, for now just cycle through options
          if (newState.placementMode === 'none') {
            newState.placementMode = 'rock';
          }
        }
      }

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

          // Check if rake is cleaning up paw prints
          const originalPawCount = newState.pawPrints.length;
          newState.pawPrints = newState.pawPrints.filter(paw => {
            const dx = newState.rakePosition.x - paw.position.x;
            const dy = newState.rakePosition.y - paw.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Remove paw print if rake is close enough
            if (distance < GAME_CONFIG.RAKE_SIZE) {
              console.log('Cleaned up a paw print!');
              return false; // Remove this paw print
            }
            return true; // Keep this paw print
          });

          // Give small aura bonus for cleaning paw prints
          const pawsCleaned = originalPawCount - newState.pawPrints.length;
          if (pawsCleaned > 0) {
            newState.aura = Math.min(newState.maxAura, newState.aura + (pawsCleaned * 0.5));
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