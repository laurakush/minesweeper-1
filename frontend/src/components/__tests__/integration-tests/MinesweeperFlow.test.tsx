import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../../App';
import { authAPI, gameStatsAPI } from '../../../api/api';
import { game } from '../../../gameLogic/game';
import { act } from 'react';

jest.mock('../../../api/api', () => ({
  authAPI: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn().mockResolvedValue({ username: 'testuser' }),
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  },
  gameStatsAPI: {
    saveGameStats: jest.fn().mockResolvedValue({ success: true }),
    getStatsSummary: jest.fn(),
    getUserGameStats: jest.fn()
  }
}));

jest.mock('../../../gameLogic/game', () => ({
  game: {
    newGame: jest.fn(),
    openMine: jest.fn(),
    markMine: jest.fn(),
    countFlagged: jest.fn().mockReturnValue(0),
    isCompleted: jest.fn()
  }
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  writable: true
});

describe('Minesweeper App Integration Flow', () => {
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
  
  const mockSummary = {
    total_games: 5,
    wins: 3,
    win_rate: 60.0,
    best_times: {
      EASY: 30,
      MEDIUM: 90,
      HARD: null
    }
  };
  
  const mockGameHistory = {
    game_stats: [
      {
        id: 1,
        difficulty: 'EASY',
        time_taken: 30,
        is_win: true,
        mines_flagged: 8,
        cells_opened: 71,
        played_at: '2023-04-20T14:30:00Z'
      }
    ]
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(false);
    (game.newGame as jest.Mock).mockReturnValue(mockGameState);
    (gameStatsAPI.getStatsSummary as jest.Mock).mockResolvedValue(mockSummary);
    (gameStatsAPI.getUserGameStats as jest.Mock).mockResolvedValue(mockGameHistory);
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
    (gameStatsAPI.saveGameStats as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ success: true });
    });
  });
  
  test('User login and gameplay flow', async () => {
    const { rerender } = render(<App />);
    
    expect(screen.getByRole('heading', { level: 2, name: /Login/i })).toBeInTheDocument();
    
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    (authAPI.login as jest.Mock).mockResolvedValue({ 
      user: { username: 'testuser' }, 
      access_token: 'token123'
    });
    
    const submitButton = screen.getByRole('button', { type: 'submit' });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });
    
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    await act(async () => {
      rerender(<App />);
    });
  });
});