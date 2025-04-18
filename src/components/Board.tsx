import * as React from "react";
import { MineCell } from "./MineCell";
import { Game, Mine } from "../gameLogic/gameDomain";

export interface BoardProps {
    game: Game;
    onLeftClick: (field: Mine) => void;
}
export const MineField = (props: BoardProps) => (
    <div className="game-board">
        {
            props.game.state.map((row, i) => (
                    <div key={i} className="board-row">
                        {
                            row.map((field, j) => (
                                    <MineCell key={`${i}-${j}`}
                                                index={j + row.length}
                                                field={field}
                                                onLeftClick={(field) => props.onLeftClick(field)}/>
                                )
                            )
                        }
                    </div>
                )
            )
        }
    </div>
);
