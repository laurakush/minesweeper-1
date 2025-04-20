import React, { useEffect, useState } from 'react';
import { gameStatsAPI } from '../../api/api';
import { time } from '../../gameLogic/time';
import '../../styles//UserStats.css';

interface GameStatsSummary {
  total_games: number;
  wins: number;
  win_rate: number;
  best_times: {
    EASY: number | null;
    MEDIUM: number | null;
    HARD: number | null;
  };
}

interface GameStat {
  id: number;
  difficulty: string;
  time_taken: number;
  is_win: boolean;
  mines_flagged: number;
  cells_opened: number;
  played_at: string;
}

const UserStats: React.FC = () => {
  const [summary, setSummary] = useState<GameStatsSummary | null>(null);
  const [gameHistory, setGameHistory] = useState<GameStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch summary stats
        const summaryData = await gameStatsAPI.getStatsSummary();
        setSummary(summaryData);
        
        // Fetch game history
        const historyData = await gameStatsAPI.getUserGameStats();
        setGameHistory(historyData.game_stats);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Format date from ISO string
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (isLoading) {
    return <div className="stats-loading">Loading stats...</div>;
  }
  
  if (error) {
    return <div className="stats-error">{error}</div>;
  }
  
  return (
    <div className="user-stats-container">
      <h2>Your Minesweeper Statistics</h2>
      
      {summary && (
        <div className="stats-summary">
          <div className="stat-card">
            <h3>Games Played</h3>
            <div className="stat-value">{summary.total_games}</div>
          </div>
          
          <div className="stat-card">
            <h3>Games Won</h3>
            <div className="stat-value">{summary.wins}</div>
          </div>
          
          <div className="stat-card">
            <h3>Win Rate</h3>
            <div className="stat-value">{summary.win_rate}%</div>
          </div>
        </div>
      )}
      
      {summary && (
        <div className="best-times">
          <h3>Best Times</h3>
          <div className="best-times-grid">
            <div className="best-time-card">
              <h4>Easy</h4>
              <div className="time-value">
                {summary.best_times.EASY 
                  ? time.timer(summary.best_times.EASY) 
                  : 'No wins yet'}
              </div>
            </div>
            
            <div className="best-time-card">
              <h4>Medium</h4>
              <div className="time-value">
                {summary.best_times.MEDIUM 
                  ? time.timer(summary.best_times.MEDIUM) 
                  : 'No wins yet'}
              </div>
            </div>
            
            <div className="best-time-card">
              <h4>Hard</h4>
              <div className="time-value">
                {summary.best_times.HARD 
                  ? time.timer(summary.best_times.HARD) 
                  : 'No wins yet'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="game-history">
        <h3>Recent Games</h3>
        
        {gameHistory.length === 0 ? (
          <p className="no-games">No games played yet. Play a game to see your history!</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Difficulty</th>
                <th>Time</th>
                <th>Result</th>
                <th>Cells Opened</th>
                <th>Mines Flagged</th>
              </tr>
            </thead>
            <tbody>
              {gameHistory.slice(0, 10).map((game) => (
                <tr key={game.id} className={game.is_win ? 'win-row' : 'loss-row'}>
                  <td>{formatDate(game.played_at)}</td>
                  <td>{game.difficulty.charAt(0) + game.difficulty.slice(1).toLowerCase()}</td>
                  <td>{time.timer(game.time_taken)}</td>
                  <td>{game.is_win ? 'Win 🎉' : 'Loss 💣'}</td>
                  <td>{game.cells_opened}</td>
                  <td>{game.mines_flagged}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserStats;