import React from 'react';

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

// Game difficulty presets
export const DIFFICULTY = {
  [DifficultyLevel.EASY]: { rows: 9, cols: 9, mines: 10 },
  [DifficultyLevel.MEDIUM]: { rows: 16, cols: 16, mines: 40 },
  [DifficultyLevel.HARD]: { rows: 16, cols: 30, mines: 99 }
};

interface GameControlsProps {
  currentDifficulty: DifficultyLevel;
  isGameOver: boolean;
  onNewGame: (difficulty: DifficultyLevel) => void;
  onReset: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  currentDifficulty,
  isGameOver,
  onNewGame,
  onReset
}) => {
  return (
    <>
      <div className="menu">
        <ul className="level-menu">
          <li 
            className={currentDifficulty === DifficultyLevel.EASY ? 'active' : ''} 
            onClick={() => onNewGame(DifficultyLevel.EASY)}
          >
            Easy (9×9, 10 mines)
          </li>
          <li 
            className={currentDifficulty === DifficultyLevel.MEDIUM ? 'active' : ''} 
            onClick={() => onNewGame(DifficultyLevel.MEDIUM)}
          >
            Medium (16×16, 40 mines)
          </li>
          <li 
            className={currentDifficulty === DifficultyLevel.HARD ? 'active' : ''} 
            onClick={() => onNewGame(DifficultyLevel.HARD)}
          >
            Hard (16×30, 99 mines)
          </li>
        </ul>
      </div>
      
      {isGameOver && (
        <button className="reset-button" onClick={onReset}>
          Play Again
        </button>
      )}
    </>
  );
};