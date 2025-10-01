import React from 'react';
import { LeaderboardEntry } from '../types/game';

interface GameMenuProps {
  onStartGame: () => void;
  leaderboard: LeaderboardEntry[];
  coverage?: number;
  time?: number;
  isVictory?: boolean;
  playerName?: string;
  onPlayerNameChange?: (name: string) => void;
  onSubmitScore?: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  onStartGame,
  leaderboard,
  coverage,
  time,
  isVictory,
  playerName,
  onPlayerNameChange,
  onSubmitScore,
}) => {
  return (
    <div className="game-menu">
      {isVictory !== undefined && (
        isVictory ? (
          <div className="victory-screen">
            <h2>Garden Complete!</h2>
            <p>Coverage: {coverage?.toFixed(1)}%</p>
            <p>Time: {time}s</p>
            <div className="name-input">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName || ''}
                onChange={(e) => onPlayerNameChange?.(e.target.value)}
                maxLength={20}
              />
              <button onClick={onSubmitScore}>Submit Score</button>
            </div>
          </div>
        ) : (
          <div className="game-over-screen">
            <h2>Time's Up!</h2>
            <p>Coverage: {coverage?.toFixed(1)}%</p>
            <p>You needed 95% to complete the garden</p>
          </div>
        )
      )}

      <div className="menu-content">
        <h2>Time Challenge</h2>
        <p>Rake the entire garden before time runs out!</p>
        <button className="start-button" onClick={onStartGame}>
          Start Game
        </button>

        <div className="leaderboard">
          <h3>Leaderboard</h3>
          {leaderboard.length === 0 ? (
            <p className="no-scores">No scores yet. Be the first!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Coverage</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index}>
                    <td>#{index + 1}</td>
                    <td>{entry.name}</td>
                    <td>{entry.coverage.toFixed(1)}%</td>
                    <td>{entry.time}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};