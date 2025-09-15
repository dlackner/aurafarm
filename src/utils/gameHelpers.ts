import { GameObject, Position, RakePattern } from '../types/game';

// Responsive canvas sizing - smaller, more focused garden
const getCanvasSize = () => {
  const maxWidth = Math.min(window.innerWidth - 40, 500);  // Reduced from 800
  const maxHeight = Math.min(window.innerHeight - 200, 400);  // Reduced from 600

  // Mobile portrait mode
  if (window.innerWidth < 768) {
    return {
      width: Math.min(window.innerWidth - 20, 400),
      height: Math.min(window.innerHeight - 150, 350)
    };
  }

  return { width: maxWidth, height: maxHeight };
};

const canvasSize = getCanvasSize();

export const GAME_CONFIG = {
  CANVAS_WIDTH: canvasSize.width,
  CANVAS_HEIGHT: canvasSize.height,
  TILE_SIZE: 12,  // Bigger tiles (was 8)
  RAKE_SIZE: 36,  // Bigger rake (was 24)
  MAX_PATTERNS: 10000,
  PATTERN_FADE_SPEED: 0,  // No fade - patterns stay forever
  SAND_RESET_SPEED: 0,  // No automatic reset
  AURA_LOSS: 10,
};

export const checkCollision = (
  rakePos: Position,
  rakeSize: number,
  object: GameObject
): boolean => {
  return (
    rakePos.x < object.position.x + object.width &&
    rakePos.x + rakeSize > object.position.x &&
    rakePos.y < object.position.y + object.height &&
    rakePos.y + rakeSize > object.position.y
  );
};

export const generateGardenObjects = (): GameObject[] => {
  const objects: GameObject[] = [];
  const objectCount = Math.floor(Math.random() * 2) + 3;  // 3-4 objects (fewer for smaller garden)

  for (let i = 0; i < objectCount; i++) {
    const type = (['rock', 'tree', 'pond'] as const)[Math.floor(Math.random() * 3)];
    // Scaled up obstacles (50% bigger)
    const size = type === 'pond' ? { width: 96, height: 72 } :
                 type === 'tree' ? { width: 48, height: 60 } :
                 { width: 36, height: 36 };

    objects.push({
      id: `object-${i}`,
      position: {
        x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - size.width),
        y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - size.height),
      },
      ...size,
      type,
    });
  }

  return objects;
};

export const createRakePattern = (position: Position): RakePattern => ({
  position: { ...position },
  opacity: 1,
  age: 0,
});

export const updatePatterns = (patterns: RakePattern[]): RakePattern[] => {
  // Since fade speed is 0, patterns should never disappear
  return patterns
    .map(pattern => ({
      ...pattern,
      opacity: 1,  // Keep opacity at 1 always
      age: pattern.age + 1,
    }))
    .slice(-GAME_CONFIG.MAX_PATTERNS);
};