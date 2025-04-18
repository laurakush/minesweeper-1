import * as React from "react";
import { time } from "../util/time";

export interface TimerProps {
    secPassed: number;
}

export const Timer = (props: TimerProps) => (
    <h4>{time.timer(props.secPassed)}</h4>
);