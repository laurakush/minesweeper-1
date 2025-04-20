import React, { useState, useEffect, useCallback } from 'react';
import { MineField } from './MineField';
import { game } from '../gameLogic/game';
import { Game as GameType, Mine } from '../gameLogic/gameDomain';
import { time } from '../gameLogic/time';
import { GameControls, DifficultyLevel, DIFFICULTY } from './GameControls';
import { GameHeader } from './GameHeader';
import { gameStatsAPI } from '../api/api';
import { authAPI } from '../api/api';
import '../styles/Game.css';

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
  const [flaggedCount, setFlaggedCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [savedGame, setSavedGame] = useState<boolean>(false);
  
  // Configuration state
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(initialDifficulty);

  // Timer logic
  useEffect(() => {
    // Stop timer if game is over (win or loss)
    if (gameState.isOver) return;

    const timerId = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameState]);

  // Update state after each move
  useEffect(() => {
    setFlaggedCount(game.countFlagged(gameState));
    
    // If game just ended, save the stats
    if (gameState.isOver && !savedGame) {
      saveGameStats();
    }
  }, [gameState]);

  // Save game stats to backend when game ends
  const saveGameStats = useCallback(() => {
    // Only save if user is authenticated
    if (authAPI.isAuthenticated() && gameState.isOver && !savedGame) {
      const gameData = {
        difficulty: currentDifficulty,
        time_taken: elapsedSeconds,
        is_win: gameState.isWon,
        mines_flagged: flaggedCount,
        cells_opened: gameState.openedCells
      };
      
      gameStatsAPI.saveGameStats(gameData)
        .then(() => {
          console.log('Game stats saved successfully');
          setSavedGame(true);
        })
        .catch(error => {
          console.error('Failed to save game stats:', error);
        });
    }
  }, [gameState, currentDifficulty, elapsedSeconds, flaggedCount, savedGame]);

  // Left click handler - reveal cell
  const handleLeftClick = useCallback((field: Mine) => {
    // Skip if game is already over
    if (gameState.isOver) return;
    
    setGameState(prev => game.openMine(prev, field));
  }, [gameState]);

  // Right click handler - toggle flag
  const handleRightClick = useCallback((field: Mine, e: React.MouseEvent) => {
    // Skip if game is already over
    if (gameState.isOver) return;
    
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
    setFlaggedCount(0);
    setElapsedSeconds(0);
    setSavedGame(false);
  }, []);

  // Reset the game with current difficulty
  const resetGame = useCallback(() => {
    startNewGame(currentDifficulty);
  }, [currentDifficulty, startNewGame]);

  // Format the time for display
  const formattedTime = time.timer(elapsedSeconds);

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
          isGameOver={gameState.isOver}
          onNewGame={startNewGame}
          onReset={resetGame}
        />
        
        <MineField
          game={gameState}
          onLeftClick={handleLeftClick}
          onRightClick={handleRightClick}
        />

        {gameState.isOver && (
          <div className={`game-result ${gameState.isWon ? 'win' : 'lose'}`}>
            {gameState.isWon ? 
              <h2>🎉 You Win! 🎉</h2> : 
              <h2>💥 Game Over! 💥</h2>
            }
            <p>{gameState.isWon ? 
                 `You completed the game in ${formattedTime}!` : 
                 'Better luck next time!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;