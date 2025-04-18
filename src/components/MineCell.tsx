import * as React from "react";
import { Mine } from '../gameLogic/gameDomain';

export interface MineProps {
    index: number;
    field: Mine;
    onLeftClick: (field: Mine) => void;
}

//This function renders the mine cell based on the state of the mine 
function renderMine(field: Mine){
    if (field.isOpened) {
        if (field.bombs > 0) {
            return (<span className={`bombs-${field.bombs}`}>{field.bombs}</span>);
        }
        else if (field.bombs == 0) {
            return ''
        }
        else {
            return (<span className="bombs-0">💣</span>);
        }
    } else {
        if (field.isFlagged) {
            return (<span className="flag">🚩</span>);
        }
        else {
            return ''; 
        }
    }

}
export const MineCell = (props: MineProps) => {
    const field = props.field; 
    return (
        <button 
            className={'mine-button' + (field.isOpened ? '' : ' mine-opened')}
            tabIndex={props.index}
            onClick={() => props.onLeftClick(field)}>
            {renderMine(field)}
        </button>
    )

}
