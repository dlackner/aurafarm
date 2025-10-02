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

      let newState = {
        ...prevState,
        rakePatterns: [...prevState.rakePatterns],  // Make sure to copy the array
        pawPrints: [...prevState.pawPrints],
        coveredTiles: new Set(prevState.coveredTiles || []), // Copy the Set with safety check
      };
      newState.isColliding = false;

      // Only run game logic if we're in playing phase
      if (prevState.gamePhase !== 'playing') return prevState;

      // Update timer
      newState.currentTime = Date.now();
      const elapsedSeconds = Math.floor((newState.currentTime - newState.startTime) / 1000);

      // Check for time up
      if (elapsedSeconds >= newState.timeLimit) {
        newState.gamePhase = newState.coverage >= 95 ? 'victory' : 'gameOver';
        return newState;
      }

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
        }
      }

      // Update dog movement and create paw prints
      if (newState.dog && newState.dog.isActive) {
        // Move dog
        newState.dog.position.x += newState.dog.velocity.x;
        newState.dog.animationFrame = (newState.dog.animationFrame + 0.2) % 4;

        // Dog messes up the raked areas as it runs - remove coverage
        const dogRadius = 30; // Area around dog that gets messed up
        const tileSize = 15; // Same as raking tile size

        // Remove covered tiles in the dog's path
        for (let dx = -dogRadius; dx <= dogRadius; dx += tileSize/2) {
          for (let dy = -dogRadius; dy <= dogRadius; dy += tileSize/2) {
            // Only mess up tiles within the dog's area
            if (dx * dx + dy * dy <= dogRadius * dogRadius) {
              const tileX = Math.floor((newState.dog.position.x + dx) / tileSize);
              const tileY = Math.floor((newState.dog.position.y + dy) / tileSize);
              const tileKey = `${tileX},${tileY}`;
              newState.coveredTiles.delete(tileKey); // Remove the covered tile
            }
          }
        }

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

        // Recalculate coverage after dog messes things up
        const totalTiles = Math.floor(GAME_CONFIG.CANVAS_WIDTH / tileSize) *
                          Math.floor(GAME_CONFIG.CANVAS_HEIGHT / tileSize);
        newState.coverage = Math.min(100, (newState.coveredTiles.size / totalTiles) * 100);

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
          newState.sushi = null;
          newState.placementsAvailable += 1;
          // Could show a selection UI here, for now just cycle through options
          if (newState.placementMode === 'none') {
            newState.placementMode = 'rock';
          }
        }
      }

      if (inputStateRef.current.isMouseDown) {
        const dx = inputStateRef.current.mousePosition.x - newState.rakePosition.x;
        const dy = inputStateRef.current.mousePosition.y - newState.rakePosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) { // More responsive - trigger on smaller movements
          const moveSpeed = 0.25; // Faster, more responsive movement
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

          // ALWAYS track coverage when moving - cover a larger area for more satisfying raking
          const tileSize = 15; // Smaller tiles = more granular coverage
          const rakeRadius = 25; // Cover tiles in a larger radius around rake

          // Cover multiple tiles in a circle around the rake for more satisfying coverage
          for (let dx = -rakeRadius; dx <= rakeRadius; dx += tileSize/2) {
            for (let dy = -rakeRadius; dy <= rakeRadius; dy += tileSize/2) {
              // Only cover tiles within the rake's circular area
              if (dx * dx + dy * dy <= rakeRadius * rakeRadius) {
                const tileX = Math.floor((newState.rakePosition.x + dx) / tileSize);
                const tileY = Math.floor((newState.rakePosition.y + dy) / tileSize);
                const tileKey = `${tileX},${tileY}`;
                newState.coveredTiles.add(tileKey);
              }
            }
          }

          // Calculate coverage percentage
          const totalTiles = Math.floor(GAME_CONFIG.CANVAS_WIDTH / tileSize) *
                            Math.floor(GAME_CONFIG.CANVAS_HEIGHT / tileSize);
          newState.coverage = Math.min(100, (newState.coveredTiles.size / totalTiles) * 100);

          // Check for victory condition
          if (newState.coverage >= 95) {
            newState.gamePhase = 'victory';
          }

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
          if (lastPatternTime.current === 0 || timestamp - lastPatternTime.current > 5) {  // Even more frequent patterns for smoother trail
            // Always track coverage when moving, even if colliding
            const newPattern = createRakePattern(newState.rakePosition);

            // Only add visual pattern if not colliding, but always track coverage
            if (!newState.isColliding) {
              newState.rakePatterns = [...newState.rakePatterns, newPattern];
            }

            // Gain aura while raking (but not above max) - only if not colliding
            if (!newState.isColliding) {
              newState.aura = Math.min(newState.maxAura, newState.aura + 0.05); // More satisfying aura gain
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