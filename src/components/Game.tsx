import React, { useState, useEffect, useCallback } from 'react';
import { MineField } from './MineField';
import { game } from '../gameLogic/game';
import { Game as GameType, Mine } from '../gameLogic/gameDomain';
import { time } from '../util/time';
import { GameControls, DifficultyLevel, DIFFICULTY } from './GameControls';
import { GameHeader } from './GameHeader';

interface GameProps {
  initialRows: number;
  initialCols: number;
  initialMines: number;
  initialDifficulty: DifficultyLevel;
}

const Game: React.FC<GameProps> = ({ 
  initialRows, 
  initialCols, 
  initialMines,
  initialDifficulty 
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameType>(
    game.newGame(initialRows, initialCols, initialMines)
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [flaggedCount, setFlaggedCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Configuration state
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(initialDifficulty);

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

  // Start a new game with a specific difficulty
  const startNewGame = useCallback((difficulty: DifficultyLevel) => {
    const config = DIFFICULTY[difficulty];
    const { rows: newRows, cols: newCols, mines: newMines } = config;
    
    setCurrentDifficulty(difficulty);
    setGameState(game.newGame(newRows, newCols, newMines));
    setIsCompleted(false);
    setFlaggedCount(0);
    setElapsedSeconds(0);
  }, []);

  // Reset the game with current difficulty
  const resetGame = useCallback(() => {
    startNewGame(currentDifficulty);
  }, [currentDifficulty, startNewGame]);

  // Format the time for display
  const formattedTime = time.timer(elapsedSeconds);
  
  // Check if game is over (either won or lost)
  const isGameOver = isCompleted || gameState.isOver;

  return (
    <div>
      <GameHeader
        flagCount={flaggedCount}
        totalBombs={gameState.totBombs}
        elapsedTime={elapsedSeconds}
        formattedTime={formattedTime}
      />
      
      <div className="game">
        <GameControls
          currentDifficulty={currentDifficulty}
          isGameOver={isGameOver}
          onNewGame={startNewGame}
          onReset={resetGame}
        />
        
        <MineField
          game={gameState}
          onLeftClick={handleLeftClick}
          onRightClick={handleRightClick}
        />

      </div>
    </div>
  );
};

export default Game;