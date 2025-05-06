import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Game from '../Game';
import { DifficultyLevel } from '../GameControls';
import { game } from '../../gameLogic/game';
import { authAPI, gameStatsAPI } from '../../api/api';
import { act } from 'react';

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
  
  beforeEach(() => {
    jest.clearAllMocks();
    (game.newGame as jest.Mock).mockReturnValue(mockGameState);
    (game.openMine as jest.Mock).mockImplementation((game, field) => {
      const newState = JSON.parse(JSON.stringify(game));
      const { x, y } = field.pos;
      newState.state[x][y].isOpened = true;
      newState.openedCells += 1;
      return newState;
    });
    (game.markMine as jest.Mock).mockImplementation((game, field) => {
      const newState = JSON.parse(JSON.stringify(game));
      const { x, y } = field.pos;
      newState.state[x][y].isFlagged = !newState.state[x][y].isFlagged;
      newState.flaggedCells = newState.state[x][y].isFlagged ? 
        newState.flaggedCells + 1 : 
        newState.flaggedCells - 1;
      return newState;
    });
    (gameStatsAPI.saveGameStats as jest.Mock).mockResolvedValue({ success: true });
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
    
    expect(screen.getByText('Minesweeper')).toBeInTheDocument();
    expect(screen.getByText(/Easy/)).toBeInTheDocument();
    expect(screen.getByText(/Medium/)).toBeInTheDocument();
    expect(screen.getByText(/Hard/)).toBeInTheDocument();
    
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
    
    const cells = screen.getAllByRole('button').filter(
      button => button.className.includes('mine-button')
    );
    
    fireEvent.click(cells[0]);
    
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
    
    const cells = screen.getAllByRole('button').filter(
      button => button.className.includes('mine-button')
    );
    
    fireEvent.contextMenu(cells[0]);
    
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
    
    // Clear mock before interaction
    (game.newGame as jest.Mock).mockClear();
    
    const mediumButton = screen.getByText(/Medium/);
    fireEvent.click(mediumButton);
    
    expect(game.newGame).toHaveBeenCalledWith(16, 16, 40);
  });
  
  it('resets the game when play again button is clicked', async () => {
    const gameOverState = {
      ...mockGameState,
      isOver: true,
      isWon: false
    };
    
    (game.newGame as jest.Mock)
      .mockReturnValueOnce(gameOverState) 
      .mockReturnValueOnce(mockGameState); 
    
    render(
      <Game 
        initialRows={9} 
        initialCols={9} 
        initialMines={10} 
        initialDifficulty={DifficultyLevel.EASY} 
      />
    );
    
    expect(screen.getByText(/Game Over/)).toBeInTheDocument();

    const callCountBeforeClick = (game.newGame as jest.Mock).mock.calls.length;
    
    (game.newGame as jest.Mock).mockClear();
    
    const playAgainButton = screen.getByText(/Play Again/);
    await act(async () => {
      fireEvent.click(playAgainButton);
    });
    
    expect((game.newGame as jest.Mock).mock.calls.length).toBe(callCountBeforeClick + 1);
  });
});