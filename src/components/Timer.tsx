import * as React from "react";
import { time } from "../util/time";

export interface TimerProps {
    secPassed: number;
}

export const Timer: React.FC<TimerProps> = ({ secPassed }) => {
    return (
        <div className="timer-display">{time.timer(secPassed)}</div>
    );
};