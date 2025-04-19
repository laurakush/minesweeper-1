import * as React from "react";
import { time } from "../gameLogic/time";

export interface TimerProps {
    secPassed: number;
}

export const Timer: React.FC<TimerProps> = ({ secPassed }) => {
    return (
        <div className="timer-display">{time.timer(secPassed)}</div>
    );
};