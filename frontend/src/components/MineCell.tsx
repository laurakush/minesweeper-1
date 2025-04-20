import * as React from "react";
import { Mine } from '../gameLogic/gameDomain';

export interface MineProps {
    index: number;
    field: Mine;
    onLeftClick: (field: Mine) => void;
    onRightClick: (field: Mine, e: React.MouseEvent) => void;
}

// This function renders the mine cell based on the state of the mine 
const renderMine = (field: Mine) => {
    if (field.isOpened) {
        if (field.bombs > 0) {
            return (<span className={`bombs-${field.bombs}`}>{field.bombs}</span>);
        }
        else if (field.bombs === 0) {
            return '';
        }
        else {
            return (<span className="bomb">💣</span>);
        }
    } else {
        if (field.isFlagged) {
            return (<span className="flag">🚩</span>);
        }
        else {
            return ''; 
        }
    }
};

export const MineCell: React.FC<MineProps> = ({ field, index, onLeftClick, onRightClick }) => {
    return (
        <button 
            className={`mine-button${field.isOpened ? ' mine-opened' : ''}`}
            tabIndex={index}
            onClick={() => onLeftClick(field)}
            onContextMenu={(e) => onRightClick(field, e)}>
            {renderMine(field)}
        </button>
    );
};