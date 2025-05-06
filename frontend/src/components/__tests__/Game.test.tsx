import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Game from '../Game';
import { DifficultyLevel } from '../GameControls';
import { game } from '../../gameLogic/game';
import { authAPI, gameStatsAPI } from '../../api/api';

// Mock the API modules
jest.mock('../../api/api', () => ({
  authAPI: {
    isAuthenticated: jest.fn().mockReturnValue(true),
    getCurrentUser: jest.fn(),
    logout: jest.fn()
  },
  gameStatsAPI: {
    saveGameStats: jest.fn().mockResolvedValue({ success: true })
  }
}));

// Mock the game module
jest.mock('../../gameLogic/game', () => ({
  game: {
    newGame: jest.fn(),
    openMine: jest.fn(),
    markMine: jest.fn(),
    countFlagged: jest.fn().mockReturnValue(0),
    isCompleted: jest.fn()
  }
}));

describe('Game Component', () => {
  // Prepare mock return values
  const mockGameState = {
    state: [
      [
        { pos: {x: 0, y: 0}, bombs: 0, isFlagged: false, isOpened: false },
        { pos: {x: 0, y: 1}, bombs: 1, isFlagged: false, isOpened: false }
      ],
      [
        { pos: {x: 1, y: 0}, bombs: 1, isFlagged: false, isOpened: false },
        { pos: {x: 1, y: 1}, bombs: -1, isFlagged: false, isOpened: false }
      ]
    ],
    isOver: false,
    totBombs: 1,
    openedCells: 0,
    flaggedCells: 0,
    isWon: false
  };
  
  // Set up mocks
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the game.newGame function to return our test game
    (game.newGame as jest.Mock).mockReturnValue(mockGameState);
    
    // Mock game.openMine to return a modified state
    (game.openMine as jest.Mock).mockImplementation((game, field) => {
      // Return a copy with the clicked cell opened
      const newState = JSON.parse(JSON.stringify(game));
      const { x, y } = field.pos;
      newState.state[x][y].isOpened = true;
      newState.openedCells += 1;
      return newState;
    });
    
    // Mock game.markMine to return a modified state
    (game.markMine as jest.Mock).mockImplementation((game, field) => {
      // Return a copy with the clicked cell flagged
      const newState = JSON.parse(JSON.stringify(game));
      const { x, y } = field.pos;
      newState.state[x][y].isFlagged = !newState.state[x][y].isFlagged;
      newState.flaggedCells = newState.state[x][y].isFlagged ? 
        newState.flaggedCells + 1 : 
        newState.flaggedCells - 1;
      return newState;
    });
  });
  
  it('renders the game with default props', () => {
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Check if game title is rendered
    expect(screen.getByText('Minesweeper')).toBeInTheDocument();
    
    // Check if difficulty buttons are rendered
    expect(screen.getByText(/Easy/)).toBeInTheDocument();
    expect(screen.getByText(/Medium/)).toBeInTheDocument();
    expect(screen.getByText(/Hard/)).toBeInTheDocument();
    
    // Verify game was initialized
    expect(game.newGame).toHaveBeenCalledWith(9, 9, 10);
  });
  
  it('handles left click correctly', () => {
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Find all cells and click the first one
    const cells = screen.getAllByRole('button').filter(
      button => button.className.includes('mine-button')
    );
    
    fireEvent.click(cells[0]);
    
    // Check if openMine was called
    expect(game.openMine).toHaveBeenCalledTimes(1);
  });
  
  it('handles right click correctly', () => {
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Find all cells and right-click the first one
    const cells = screen.getAllByRole('button').filter(
      button => button.className.includes('mine-button')
    );
    
    fireEvent.contextMenu(cells[0]);
    
    // Check if markMine was called
    expect(game.markMine).toHaveBeenCalledTimes(1);
  });
  
  it('changes difficulty when a difficulty button is clicked', () => {
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Find and click the "Medium" difficulty button
    const mediumButton = screen.getByText(/Medium/);
    fireEvent.click(mediumButton);
    
    // Check if a new game was created with medium difficulty (16x16, 40 mines)
    expect(game.newGame).toHaveBeenCalledWith(16, 16, 40);
  });
  
  it('shows game over message when game is lost', () => {
    // Mock a game that's over (lost)
    const lostGameState = {
      ...mockGameState,
      isOver: true,
      isWon: false
    };
    
    (game.newGame as jest.Mock).mockReturnValue(lostGameState);
    
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Check for game over message
    expect(screen.getByText(/Game Over/)).toBeInTheDocument();
    expect(screen.getByText(/Better luck next time/)).toBeInTheDocument();
    
    // Check for play again button
    expect(screen.getByText(/Play Again/)).toBeInTheDocument();
  });
  
  it('shows win message when game is won', () => {
    // Mock a game that's over (won)
    const wonGameState = {
      ...mockGameState,
      isOver: true,
      isWon: true
    };
    
    (game.newGame as jest.Mock).mockReturnValue(wonGameState);
    
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Check for win message
    expect(screen.getByText(/You Win/)).toBeInTheDocument();
    
    // Check for play again button
    expect(screen.getByText(/Play Again/)).toBeInTheDocument();
  });
  
  it('resets the game when play again button is clicked', () => {
    // Mock a game that's over (lost)
    const gameOverState = {
      ...mockGameState,
      isOver: true,
      isWon: false
    };
    
    (game.newGame as jest.Mock).mockReturnValue(gameOverState);
    
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Find and click the play again button
    const playAgainButton = screen.getByText(/Play Again/);
    fireEvent.click(playAgainButton);
    
    // Check if a new game was created
    expect(game.newGame).toHaveBeenCalledTimes(2);
  });
  
  it('updates the timer while game is active', () => {
    // Mock timers
    jest.useFakeTimers();
    
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Initial timer should be 00:00
    expect(screen.getByText('00:00')).toBeInTheDocument();
    
    // Advance timer by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Timer should now show 00:05
    expect(screen.getByText('00:05')).toBeInTheDocument();
    
    // Cleanup
    jest.useRealTimers();
  });
  
  it('saves game stats when game is over', () => {
    // Mock a game that's over
    const gameOverState = {
      ...mockGameState,
      isOver: true,
      isWon: true
    };
    
    (game.newGame as jest.Mock).mockReturnValue(gameOverState);
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    // Check that saveGameStats was called
    expect(gameStatsAPI.saveGameStats).toHaveBeenCalledTimes(1);
    expect(gameStatsAPI.saveGameStats).toHaveBeenCalledWith(
      expect.objectContaining({
        difficulty: DifficultyLevel.EASY,
        is_win: true
      })
    );
  });
});