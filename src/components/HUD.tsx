import React from 'react';

interface HUDProps {
  aura: number;
  maxAura: number;
  isGameOver: boolean;
  onRestart: () => void;
  timeRemaining?: number;
  coverage?: number;
}

export const HUD: React.FC<HUDProps> = ({ aura, maxAura, isGameOver, onRestart, timeRemaining, coverage }) => {
  return (
    <div className="hud">
      {timeRemaining !== undefined && (
        <div className="timer-container">
          <div className="timer-label">TIME</div>
          <div className={`timer-value ${timeRemaining < 10 ? 'urgent' : ''}`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}

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

      {coverage !== undefined && (
        <div className="coverage-container">
          <div className="coverage-label">COVERAGE</div>
          <div className="coverage-bar">
            <div
              className="coverage-fill"
              style={{ width: `${coverage}%` }}
            />
          </div>
          <div className="coverage-value">{coverage.toFixed(1)}%</div>
        </div>
      )}

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