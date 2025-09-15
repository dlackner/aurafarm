import React from 'react';

interface HUDProps {
  aura: number;
  maxAura: number;
  isGameOver: boolean;
  onRestart: () => void;
}

export const HUD: React.FC<HUDProps> = ({ aura, maxAura, isGameOver, onRestart }) => {
  return (
    <div className="hud">
      <div className="aura-container">
        <div className="aura-label">AURA</div>
        <div className="aura-bar">
          <div
            className="aura-fill"
            style={{ width: `${(aura / maxAura) * 100}%` }}
          />
        </div>
        <div className="aura-value">{aura}/{maxAura}</div>
      </div>

      {isGameOver && (
        <div className="game-over">
          <h2>Your aura has faded...</h2>
          <button onClick={onRestart} className="restart-button">
            Find Inner Peace Again
          </button>
        </div>
      )}
    </div>
  );
};