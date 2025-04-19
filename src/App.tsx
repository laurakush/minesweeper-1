import React from 'react';
import Game from './components/Game';

// Define difficulty level enum
enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

const App: React.FC = () => {
  // Default to medium difficulty
  return (
    <div className="App">
      <main>
        <Game 
          initialRows={16} 
          initialCols={16} 
          initialMines={40} 
          initialDifficulty={DifficultyLevel.MEDIUM} 
        />
      </main>
    </div>
  );
};

export default App;