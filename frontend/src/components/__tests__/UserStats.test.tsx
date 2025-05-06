import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import UserStats from '../user_components/UserStats';
import { gameStatsAPI } from '../../api/api';
import { act } from 'react';

jest.mock('../../api/api', () => ({
  gameStatsAPI: {
    getStatsSummary: jest.fn(),
    getUserGameStats: jest.fn()
  }
}));

describe('UserStats Component', () => {
  const mockSummary = {
    total_games: 10,
    wins: 6,
    win_rate: 60.0,
    best_times: {
      EASY: 45,
      MEDIUM: 120,
      HARD: null
    }
  };
  
  const mockGameHistory = {
    game_stats: [
      {
        id: 1,
        difficulty: 'EASY',
        time_taken: 45,
        is_win: true,
        mines_flagged: 10,
        cells_opened: 71,
        played_at: '2023-04-20T10:30:00Z'
      },
      {
        id: 2,
        difficulty: 'MEDIUM',
        time_taken: 120,
        is_win: false,
        mines_flagged: 20,
        cells_opened: 100,
        played_at: '2023-04-19T06:15:00Z'
      }
    ]
  };
  
  jest.mock('../gameLogic/time', () => ({
    time: {
      timer: jest.fn().mockImplementation((seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes < 10 ? '0' + minutes : minutes}:${secs < 10 ? '0' + secs : secs}`;
      })
    }
  }));
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2023-04-21T12:00:00Z'));
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('renders loading state initially', () => {
    (gameStatsAPI.getStatsSummary as jest.Mock).mockResolvedValue(mockSummary);
    (gameStatsAPI.getUserGameStats as jest.Mock).mockResolvedValue(mockGameHistory);
    
    render(<UserStats />);
    
    expect(screen.getByText('Loading stats...')).toBeInTheDocument();
  });
  
  it('renders error state when API fails', async () => {
    (gameStatsAPI.getStatsSummary as jest.Mock).mockRejectedValue(new Error('API error'));
    
    await act(async () => {
      render(<UserStats />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics. Please try again later.')).toBeInTheDocument();
    });
  });
});