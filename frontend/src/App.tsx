import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import LoginRegister from './components/user_components/LoginRegister';
import UserStats from './components/user_components/UserStats';
import { authAPI } from './api/api';
import './styles/App.css';

// Define difficulty level enum
enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

const App: React.FC = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'game' | 'stats'>('game');
  
  // Check if user is already logged in (via token)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          // Verify token is valid by fetching current user
          await authAPI.getCurrentUser();
          setIsLoggedIn(true);
        }
      } catch (error) {
        // Token might be expired or invalid
        console.error("Auth check failed:", error);
        authAPI.logout();
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Handle successful login
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    authAPI.logout();
    setIsLoggedIn(false);
    setCurrentView('game');
  };
  
  // Toggle between game and stats view
  const toggleView = () => {
    setCurrentView(currentView === 'game' ? 'stats' : 'game');
  };
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return (
    <div className="App">
      {isLoggedIn ? (
        <>
          <header className="App-header-with-nav">
            <div className="nav-container">
              <div className="nav-brand">
                <h1>Minesweeper</h1>
              </div>
              <nav className="main-nav">
                <button 
                  className={`nav-button ${currentView === 'game' ? 'active' : ''}`}
                  onClick={() => setCurrentView('game')}
                >
                  Play Game
                </button>
                <button 
                  className={`nav-button ${currentView === 'stats' ? 'active' : ''}`}
                  onClick={() => setCurrentView('stats')}
                >
                  My Stats
                </button>
                <button 
                  className="nav-button logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </nav>
            </div>
          </header>
          
          <main>
            {currentView === 'game' ? (
              <Game 
                initialRows={16} 
                initialCols={16} 
                initialMines={40} 
                initialDifficulty={DifficultyLevel.MEDIUM} 
              />
            ) : (
              <UserStats />
            )}
          </main>
        </>
      ) : (
        <LoginRegister onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;