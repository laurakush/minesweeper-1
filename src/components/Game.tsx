import React, { useState, useEffect, useCallback } from 'react';
import { MineField } from './MineField';
import { Timer } from './Timer';
import { game } from '../gameLogic/game';
import { Game as GameType, Mine } from '../gameLogic/gameDomain';

interface GameProps {
  initialRows: number;
  initialCols: number;
  initialMines: number;
  initialDifficulty: DifficultyLevel;
}

// Define difficulty levels with enum for type safety
enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

// Game difficulty presets
const DIFFICULTY = {
  [DifficultyLevel.EASY]: { rows: 9, cols: 9, mines: 10 },
  [DifficultyLevel.MEDIUM]: { rows: 16, cols: 16, mines: 40 },
  [DifficultyLevel.HARD]: { rows: 16, cols: 30, mines: 99 }
};

const Game: React.FC<GameProps> = ({ initialRows, initialCols, initialMines }) => {
  const [gameState, setGameState] = useState<GameType>(
    game.newGame(initialRows, initialCols, initialMines)
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [flaggedCount, setFlaggedCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [rows, setRows] = useState<number>(initialRows);
  const [cols, setColumns] = useState<number>(initialCols);
  const [mines, setMines] = useState<number>(initialMines);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(DifficultyLevel.EASY);

  // Timer logic
  useEffect(() => {
    if (isCompleted || gameState.isOver) return;

    const timerId = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isCompleted, gameState.isOver]);

  // Check game status after each move
  useEffect(() => {
    const completed = game.isCompleted(gameState);
    setIsCompleted(completed);
    setFlaggedCount(game.countFlagged(gameState));
  }, [gameState]);

  // Left click handler - reveal cell
  const handleLeftClick = useCallback((field: Mine) => {
    if (isCompleted || gameState.isOver) return;
    
    setGameState(prev => game.openMine(prev, field));
  }, [isCompleted, gameState.isOver]);

  // Right click handler - toggle flag
  const handleRightClick = useCallback((field: Mine, e: React.MouseEvent) => {
    if (isCompleted || gameState.isOver) return;
    
    // Prevent context menu from showing
    e.preventDefault();
    
    setGameState(prev => game.markMine(prev, field));
  }, [isCompleted, gameState.isOver]);

  const startNewGame = useCallback((difficulty: DifficultyLevel) => {
    const config = DIFFICULTY[difficulty];
    const { rows: newRows, cols: newCols, mines: newMines } = config;
    
    setCurrentDifficulty(difficulty);
    setRows(newRows);
    setColumns(newCols);
    setMines(newMines);
    setGameState(game.newGame(newRows, newCols, newMines));
    setIsCompleted(false);
    setFlaggedCount(0);
    setElapsedSeconds(0);
  }, []);

  return (
    <div>
      <header className="App-header">
        <span className="status"> Flags: {flaggedCount}/{gameState.totBombs} </span><h1 className="game-title">Minesweeper</h1>
      </header>
      <div className="game">
        <div className="menu">
          <ul className="level-menu">
            <li 
              className={currentDifficulty === DifficultyLevel.EASY ? 'active' : ''} 
              onClick={() => startNewGame(DifficultyLevel.EASY)}
            >
              Easy (9×9, 10 mines)
            </li>
            <li 
              className={currentDifficulty === DifficultyLevel.MEDIUM ? 'active' : ''} 
              onClick={() => startNewGame(DifficultyLevel.MEDIUM)}
            >
              Medium (16×16, 40 mines)
            </li>
            <li 
              className={currentDifficulty === DifficultyLevel.HARD ? 'active' : ''} 
              onClick={() => startNewGame(DifficultyLevel.HARD)}
            >
              Hard (16×30, 99 mines)
            </li>
          </ul>
        </div>
        <MineField
          game={gameState}
          onLeftClick={handleLeftClick}
          onRightClick={handleRightClick}
        />
        <Timer secPassed={elapsedSeconds} />
        <div className="status">
          Completed: {isCompleted ? 'YES' : 'NO'}
          {gameState.isOver && ' - Game Over!'}
        </div>
        <div className="help">
          <h3>How to play</h3>
          <ol>
            <li>Left Click to reveal a cell</li>
            <li>Right Click to place/remove a flag</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Game;