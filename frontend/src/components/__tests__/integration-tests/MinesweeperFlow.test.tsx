import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../../../App';
import { authAPI, gameStatsAPI } from '../../../api/api';
import { game } from '../../../gameLogic/game';

// Mock the API modules
jest.mock('../../../api/api', () => ({
  authAPI: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
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

// Mock the game module
jest.mock('../../../gameLogic/game', () => ({
  game: {
    newGame: jest.fn(),
    openMine: jest.fn(),
    markMine: jest.fn(),
    countFlagged: jest.fn().mockReturnValue(0),
    isCompleted: jest.fn()
  }
}));

describe('Minesweeper App Integration Flow', () => {
  // Prepare mock game state
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
  
  // Mock stats data
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
    
    // Default mock implementations
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(false);
    (game.newGame as jest.Mock).mockReturnValue(mockGameState);
    (gameStatsAPI.getStatsSummary as jest.Mock).mockResolvedValue(mockSummary);
    (gameStatsAPI.getUserGameStats as jest.Mock).mockResolvedValue(mockGameHistory);
    
    // Mock game.openMine and game.markMine similar to Game.test.tsx
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
  });
  
  test('User login and gameplay flow', async () => {
    // Render the app when user is not logged in
    render(<App />);
    
    // Verify login screen appears
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Fill in login credentials
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Mock successful login
    (authAPI.login as jest.Mock).mockResolvedValue({ 
      user: { username: 'testuser' }, 
      access_token: 'token123'
    });
    
    // Submit login
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Wait for login process to complete
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });
    
    // After login success
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    // Re-render App after login
    // In a real-world scenario, the App would re-render automatically
    // Here we simulate that by re-rendering the component
    const { rerender } = render(<App />);
    
    // Wait for game to appear
    await waitFor(() => {
      expect(screen.getByText('Minesweeper')).toBeInTheDocument();
    });
    
    // Check navigation options appear
    expect(screen.getByText('Play Game')).toBeInTheDocument();
    expect(screen.getByText('My Stats')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    
    // Verify game board is rendered
    expect(screen.getAllByRole('button').some(
      button => button.className.includes('mine-button')
    )).toBe(true);
    
    // Simulate clicking a game cell
    const gameCells = screen.getAllByRole('button').filter(
      button => button.className.includes('mine-button')
    );
    fireEvent.click(gameCells[0]);
    
    expect(game.openMine).toHaveBeenCalledTimes(1);
    
    // Switch to stats view
    fireEvent.click(screen.getByText('My Stats'));
    
    // Wait for stats to load
    await waitFor(() => {
      expect(gameStatsAPI.getStatsSummary).toHaveBeenCalled();
      expect(gameStatsAPI.getUserGameStats).toHaveBeenCalled();
    });
    
    // Verify stats are displayed
    expect(screen.getByText('Your Minesweeper Statistics')).toBeInTheDocument();
    expect(screen.getByText('Games Played')).toBeInTheDocument();
    
    // Log out
    fireEvent.click(screen.getByText('Logout'));
    
    // Verify logout was called
    expect(authAPI.logout).toHaveBeenCalled();
    
    // After logout, we should be back at login screen
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(false);
    rerender(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });
  
  test('Game completion flow', async () => {
    // Mock user is logged in
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    render(<App />);
    
    // Wait for game to appear
    await waitFor(() => {
      expect(screen.getByText('Minesweeper')).toBeInTheDocument();
    });
    
    // Mock a game win
    const wonGameState = {
      ...mockGameState,
      isOver: true,
      isWon: true
    };
    
    // Set up mock to return won game state
    (game.openMine as jest.Mock).mockReturnValue(wonGameState);
    
    // Click a game cell to trigger win
    const gameCells = screen.getAllByRole('button').filter(
      button => button.className.includes('mine-button')
    );
    fireEvent.click(gameCells[0]);
    
    // Check for win message
    await waitFor(() => {
      expect(screen.getByText(/You Win/)).toBeInTheDocument();
    });
    
    // Verify game stats were saved
    expect(gameStatsAPI.saveGameStats).toHaveBeenCalled();
    expect(gameStatsAPI.saveGameStats).toHaveBeenCalledWith(
      expect.objectContaining({
        is_win: true
      })
    );
    
    // Click play again
    fireEvent.click(screen.getByText('Play Again'));
    
    // Verify a new game was started
    expect(game.newGame).toHaveBeenCalledTimes(2); // Once on initial render, once on reset
  });
  
  test('Registration flow', async () => {
    render(<App />);
    
    // Switch to register mode
    fireEvent.click(screen.getByText('Register'));
    
    // Fill out registration form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Mock successful registration
    (authAPI.register as jest.Mock).mockResolvedValue({ 
      user: { username: 'newuser' }, 
      access_token: 'token123'
    });
    
    // Submit registration
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    // Verify registration API was called
    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      });
    });
    
    // After registration success
    (authAPI.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    // Re-render App after registration
    const { rerender } = render(<App />);
    
    // Wait for game to appear
    await waitFor(() => {
      expect(screen.getByText('Minesweeper')).toBeInTheDocument();
    });
  });
});

// frontend/src/integration-tests/setup.js
// This file would be used to set up the environment for integration tests
// Add any global setup needed for your integration tests here

// Setting up a mock for localStorage since it's used by the authAPI
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  writable: true
});