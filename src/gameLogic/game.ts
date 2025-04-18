import { Game, Mine, Point } from './gameDomain';

const MINE = -1;
const dx = [-1, 0, 1, -1, 1, -1, 0, 1];
const dy = [-1, -1, -1, 0, 0, 1, 1, 1];

// Helper functions
function isMine(mine: Mine): boolean {
    return mine.bombs === MINE;
}

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

function fillBoard(rows: number, cols: number, mines: number): Array<Array<Mine>> {
    const board: Mine[][] = [];

    // Initialize a board with no mines
    for(let i = 0; i < rows; i++){
        const row: Mine[] = [];
        for(let j = 0; j < cols; j++){
            row.push(new Mine({x: i, y: j}, 0, false, false));
        }
        board.push(row);
    }

    // Place mines randomly on the board
    let minesPlaced = 0;
    while (minesPlaced < mines) {
        let x = Math.floor(Math.random() * rows);
        let y = Math.floor(Math.random() * cols);

        // Check if the mine is already placed
        if (!isMine(board[x][y])) {
            board[x][y].bombs = MINE;
            minesPlaced++;
        }
    }
    
    // Calculate numbers for each cell
    fillBombsCount(board);
    
    return board;
}

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

function newGame(rows: number, cols: number, mines: number): Game {
    const board = fillBoard(rows, cols, mines);
    return new Game(board, false, mines);
}

function openCell(game: Game, field: Mine): Game {
    if (field.isFlagged || field.isOpened) return game;
    
    const newState = createDeepCopy(game.state);
    const clickedCell = newState[field.pos.x][field.pos.y];
    
    // If mine, game over
    if (isMine(clickedCell)) {
        revealAllMines(newState);
        return new Game(newState, true, game.totBombs);
    }
    
    // Open the cell
    clickedCell.isOpened = true;
    
    // If empty, open surrounding cells
    if (clickedCell.bombs === 0) {
        openEmptyCells(newState, clickedCell);
    }
    
    return new Game(newState, false, game.totBombs);
}

function openEmptyCells(board: Array<Array<Mine>>, startCell: Mine): void {
    const visited = new Set<string>();
    const queue: Mine[] = [startCell];
    
    while (queue.length > 0) {
        const cell = queue.shift()!;
        const key = `${cell.pos.x},${cell.pos.y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        cell.isOpened = true;
        
        // If cell has no adjacent mines, explore neighbors
        if (cell.bombs === 0) {
            traverseNeighbors(board, cell, (neighbor) => {
                if (!neighbor.isOpened && !neighbor.isFlagged && !isMine(neighbor)) {
                    queue.push(neighbor);
                }
            });
        }
    }
}

function toggleFlag(game: Game, field: Mine): Game {
    if (field.isOpened) return game;
    
    const newState = createDeepCopy(game.state);
    const cell = newState[field.pos.x][field.pos.y];
    cell.isFlagged = !cell.isFlagged;
    
    return new Game(newState, game.isOver, game.totBombs);
}

function checkCompleted(game: Game): boolean {
    for (let i = 0; i < game.state.length; i++) {
        for (let j = 0; j < game.state[i].length; j++) {
            const cell = game.state[i][j];
            
            // If a non-mine cell is not opened, game is not complete
            if (!isMine(cell) && !cell.isOpened) {
                return false;
            }
            
            // If a mine is not flagged, game is not complete
            if (isMine(cell) && !cell.isFlagged) {
                return false;
            }
        }
    }
    
    return true;
}

function countFlagged(game: Game): number {
    let count = 0;
    
    for (let i = 0; i < game.state.length; i++) {
        for (let j = 0; j < game.state[i].length; j++) {
            if (game.state[i][j].isFlagged) {
                count++;
            }
        }
    }
    
    return count;
}

function revealAllMines(board: Array<Array<Mine>>): void {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (isMine(board[i][j])) {
                board[i][j].isOpened = true;
            }
        }
    }
}

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

export const game = {
    newGame,
    fillBombsCount,
    countFlagged,
    isCompleted: checkCompleted,
    markMine: toggleFlag,
    openMine: openCell
};