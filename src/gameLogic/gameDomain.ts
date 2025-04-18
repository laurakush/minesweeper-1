export interface Point {
    x: number;
    y: number;
}

/**
 * position: of bomb 
 * bombs = -1 => indicates a bomb 
 * bombs >= 0 => number of bombs around 
 */

export class Mine {
    constructor(public pos: Point,
        public bombs = 0,
        public isFlagged = false,
        public isOpened = false
    ) {
    }
}

// Represents the game as a matrix of Mines
export class Game {
    constructor(public state: Array<Array<Mine>>,
        public isOver = false, 
        public totBombs = 0,
        public openedCells = 0,
        public flaggedCells = 0
        
    ){
    }
}