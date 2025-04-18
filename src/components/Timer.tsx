import * as React from "react";
import { time } from "../util/time";

export interface TimerProps {
    secPassed: number;
}

export const Timer: React.FC<TimerProps> = ({ secPassed }) => {
    return (
        <div className="timer">
            <h4>Time: {time.timer(secPassed)}</h4>
        </div>
    );
};