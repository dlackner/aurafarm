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
}

export interface InputState {
  mousePosition: Position;
  isMouseDown: boolean;
}