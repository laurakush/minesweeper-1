import { Game, Mine, Point} from './gameDomain';

const MINE = -1; 
const dx = [-1, 0, 1, -1, 1, -1, 0, 1];
const dy = [-1, -1, -1, 0, 0, 1, 1, 1];

//Helper functions 
function isMine(mine: Mine): boolean {
    return mine.bombs === MINE;
}

function traverseNeighbors(board: Mine[][], x: number, y: number): void {

}

function fillBoard (rows: number, cols: number, mines: number):  Array<Array<Mine>> {
    const board: Mine[][] = [];

    //Initialize a  board with no mines 
    for(let i = 0; i < rows; i++){
        const row: Mine[] = [];
        for(let j = 0; j < cols; j++){
            row.push(new Mine({x: i, y: j}, 0, false, false);
        }
        board.push(row);
    }

    // Place mines randomly on the board
    for(let i = 0; i < mines; i++){
        let x = Math.floor(Math.random() * rows);
        let y = Math.floor(Math.random() * cols);

        // Check if the mine is already placed
        while(isMine(board[x][y])){
            x = Math.floor(Math.random() * rows);
            y = Math.floor(Math.random() * cols);
        }
        board[x][y].bombs = MINE;
    }
    
    return board; 
}[]

function newGame(rows: number, cols: number, mines: number): Game {
    let board = fillBoard(rows, cols, mines);
}


export const game = {
    newGame: newGame,
    fillBombsCount: fillBombsCount,
    countFlagged: countFlagged,
    isCompleted: checkCompleted,
    markMine: markMine, 
    openMine, openMine
}