import { game } from '../game';
import { Game, Mine, Point } from '../gameDomain';

describe('Minesweeper State Management', () => {
  // Helper function to create a test mine
  const createMine = (x: number, y: number, bombs = 0, isOpened = false, isFlagged = false): Mine => {
    return new Mine({ x, y }, bombs, isFlagged, isOpened);
  };

  // Helper function to create a test game with manual state
  const createGameWithState = (
    state: Mine[][], 
    isOver = false, 
    mineCount = 0,
    openedCount = 0,
    flaggedCount = 0,
    isWon = false
  ): Game => {
    return new Game(state, isOver, mineCount, openedCount, flaggedCount, isWon);
  };

  describe('Game initialization', () => {
    it('should create a new game with correct dimensions', () => {
      const rows = 8;
      const cols = 8;
      const mines = 10;
      
      const newGame = game.newGame(rows, cols, mines);
      
      expect(newGame.state.length).toBe(rows);
      expect(newGame.state[0].length).toBe(cols);
      expect(newGame.totBombs).toBe(mines);
      expect(newGame.isOver).toBe(false);
      expect(newGame.isWon).toBe(false);
    });
    
    it('should initialize all cells as closed and unflagged', () => {
      const newGame = game.newGame(3, 3, 1);
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          expect(newGame.state[i][j].isOpened).toBe(false);
          expect(newGame.state[i][j].isFlagged).toBe(false);
        }
      }
    });
  });

  describe('Game state transitions', () => {
    it('should properly track flagged cell count', () => {
      // Create a game
      const testGame = game.newGame(3, 3, 1);
      
      // Flag a cell
      const updatedGame = game.markMine(testGame, testGame.state[0][0]);
      
      // Verify flag was set
      expect(updatedGame.state[0][0].isFlagged).toBe(true);
      expect(updatedGame.flaggedCells).toBe(1);
      
      // Unflag the cell
      const finalGame = game.markMine(updatedGame, updatedGame.state[0][0]);
      
      // Verify flag was removed
      expect(finalGame.state[0][0].isFlagged).toBe(false);
      expect(finalGame.flaggedCells).toBe(0);
    });
    
    it('should not allow flagging opened cells', () => {
      // Create a test game
      const state = [
        [createMine(0, 0, 0, true, false)], // Opened cell
      ];
      
      const testGame = createGameWithState(state, false, 0, 1, 0, false);
      
      // Try to flag the opened cell
      const updatedGame = game.markMine(testGame, testGame.state[0][0]);
      
      // Verify it wasn't flagged
      expect(updatedGame.state[0][0].isFlagged).toBe(false);
      expect(updatedGame.flaggedCells).toBe(0);
    });
  });

  describe('Win condition', () => {
    it('should detect a won game correctly using isCompleted', () => {
      // Create a simple 2x2 game with one mine
      const state = [
        [createMine(0, 0, -1, false, true)], // Mine - flagged
        [createMine(1, 0, 1, true, false)]   // Non-mine - opened
      ];
      
      // Create a game that's won
      const wonGame = createGameWithState(
        state,
        true,  // Game is over
        1,     // 1 mine
        1,     // 1 cell opened
        1,     // 1 cell flagged
        true   // Game is won
      );
      
      // Check if game is completed
      expect(game.isCompleted(wonGame)).toBe(true);
    });
    
    it('should detect a lost game correctly using isCompleted', () => {
      // Create a game that's lost
      const state = [
        [createMine(0, 0, -1, true, false)], // Mine - revealed (exploded)
        [createMine(1, 0, 1, true, false)]   // Non-mine - opened
      ];
      
      // Create a game that's lost
      const lostGame = createGameWithState(
        state,
        true,  // Game is over
        1,     // 1 mine
        2,     // 2 cells opened (including mine)
        0,     // 0 cells flagged
        false  // Game is lost
      );
      
      // Check if game is completed
      expect(game.isCompleted(lostGame)).toBe(false);
    });
  });
  
  describe('Game state immutability', () => {
    it('should create a new game state when marking a mine', () => {
      const originalGame = game.newGame(3, 3, 1);
      const updatedGame = game.markMine(originalGame, originalGame.state[0][0]);
      
      // Verify we get a new state object
      expect(updatedGame).not.toBe(originalGame);
      
      // And new state array
      expect(updatedGame.state).not.toBe(originalGame.state);
      
      // And the first row is a new array
      expect(updatedGame.state[0]).not.toBe(originalGame.state[0]);
    });
    
    it('should create a new game state when opening a mine', () => {
      const originalGame = game.newGame(3, 3, 1);
      const updatedGame = game.openMine(originalGame, originalGame.state[0][0]);
      
      // Verify we get a new state object
      expect(updatedGame).not.toBe(originalGame);
      
      // And new state array
      expect(updatedGame.state).not.toBe(originalGame.state);
    });
  });
});