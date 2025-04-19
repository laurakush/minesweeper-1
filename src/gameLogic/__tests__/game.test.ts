import { game } from '../game';
import { Game, Mine, Point } from '../gameDomain';

describe('Game Logic', () => {
  // Helper function to create a test point
  const createPoint = (x: number, y: number): Point => ({ x, y });

  // Helper function to create a test mine
  const createMine = (x: number, y: number, bombs = 0, isOpened = false, isFlagged = false): Mine => {
    return new Mine(createPoint(x, y), bombs, isFlagged, isOpened);
  };

  // Helper function to create a simple test game
  const createTestGame = (rows: number, cols: number, mineCount: number): Game => {
    return game.newGame(rows, cols, mineCount);
  };

  describe('newGame', () => {
    it('should create a game with the correct dimensions', () => {
      const rows = 9;
      const cols = 9;
      const mines = 10;
      
      const newGame = createTestGame(rows, cols, mines);
      
      expect(newGame.state.length).toBe(rows);
      expect(newGame.state[0].length).toBe(cols);
      expect(newGame.totBombs).toBe(mines);
      expect(newGame.isOver).toBe(false);
      expect(newGame.isWon).toBe(false);
      expect(newGame.openedCells).toBe(0);
      expect(newGame.flaggedCells).toBe(0);
    });

    it('should create a game with all cells initially closed', () => {
      const newGame = createTestGame(5, 5, 5);
      
      // Check all cells are closed
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          expect(newGame.state[i][j].isOpened).toBe(false);
          expect(newGame.state[i][j].isFlagged).toBe(false);
        }
      }
    });
  });

  describe('openMine', () => {
    it('should open a cell when clicked', () => {
      const testGame = createTestGame(5, 5, 5);
      const field = testGame.state[1][1];
      
      // Since this is first click, it should place mines, avoiding this cell
      const updatedGame = game.openMine(testGame, field);
      
      // The clicked cell should be opened
      expect(updatedGame.state[1][1].isOpened).toBe(true);
      expect(updatedGame.openedCells).toBeGreaterThan(0);
    });

    it('should not open a flagged cell', () => {
        // Create a test game (3x3 board with 1 mine)
        const testGame = createTestGame(3, 3, 1);
        
        // Flag the cell at position [1][1]
        const cellToFlag = testGame.state[1][1];
        const gameWithFlag = game.markMine(testGame, cellToFlag);
        
        // Verify the cell is flagged
        expect(gameWithFlag.state[1][1].isFlagged).toBe(true);
        
        // Try to open the flagged cell
        const updatedGame = game.openMine(gameWithFlag, gameWithFlag.state[1][1]);
        
        // The cell should remain closed
        expect(updatedGame.state[1][1].isOpened).toBe(false);
      });
    
    it('should end the game when a mine is clicked', () => {
      // Create a game with one opened cell (to simulate game in progress)
      const initialGame = createTestGame(5, 5, 5);
      const firstCell = initialGame.state[0][0];
      let gameInProgress = game.openMine(initialGame, firstCell);
      
      // Find a cell with a mine
      let mineCell: Mine | undefined;
      outerLoop:
      for (let i = 0; i < gameInProgress.state.length; i++) {
        for (let j = 0; j < gameInProgress.state[i].length; j++) {
          if (gameInProgress.state[i][j].bombs === -1) {
            mineCell = gameInProgress.state[i][j];
            break outerLoop;
          }
        }
      }
      
      if (!mineCell) {
        throw new Error('No mine found in test game');
      }
      
      // Click on the mine
      const updatedGame = game.openMine(gameInProgress, mineCell);
      
      // Game should be over and not won
      expect(updatedGame.isOver).toBe(true);
      expect(updatedGame.isWon).toBe(false);
    });
  });

  describe('markMine', () => {
    it('should toggle a flag on a cell', () => {
      const testGame = createTestGame(5, 5, 5);
      const field = testGame.state[1][1];
      
      // Flag the cell
      const flaggedGame = game.markMine(testGame, field);
      expect(flaggedGame.state[1][1].isFlagged).toBe(true);
      expect(flaggedGame.flaggedCells).toBe(1);
      
      // Unflag the cell
      const unflaggedGame = game.markMine(flaggedGame, flaggedGame.state[1][1]);
      expect(unflaggedGame.state[1][1].isFlagged).toBe(false);
      expect(unflaggedGame.flaggedCells).toBe(0);
    });
    
    it('should not flag an opened cell', () => {
      const testGame = createTestGame(5, 5, 5);
      const field = testGame.state[1][1];
      
      // Open the cell
      const openedGame = game.openMine(testGame, field);
      
      // Try to flag the opened cell
      const updatedGame = game.markMine(openedGame, openedGame.state[1][1]);
      
      // The cell should not be flagged
      expect(updatedGame.state[1][1].isFlagged).toBe(false);
    });
  });

  describe('checkGameStatus', () => {
    it('should correctly identify a won game', () => {
      // Create a simple 3x3 game with just 1 mine
      const simpleGame = createTestGame(3, 3, 1);
      let gameInProgress = game.openMine(simpleGame, simpleGame.state[0][0]);
      
      // Find the mine
      let mineX = -1, mineY = -1;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (gameInProgress.state[i][j].bombs === -1) {
            mineX = i;
            mineY = j;
            break;
          }
        }
      }
      
      // Open all cells except the mine
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (i !== mineX || j !== mineY) {
            const cell = gameInProgress.state[i][j];
            if (!cell.isOpened) {
              gameInProgress = game.openMine(gameInProgress, cell);
            }
          }
        }
      }
      
      // Flag the mine
      gameInProgress = game.markMine(gameInProgress, gameInProgress.state[mineX][mineY]);
      
      // At this point, all non-mine cells are opened and the mine is flagged
      // The game should be won
      expect(gameInProgress.isOver).toBe(true);
      expect(gameInProgress.isWon).toBe(true);
    });
  });

  describe('countFlagged', () => {
    it('should correctly count flagged cells', () => {
      const testGame = createTestGame(5, 5, 5);
      
      // Flag a few cells
      let updatedGame = game.markMine(testGame, testGame.state[0][0]);
      updatedGame = game.markMine(updatedGame, updatedGame.state[1][1]);
      updatedGame = game.markMine(updatedGame, updatedGame.state[2][2]);
      
      // Check the count
      const flagCount = game.countFlagged(updatedGame);
      expect(flagCount).toBe(3);
    });
  });
});