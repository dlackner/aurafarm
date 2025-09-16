import React, { useRef, useEffect } from 'react';
import { GameState } from '../types/game';
import { GAME_CONFIG } from '../utils/gameHelpers';

interface GameCanvasProps {
  gameState: GameState;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onMouseMove,
  onMouseDown,
  onMouseUp,
}) => {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastRakePosition = useRef({ x: -1, y: -1 });
  const isDrawing = useRef(false);
  const patternTimestamps = useRef<Map<number, number>>(new Map());

  // Initialize background once
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Draw sandy background with waves
    const gradient = ctx.createLinearGradient(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#F5DEB3');
    gradient.addColorStop(0.5, '#EDD4A6');
    gradient.addColorStop(1, '#E6C995');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw wavy sand patterns
    for (let x = 0; x < GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.TILE_SIZE * 2) {
      for (let y = 0; y < GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.TILE_SIZE) {
        const waveOffset = Math.sin((x + y) * 0.02) * 2;
        const colorVariation = Math.sin((x - y) * 0.01) * 15;
        ctx.fillStyle = `rgb(${230 + colorVariation}, ${215 + colorVariation}, ${180 + colorVariation})`;
        ctx.fillRect(x + waveOffset, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
      }
    }
  }, []); // Only draw background once

  // Handle pattern drawing and fading
  useEffect(() => {
    const patternCanvas = patternCanvasRef.current;
    if (!patternCanvas) return;

    const ctx = patternCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Draw rake pattern trail when moving
    if (isDrawing.current && lastRakePosition.current.x !== -1) {
      const currentX = gameState.rakePosition.x;
      const currentY = gameState.rakePosition.y;
      const lastX = lastRakePosition.current.x;
      const lastY = lastRakePosition.current.y;

      // Calculate distance
      const dx = currentX - lastX;
      const dy = currentY - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only draw if moved enough
      if (distance > 2) {
        // Store timestamp for this pattern segment
        const patternId = Date.now();
        patternTimestamps.current.set(patternId, Date.now());

        // Draw a darker sand trail
        ctx.strokeStyle = 'rgba(160, 140, 100, 0.6)';
        ctx.lineWidth = GAME_CONFIG.RAKE_SIZE;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(lastX + GAME_CONFIG.RAKE_SIZE / 2, lastY + GAME_CONFIG.RAKE_SIZE / 2);
        ctx.lineTo(currentX + GAME_CONFIG.RAKE_SIZE / 2, currentY + GAME_CONFIG.RAKE_SIZE / 2);
        ctx.stroke();

        // Draw rake teeth marks
        const angle = Math.atan2(dy, dx);
        for (let i = 0; i < 5; i++) {
          const offset = (i - 2) * 4;
          const perpX = Math.cos(angle + Math.PI / 2) * offset;
          const perpY = Math.sin(angle + Math.PI / 2) * offset;

          ctx.strokeStyle = 'rgba(140, 120, 80, 0.7)';
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.moveTo(lastX + GAME_CONFIG.RAKE_SIZE / 2 + perpX, lastY + GAME_CONFIG.RAKE_SIZE / 2 + perpY);
          ctx.lineTo(currentX + GAME_CONFIG.RAKE_SIZE / 2 + perpX, currentY + GAME_CONFIG.RAKE_SIZE / 2 + perpY);
          ctx.stroke();
        }

        lastRakePosition.current = { x: currentX, y: currentY };
      }
    }
  }, [gameState.rakePosition]);

  // Fade patterns over time
  useEffect(() => {
    const fadeInterval = setInterval(() => {
      const patternCanvas = patternCanvasRef.current;
      if (!patternCanvas) return;

      const ctx = patternCanvas.getContext('2d');
      if (!ctx) return;

      // Get current image data
      const imageData = ctx.getImageData(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
      const data = imageData.data;

      // Fade all pixels slightly
      for (let i = 3; i < data.length; i += 4) {
        // Only fade the alpha channel
        if (data[i] > 0) {
          data[i] = Math.max(0, data[i] - 2); // Fade by 2 per frame
        }
      }

      // Put the faded image back
      ctx.putImageData(imageData, 0, 0);
    }, 100); // Run every 100ms

    return () => clearInterval(fadeInterval);
  }, []);

  // Redraw objects and rake
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    const patternCanvas = patternCanvasRef.current;
    if (!canvas || !patternCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear only the object layer area (we'll composite them)
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Redraw background in areas where objects will be
    gameState.gardenObjects.forEach(object => {
      const gradient = ctx.createLinearGradient(
        object.position.x,
        object.position.y,
        object.position.x + object.width,
        object.position.y + object.height
      );
      gradient.addColorStop(0, '#F5DEB3');
      gradient.addColorStop(1, '#E6C995');
      ctx.fillStyle = gradient;
      ctx.fillRect(
        object.position.x - 5,
        object.position.y - 5,
        object.width + 10,
        object.height + 10
      );
    });

    // Draw garden objects
    gameState.gardenObjects.forEach(object => {
      if (object.type === 'rock') {
        // Draw pixelated rock
        const rockPixels = [
          [0, 1, 1, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [0, 1, 1, 0]
        ];
        const pixelSize = object.width / 4;
        rockPixels.forEach((row, y) => {
          row.forEach((pixel, x) => {
            if (pixel) {
              ctx.fillStyle = y < 2 ? '#7A7A7A' : '#5A5A5A';
              ctx.fillRect(
                object.position.x + x * pixelSize,
                object.position.y + y * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          });
        });
      } else if (object.type === 'tree') {
        // Draw pixelated cactus
        const pixelSize = object.width / 6;

        // Main cactus body (tall green column)
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(
          object.position.x + object.width / 2 - pixelSize,
          object.position.y + pixelSize,
          pixelSize * 2,
          object.height - pixelSize * 2
        );

        // Cactus ridges (lighter green stripes)
        ctx.fillStyle = '#4a7c3c';
        ctx.fillRect(
          object.position.x + object.width / 2 - pixelSize + 2,
          object.position.y + pixelSize,
          4,
          object.height - pixelSize * 2
        );
        ctx.fillRect(
          object.position.x + object.width / 2 + pixelSize - 6,
          object.position.y + pixelSize,
          4,
          object.height - pixelSize * 2
        );

        // Left arm
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(
          object.position.x + pixelSize / 2,
          object.position.y + object.height / 2 - pixelSize / 2,
          pixelSize * 1.5,
          pixelSize
        );
        ctx.fillRect(
          object.position.x + pixelSize / 2,
          object.position.y + object.height / 2 - pixelSize * 1.5,
          pixelSize,
          pixelSize * 1.5
        );

        // Right arm
        ctx.fillRect(
          object.position.x + object.width - pixelSize * 2,
          object.position.y + object.height / 3,
          pixelSize * 1.5,
          pixelSize
        );
        ctx.fillRect(
          object.position.x + object.width - pixelSize,
          object.position.y + object.height / 3 - pixelSize,
          pixelSize,
          pixelSize * 1.5
        );

        // Spines (tiny dark dots)
        ctx.fillStyle = '#1a3d0f';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(
            object.position.x + object.width / 2 - pixelSize + Math.random() * pixelSize * 2,
            object.position.y + pixelSize + i * (object.height / 6),
            2,
            2
          );
        }
      } else if (object.type === 'pond') {
        // Draw pixelated pond
        ctx.fillStyle = '#4A90A4';
        ctx.fillRect(object.position.x, object.position.y, object.width, object.height);

        // Add static water pattern
        ctx.fillStyle = '#5BA0B4';
        for (let x = 4; x < object.width - 4; x += 16) {
          for (let y = 4; y < object.height - 4; y += 16) {
            ctx.fillRect(
              object.position.x + x,
              object.position.y + y,
              8,
              8
            );
          }
        }
      }
    });

    ctx.restore();

    // Clear rake area and draw rake
    const rakeX = gameState.rakePosition.x;
    const rakeY = gameState.rakePosition.y;

    // Clear previous rake position
    ctx.save();
    const clearSize = GAME_CONFIG.RAKE_SIZE + 10;
    const gradient = ctx.createLinearGradient(
      rakeX - 5,
      rakeY - 5,
      rakeX + clearSize,
      rakeY + clearSize
    );
    gradient.addColorStop(0, '#F5DEB3');
    gradient.addColorStop(1, '#E6C995');
    ctx.fillStyle = gradient;
    ctx.fillRect(rakeX - 5, rakeY - 5, clearSize, clearSize);

    // Draw pixelated rake
    // Draw handle
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(rakeX + GAME_CONFIG.RAKE_SIZE / 2 - 2, rakeY, 4, GAME_CONFIG.RAKE_SIZE - 6);

    // Draw rake head
    ctx.fillStyle = '#654321';
    ctx.fillRect(rakeX + 2, rakeY + GAME_CONFIG.RAKE_SIZE - 8, GAME_CONFIG.RAKE_SIZE - 4, 4);

    // Draw rake teeth
    ctx.fillStyle = '#4A4A4A';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(
        rakeX + 3 + i * 4,
        rakeY + GAME_CONFIG.RAKE_SIZE - 6,
        2,
        6
      );
    }

    ctx.restore();

    // Draw placement mode UI
    if (gameState.placementMode !== 'none' && gameState.placementsAvailable > 0) {
      // Draw placement indicator at mouse position
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;

      const width = gameState.placementMode === 'pond' ? 96 : gameState.placementMode === 'tree' ? 48 : 36;
      const height = gameState.placementMode === 'pond' ? 72 : gameState.placementMode === 'tree' ? 60 : 36;

      ctx.strokeRect(
        gameState.rakePosition.x - width/2,
        gameState.rakePosition.y - height/2,
        width,
        height
      );

      ctx.restore();

      // Draw placement mode text
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 12px monospace';
      const elementName = gameState.placementMode === 'tree' ? 'cactus' : gameState.placementMode;
      ctx.fillText(
        `Place ${elementName} (${gameState.placementsAvailable} left) Click to place, +20 aura!`,
        10,
        GAME_CONFIG.CANVAS_HEIGHT - 10
      );
    }

    // Draw paw prints on the main canvas (redrawn each frame, controlled by gameState)
    if (gameState.pawPrints.length > 0) {
      gameState.pawPrints.forEach(paw => {
        // Draw larger paw print (scaled up 50%) on main canvas
        ctx.fillStyle = 'rgba(60, 40, 20, 0.5)';
        // Main pad
        ctx.beginPath();
        ctx.arc(paw.position.x, paw.position.y, 5, 0, Math.PI * 2);
        ctx.fill();
        // Toe pads
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(
            paw.position.x + (i - 1) * 5,
            paw.position.y - 7,
            2.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
    }

    // Draw dog if active
    if (gameState.dog && gameState.dog.isActive) {
      const dog = gameState.dog;

      // Clear area around dog (bigger for larger dog)
      const dogClearSize = 60;
      ctx.save();
      const dogGradient = ctx.createLinearGradient(
        dog.position.x - 10,
        dog.position.y - 10,
        dog.position.x + dogClearSize,
        dog.position.y + dogClearSize
      );
      dogGradient.addColorStop(0, '#F5DEB3');
      dogGradient.addColorStop(1, '#E6C995');
      ctx.fillStyle = dogGradient;
      ctx.fillRect(dog.position.x - 10, dog.position.y - 10, dogClearSize, dogClearSize);

      // Draw pixelated black dog (scaled up 50%)
      ctx.fillStyle = '#1a1a1a';

      // Body
      ctx.fillRect(dog.position.x, dog.position.y, 30, 18);

      // Head
      ctx.fillRect(
        dog.facingRight ? dog.position.x + 24 : dog.position.x - 9,
        dog.position.y - 3,
        12,
        12
      );

      // Tail
      ctx.fillRect(
        dog.facingRight ? dog.position.x - 6 : dog.position.x + 30,
        dog.position.y - 3,
        6,
        6
      );

      // Legs (animated)
      const legOffset = Math.sin(dog.animationFrame * Math.PI / 2) * 3;
      ctx.fillRect(dog.position.x + 3, dog.position.y + 15, 4, 9 + legOffset);
      ctx.fillRect(dog.position.x + 12, dog.position.y + 15, 4, 9 - legOffset);
      ctx.fillRect(dog.position.x + 18, dog.position.y + 15, 4, 9 + legOffset);
      ctx.fillRect(dog.position.x + 24, dog.position.y + 15, 4, 9 - legOffset);

      // Eye (white dot)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        dog.facingRight ? dog.position.x + 30 : dog.position.x - 3,
        dog.position.y,
        3,
        3
      );

      ctx.restore();
    }

    // Draw sushi on top of everything (including patterns)
    if (gameState.sushi && gameState.sushi.isActive) {
      const sushi = gameState.sushi;

      // Floating animation
      const floatY = Math.sin(sushi.animationFrame) * 3;

      // Draw pixelated sushi on the main canvas (on top)
      ctx.fillStyle = '#ffffff'; // Rice (white)
      ctx.fillRect(sushi.position.x, sushi.position.y + floatY, 24, 16);

      // Salmon (orange/pink)
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(sushi.position.x + 2, sushi.position.y + floatY - 4, 20, 6);

      // Nori stripe (dark green)
      ctx.fillStyle = '#2d4a2d';
      ctx.fillRect(sushi.position.x + 10, sushi.position.y + floatY - 4, 4, 20);

      // Sparkle effect
      ctx.fillStyle = '#ffff00';
      const sparkleOffset = Math.floor(sushi.animationFrame * 2) % 3;
      ctx.fillRect(sushi.position.x + sparkleOffset * 8, sushi.position.y + floatY - 8, 2, 2);
    }

  }, [gameState]);

  const handleMouseDown = () => {
    isDrawing.current = true;
    lastRakePosition.current = { ...gameState.rakePosition };
    onMouseDown();
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    lastRakePosition.current = { x: -1, y: -1 };
    onMouseUp();
  };

  const handleMouseLeave = () => {
    isDrawing.current = false;
    lastRakePosition.current = { x: -1, y: -1 };
    onMouseUp();
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const touchEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      currentTarget: e.currentTarget
    } as any;
    onMouseMove(touchEvent);
    handleMouseDown();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    onMouseMove(e);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleMouseUp();
  };

  return (
    <div
      className="game-canvas-container"
      style={{
        cursor: window.innerWidth > 768 ? 'none' : 'default',
        width: GAME_CONFIG.CANVAS_WIDTH,
        height: GAME_CONFIG.CANVAS_HEIGHT,
        position: 'relative',
        touchAction: 'none'
      }}
      onMouseMove={onMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={backgroundCanvasRef}
        width={GAME_CONFIG.CANVAS_WIDTH}
        height={GAME_CONFIG.CANVAS_HEIGHT}
        style={{
          position: 'relative',
          imageRendering: 'pixelated',
        }}
      />
      <canvas
        ref={patternCanvasRef}
        width={GAME_CONFIG.CANVAS_WIDTH}
        height={GAME_CONFIG.CANVAS_HEIGHT}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          imageRendering: 'pixelated',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};