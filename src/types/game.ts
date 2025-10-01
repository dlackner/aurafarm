export interface Position {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Position;
  width: number;
  height: number;
  type: 'rock' | 'tree' | 'pond';
}

export interface RakePattern {
  position: Position;
  opacity: number;
  age: number;
}

export interface Dog {
  position: Position;
  velocity: { x: number; y: number };
  isActive: boolean;
  animationFrame: number;
  facingRight: boolean;
}

export interface PawPrint {
  position: Position;
  age: number;
}

export interface Sushi {
  position: Position;
  isActive: boolean;
  animationFrame: number;
}

export type PlacementMode = 'none' | 'rock' | 'tree' | 'pond';

export type GamePhase = 'menu' | 'playing' | 'victory' | 'gameOver';

export interface LeaderboardEntry {
  name: string;
  time: number;
  coverage: number;
  date: string;
}

export interface GameState {
  rakePosition: Position;
  aura: number;
  maxAura: number;
  gardenObjects: GameObject[];
  rakePatterns: RakePattern[];
  isGameOver: boolean;
  sandResetProgress: number;
  isColliding: boolean;
  lastCollisionTime: number;
  dog: Dog | null;
  pawPrints: PawPrint[];
  lastDogSpawn: number;
  sushi: Sushi | null;
  lastSushiSpawn: number;
  placementMode: PlacementMode;
  placementsAvailable: number;
  gamePhase: GamePhase;
  startTime: number;
  currentTime: number;
  timeLimit: number; // in seconds
  coverage: number; // percentage 0-100
  coveredTiles: Set<string>; // track which tiles have been raked
}

export interface InputState {
  mousePosition: Position;
  isMouseDown: boolean;
}