import * as React from "react";
import { MineCell } from "./MineCell";
import { Game, Mine } from "../gameLogic/gameDomain";

export interface BoardProps {
    game: Game;
    onLeftClick: (field: Mine) => void;
    onRightClick: (field: Mine, e: React.MouseEvent) => void;
}

export const MineField: React.FC<BoardProps> = ({ game, onLeftClick, onRightClick }) => {
    return (
        <div className="game-board">
            {game.state.map((row, i) => (
                <div key={i} className="board-row">
                    {row.map((field, j) => (
                        <MineCell 
                            key={`${i}-${j}`}
                            index={j + row.length}
                            field={field}
                            onLeftClick={onLeftClick}
                            onRightClick={onRightClick}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};