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

  // Function to check for win state by examining the game board directly
  const checkWin = (gameState: GameType): boolean => {
    // If a mine has exploded, it's not a win
    if (gameState.isOver) {
      return false;
    }
    
    // Check if all non-mine cells are opened
    for (let i = 0; i < gameState.state.length; i++) {
      for (let j = 0; j < gameState.state[i].length; j++) {
        const cell = gameState.state[i][j];
        
        // If we find a non-mine cell that's not opened, game is not won
        if (cell.bombs !== -1 && !cell.isOpened) {
          return false;
        }
      }
    }
    
    // All non-mine cells are opened and no mine exploded
    return true;
  };

  // Timer logic
  useEffect(() => {
    // Use our own win check instead of isCompleted
    const winState = checkWin(gameState);
    if (winState || gameState.isOver) return;

    const timerId = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameState]);

  // Check game status after each move
  useEffect(() => {
    const completed = game.isCompleted(gameState);
    setIsCompleted(completed);
    setFlaggedCount(game.countFlagged(gameState));
  }, [gameState]);

  // Left click handler - reveal cell
  const handleLeftClick = useCallback((field: Mine) => {
    // Use our own win check instead of isCompleted
    const winState = checkWin(gameState);
    if (winState || gameState.isOver) return;
    
    setGameState(prev => game.openMine(prev, field));
  }, [gameState]);

  // Right click handler - toggle flag
  const handleRightClick = useCallback((field: Mine, e: React.MouseEvent) => {
    // Use our own win check instead of isCompleted
    const winState = checkWin(gameState);
    if (winState || gameState.isOver) return;
    
    // Prevent context menu from showing
    e.preventDefault();
    
    setGameState(prev => game.markMine(prev, field));
  }, [gameState]);

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
  
  // Use our own win detection instead of relying on isCompleted
  const isWin = checkWin(gameState);
  const isGameOver = isWin || gameState.isOver;

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

        {isGameOver && (
          <div className={`game-result ${isWin ? 'win' : 'lose'}`}>
            {isWin ? 
              <h2>🎉 You Win! 🎉</h2> : 
              <h2>💥 Game Over! 💥</h2>
            }
            <p>{isWin ? `You completed the game in ${formattedTime}!` : 'Better luck next time!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;