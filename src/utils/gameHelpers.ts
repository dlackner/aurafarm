import { GameObject, Position, RakePattern } from '../types/game';

// Responsive canvas sizing
const getCanvasSize = () => {
  const maxWidth = Math.min(window.innerWidth - 40, 800);
  const maxHeight = Math.min(window.innerHeight - 200, 600);

  // Mobile portrait mode
  if (window.innerWidth < 768) {
    return {
      width: window.innerWidth - 20,
      height: Math.min(window.innerHeight - 150, 600)
    };
  }

  return { width: maxWidth, height: maxHeight };
};

const canvasSize = getCanvasSize();

export const GAME_CONFIG = {
  CANVAS_WIDTH: canvasSize.width,
  CANVAS_HEIGHT: canvasSize.height,
  TILE_SIZE: 8,
  RAKE_SIZE: 24,
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
  const objectCount = Math.floor(Math.random() * 4) + 5;

  for (let i = 0; i < objectCount; i++) {
    const type = (['rock', 'tree', 'pond'] as const)[Math.floor(Math.random() * 3)];
    const size = type === 'pond' ? { width: 64, height: 48 } :
                 type === 'tree' ? { width: 32, height: 40 } :
                 { width: 24, height: 24 };

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