import { Game, Mine, Point } from './gameDomain';

// Constants
const MINE = -1;

// Direction arrays for traversing neighboring cells (8 directions)
const dx = [-1, 0, 1, -1, 1, -1, 0, 1];
const dy = [-1, -1, -1, 0, 0, 1, 1, 1];

// ==============================
// Utility Functions
// ==============================

// Checks if a cell contains a mine
function isMine(mine: Mine): boolean {
    return mine.bombs === MINE;
}

// Creates a deep copy of the game board
function createDeepCopy(state: Array<Array<Mine>>): Array<Array<Mine>> {
    return state.map(row => 
        row.map(cell => 
            new Mine(
                { x: cell.pos.x, y: cell.pos.y },
                cell.bombs,
                cell.isFlagged,
                cell.isOpened
            )
        )
    );
}

// Performs an operation on all neighboring cells of a given cell
function traverseNeighbors(board: Mine[][], mine: Mine, callback: (field: Mine) => void): void {
    const { x, y } = mine.pos;
    
    for (let i = 0; i < dx.length; i++) {
        const newX = x + dx[i];
        const newY = y + dy[i];
        
        // Check if coordinates are within bounds
        if (newX >= 0 && newX < board.length && newY >= 0 && newY < board[0].length) {
            callback(board[newX][newY]);
        }
    }
}

// ==============================
// Board Generation Functions
// ==============================

// Creates an empty board with no mines
function createEmptyBoard(rows: number, cols: number): Array<Array<Mine>> {
    const board: Mine[][] = [];

    // Initialize a board with no mines
    for(let i = 0; i < rows; i++){
        const row: Mine[] = [];
        for(let j = 0; j < cols; j++){
            row.push(new Mine({x: i, y: j}, 0, false, false));
        }
        board.push(row);
    }
    
    return board;
}

// Places mines on the board after the first click
function placeMines(board: Array<Array<Mine>>, firstClickPos: Point, totalMines: number): void {
    const rows = board.length;
    const cols = board[0].length;
    
    // Set of positions to avoid (first click and its neighbors)
    const safePositions = new Set<string>();
    
    // Add first click position to safe set
    safePositions.add(`${firstClickPos.x},${firstClickPos.y}`);
    
    // Add neighboring positions to safe set
    traverseNeighbors(board, board[firstClickPos.x][firstClickPos.y], (neighbor) => {
        safePositions.add(`${neighbor.pos.x},${neighbor.pos.y}`);
    });
    
    // Place mines randomly on the board, avoiding safe positions
    let minesPlaced = 0;
    while (minesPlaced < totalMines) {
        const x = Math.floor(Math.random() * rows);
        const y = Math.floor(Math.random() * cols);
        const posKey = `${x},${y}`;

        // Check if position is safe and doesn't already have a mine
        if (!safePositions.has(posKey) && !isMine(board[x][y])) {
            board[x][y].bombs = MINE;
            minesPlaced++;
        }
    }
    
    // Calculate numbers for each cell
    fillBombsCount(board);
}

// Calculates the number of adjacent mines for each cell
function fillBombsCount(board: Array<Array<Mine>>): void {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            const cell = board[i][j];
            
            // Skip mines
            if (isMine(cell)) continue;
            
            // Count mines in neighboring cells
            let count = 0;
            traverseNeighbors(board, cell, (neighbor) => {
                if (isMine(neighbor)) {
                    count++;
                }
            });
            
            cell.bombs = count;
        }
    }
}

// Creates a new empty game (no mines placed yet)
function newGame(rows: number, cols: number, mines: number): Game {
    const board = createEmptyBoard(rows, cols);
    return new Game(board, false, mines, 0, 0, false);
}

// ==============================
// Game Status Check
// ==============================

// Check if the game is completed (win condition)
function checkGameStatus(game: Game): Game {
    // If already over (lost), don't change anything
    if (game.isOver && !game.isWon) return game;
    
    // Calculate win condition - all non-mine cells are opened
    const totalCells = game.state.length * game.state[0].length;
    const nonMineCells = totalCells - game.totBombs;
    const isWon = game.openedCells === nonMineCells;
    
    // Return updated game with win state if won
    if (isWon) {
        return new Game(
            game.state, 
            true,           // Game is over
            game.totBombs, 
            game.openedCells, 
            game.flaggedCells,
            true            // Game is won
        );
    }
    
    return game;
}

// ==============================
// Game Action Functions
// ==============================

// Handles the first click in a game
function handleFirstClick(game: Game, field: Mine): Game {
    // Create a deep copy of the board
    const newState = createDeepCopy(game.state);
    
    // Place mines, avoiding first click and its neighbors
    placeMines(newState, field.pos, game.totBombs);
    
    // Open the clicked cell and surrounding cells if it's a 0
    const clickedCell = newState[field.pos.x][field.pos.y];
    clickedCell.isOpened = true;
    let openedCount = 1; // Count the clicked cell
    
    if (clickedCell.bombs === 0) {
        openedCount += openEmptyCells(newState, clickedCell);
    }
    
    // Create updated game state
    const updatedGame = new Game(
        newState, 
        false, 
        game.totBombs, 
        openedCount, 
        game.flaggedCells,
        false
    );
    
    // Check if this move won the game
    return checkGameStatus(updatedGame);
}

// Opens a cell on the board
function openCell(game: Game, field: Mine): Game {
    // Skip if game is already over, or cell is already opened or flagged
    if (game.isOver || field.isOpened || field.isFlagged) return game;
    
    // Check if this is the first click
    const isFirstClick = game.openedCells === 0 && !game.state.some(row => 
        row.some(cell => isMine(cell))
    );
    
    // Handle first click specially
    if (isFirstClick) {
        return handleFirstClick(game, field);
    }
    
    // Regular click handling for subsequent clicks
    const newState = createDeepCopy(game.state);
    const clickedCell = newState[field.pos.x][field.pos.y];
    
    // If mine, game over with loss
    if (isMine(clickedCell)) {
        revealAllMines(newState);
        return new Game(
            newState, 
            true,           // Game is over
            game.totBombs, 
            game.openedCells, 
            game.flaggedCells,
            false           // Game is lost
        );
    }
    
    // Open the cell and increment counter
    clickedCell.isOpened = true;
    let newOpenedCount = game.openedCells + 1;
    
    // If empty, open surrounding cells
    if (clickedCell.bombs === 0) {
        const additionalCellsOpened = openEmptyCells(newState, clickedCell);
        newOpenedCount += additionalCellsOpened;
    }
    
    // Create updated game state
    const updatedGame = new Game(
        newState, 
        false, 
        game.totBombs, 
        newOpenedCount, 
        game.flaggedCells,
        false
    );
    
    // Check if this move won the game
    return checkGameStatus(updatedGame);
}

function openEmptyCells(board: Array<Array<Mine>>, startCell: Mine): number {
    const visited = new Set<string>();
    const queue: Mine[] = [startCell];
    let cellsOpened = 0;
    
    while (queue.length > 0) {
        const cell = queue.shift()!;
        const key = `${cell.pos.x},${cell.pos.y}`;
        
        // Skip if already visited
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (!cell.isOpened) {
            cell.isOpened = true;
            cellsOpened++;
        }
        
        // Only explore neighbors for empty cells
        if (cell.bombs === 0) {
            // Add unvisited neighbors to the queue
            traverseNeighbors(board, cell, (neighbor) => {
                const neighborKey = `${neighbor.pos.x},${neighbor.pos.y}`;
                if (!visited.has(neighborKey) && !neighbor.isOpened && !neighbor.isFlagged) {
                    queue.push(neighbor);
                }
            });
        }
    }
    
    return cellsOpened;
}

// Toggles a flag on a cell
function toggleFlag(game: Game, field: Mine): Game {
    // Skip if game is over or cell is already opened
    if (game.isOver || field.isOpened) return game;
    
    const newState = createDeepCopy(game.state);
    const cell = newState[field.pos.x][field.pos.y];
    
    // Toggle flag and update counter
    cell.isFlagged = !cell.isFlagged;
    const newFlaggedCount = cell.isFlagged ? 
        game.flaggedCells + 1 : 
        game.flaggedCells - 1;
    

    // Create updated game state
    return new Game(
        newState, 
        game.isOver, 
        game.totBombs, 
        game.openedCells, 
        newFlaggedCount,
        game.isWon
    );
}

// ==============================
// Game State Functions
// ==============================

// Counts the number of flagged cells
function countFlagged(game: Game): number {
    return game.flaggedCells;
}

// Reveals all mines on the board (used when game is over)
function revealAllMines(board: Array<Array<Mine>>): void {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (isMine(board[i][j])) {
                board[i][j].isOpened = true;
            }
        }
    }
}

// ==============================
// Public API
// ==============================

export const game = {
    newGame,
    fillBombsCount,
    countFlagged,
    isCompleted: (game: Game) => game.isOver && game.isWon, 
    markMine: toggleFlag,
    openMine: openCell
};