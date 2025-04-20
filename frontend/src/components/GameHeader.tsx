import React from 'react';

interface GameHeaderProps {
  flagCount: number;
  totalBombs: number;
  elapsedTime: number;
  formattedTime: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ 
  flagCount, 
  totalBombs, 
  formattedTime 
}) => {
  return (
    <header className="App-header">
      <div className="header-content">
        <div className="flag-counter">
          <span className="flag-icon">🚩</span> {flagCount}/{totalBombs}
        </div>
        <h1 className="game-title">Minesweeper</h1>
        <div className="timer-display">{formattedTime}</div>
      </div>
    </header>
  );
};