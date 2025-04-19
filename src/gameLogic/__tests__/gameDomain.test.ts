import { Game, Mine, Point } from '../gameDomain';

describe('Game Domain Models', () => {
  describe('Mine Class', () => {
    it('should initialize with default values', () => {
      const position: Point = { x: 3, y: 4 };
      const mine = new Mine(position);
      
      expect(mine.pos).toBe(position);
      expect(mine.bombs).toBe(0);
      expect(mine.isFlagged).toBe(false);
      expect(mine.isOpened).toBe(false);
    });
    
    it('should initialize with custom values', () => {
      const position: Point = { x: 1, y: 2 };
      const bombs = -1; // mine
      const isFlagged = true;
      const isOpened = true;
      
      const mine = new Mine(position, bombs, isFlagged, isOpened);
      
      expect(mine.pos).toBe(position);
      expect(mine.bombs).toBe(bombs);
      expect(mine.isFlagged).toBe(isFlagged);
      expect(mine.isOpened).toBe(isOpened);
    });
  });
  
  describe('Game Class', () => {
    it('should initialize with default values', () => {
      const state: Mine[][] = [
        [new Mine({x: 0, y: 0}), new Mine({x: 0, y: 1})],
        [new Mine({x: 1, y: 0}), new Mine({x: 1, y: 1})]
      ];
      
      const game = new Game(state);
      
      expect(game.state).toBe(state);
      expect(game.isOver).toBe(false);
      expect(game.totBombs).toBe(0);
      expect(game.openedCells).toBe(0);
      expect(game.flaggedCells).toBe(0);
      expect(game.isWon).toBe(false);
    });
    
    it('should initialize with custom values', () => {
      const state: Mine[][] = [
        [new Mine({x: 0, y: 0}), new Mine({x: 0, y: 1})],
        [new Mine({x: 1, y: 0}), new Mine({x: 1, y: 1})]
      ];
      const isOver = true;
      const totBombs = 2;
      const openedCells = 1;
      const flaggedCells = 2;
      const isWon = true;
      
      const game = new Game(state, isOver, totBombs, openedCells, flaggedCells, isWon);
      
      expect(game.state).toBe(state);
      expect(game.isOver).toBe(isOver);
      expect(game.totBombs).toBe(totBombs);
      expect(game.openedCells).toBe(openedCells);
      expect(game.flaggedCells).toBe(flaggedCells);
      expect(game.isWon).toBe(isWon);
    });
  });
});