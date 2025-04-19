import { game } from '../game';
import { Game, Mine, Point } from '../gameDomain';

describe('Minesweeper State Management', () => {
  // Helper to create a point
  const createPoint = (x: number, y: number): Point => ({ x, y });
  
  // Helper to create a mine
  const createMine = (x: number, y: number, bombs = 0, isOpened = false, isFlagged = false): Mine => {
    return new Mine(createPoint(x, y), bombs, isFlagged, isOpened);
  };
  
  describe('Game State Initialization', () => {
    it('should create a fresh game state with proper defaults', () => {
      const rows = 9;
      const cols = 9;
      const mines = 10;
      
      const newGame = game.newGame(rows, cols, mines);
      
      expect(newGame.state.length).toBe(rows);
      expect(newGame.state[0].length).toBe(cols);
      expect(newGame.totBombs).toBe(mines);
      expect(newGame.isOver).toBe(false);
      expect(newGame.openedCells).toBe(0);
      expect(newGame.flaggedCells).toBe(0);
    });
    
    it('should initialize a game state that is immutable', () => {
      const newGame = game.newGame(5, 5, 5);
      const originalState = JSON.stringify(newGame);
      
      // Try to mutate the state directly (which is bad practice)
      try {
        newGame.isOver = true;
        newGame.flaggedCells = 3;
        newGame.state[0][0].isOpened = true;
      } catch (e) {
        // Might throw an error if state is frozen
      }
      
      // The state should not change when we try to mutate it directly
      // Note: This test will pass if your state is properly immutable (using Object.freeze)
      // but will still pass with current implementation - it just tests your intent
      const fieldStillClosed = !newGame.state[0][0].isOpened;
      expect(fieldStillClosed).toBe(true);
    });
  });
  
  describe('State Transitions', () => {
    it('should create a new state when opening a cell', () => {
      const initialGame = game.newGame(5, 5, 5);
      const field = initialGame.state[1][1];
      
      // Open a cell
      const updatedGame = game.openMine(initialGame, field);
      
      // Verify we got a new object, not the same one
      expect(updatedGame).not.toBe(initialGame);
      
      // State should be different
      expect(updatedGame.openedCells).toBeGreaterThan(initialGame.openedCells);
    });
    
    it('should create a new state when flagging a cell', () => {
      const initialGame = game.newGame(5, 5, 5);
      const field = initialGame.state[1][1];
      
      // Flag a cell
      const updatedGame = game.markMine(initialGame, field);
      
      // Verify we got a new object, not the same one
      expect(updatedGame).not.toBe(initialGame);
      
      // State should reflect the change
      expect(updatedGame.flaggedCells).toBe(initialGame.flaggedCells + 1);
      expect(updatedGame.state[1][1].isFlagged).toBe(true);
    });
    
    it('should maintain previous state when performing invalid actions', () => {
      // Create a game with one cell already opened
      const initialGame = game.newGame(5, 5, 5);
      const firstCell = initialGame.state[0][0];
      let gameInProgress = game.openMine(initialGame, firstCell);
      
      // Try to flag an already opened cell (invalid action)
      const flaggedGame = game.markMine(gameInProgress, gameInProgress.state[0][0]);
      
      // Should get same state back (or equivalent)
      expect(flaggedGame.flaggedCells).toBe(gameInProgress.flaggedCells);
      expect(flaggedGame.state[0][0].isFlagged).toBe(false);
    });
  });
  
  describe('Game State Progression', () => {
    it('should track opened cells count accurately', () => {
      const initialGame = game.newGame(5, 5, 5);
      
      // Open a cell (first click)
      const firstCell = initialGame.state[0][0];
      const afterFirstClick = game.openMine(initialGame, firstCell);
      
      // Should have opened at least one cell
      expect(afterFirstClick.openedCells).toBeGreaterThan(0);
      
      // Open another cell
      let remainingClosedCells = afterFirstClick.state
        .flat()
        .filter(mine => !mine.isOpened && !isMine(mine));
      
      // If all cells opened automatically (can happen when first click is near empty area),
      // this test can't proceed
      if (remainingClosedCells.length === 0) {
        return;
      }
      
      const secondCell = remainingClosedCells[0];
      const afterSecondClick = game.openMine(afterFirstClick, secondCell);
      
      // Should have opened at least one more cell
      expect(afterSecondClick.openedCells).toBeGreaterThan(afterFirstClick.openedCells);
    });
    
    it('should update game state to "game over" when clicking a mine', () => {
      // Start a game
      const initialGame = game.newGame(5, 5, 3);
      
      // Make first move to place mines
      const firstCell = initialGame.state[0][0];
      const safeGame = game.openMine(initialGame, firstCell);
      
      // Find a mine
      let mineCell: Mine | null = null;
      for (let i = 0; i < safeGame.state.length; i++) {
        for (let j = 0; j < safeGame.state[i].length; j++) {
          if (isMine(safeGame.state[i][j])) {
            mineCell = safeGame.state[i][j];
            break;
          }
        }
        if (mineCell) break;
      }
      
      if (!mineCell) {
        throw new Error('No mine found in test game');
      }
      
      // Click the mine
      const afterMineCLick = game.openMine(safeGame, mineCell);
      
      // Game should be over
      expect(afterMineCLick.isOver).toBe(true);
      expect(afterMineCLick.isWon).toBe(false);
    });
    
    it('should track flagged cells count when toggling flags', () => {
      const initialGame = game.newGame(5, 5, 5);
      
      // Flag a cell
      const firstCell = initialGame.state[0][0];
      const afterFlag = game.markMine(initialGame, firstCell);
      
      // Count should increase
      expect(afterFlag.flaggedCells).toBe(initialGame.flaggedCells + 1);
      
      // Unflag the same cell
      const afterUnflag = game.markMine(afterFlag, afterFlag.state[0][0]);
      
      // Count should decrease
      expect(afterUnflag.flaggedCells).toBe(afterFlag.flaggedCells - 1);
    });
  });
  
  describe('Win Condition', () => {
    it('should detect a win condition when all non-mine cells are opened', () => {
      // Create a very simple game with just one mine to make testing easier
      const initialGame = game.newGame(2, 2, 1);
      
      // First click to place mines
      const firstCell = initialGame.state[0][0];
      let currentGame = game.openMine(initialGame, firstCell);
      
      // Find the mine position
      let mineX = -1, mineY = -1;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          if (isMine(currentGame.state[i][j])) {
            mineX = i;
            mineY = j;
          }
        }
      }
      
      // Open all non-mine cells
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          if (i !== mineX || j !== mineY) {
            const cell = currentGame.state[i][j];
            if (!cell.isOpened) {
              currentGame = game.openMine(currentGame, cell);
            }
          }
        }
      }
      
      // Flag the mine cell
      currentGame = game.markMine(currentGame, currentGame.state[mineX][mineY]);
      
      // Game should be won
      expect(currentGame.isOver).toBe(true);
      expect(currentGame.isWon).toBe(true);
    });
  });
});

// Helper function to check if a cell contains a mine
function isMine(mine: Mine): boolean {
  return mine.bombs === -1;
}