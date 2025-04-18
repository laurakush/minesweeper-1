/**
 * Format a number to have a leading zero if less than 10
 */
function format(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
}

export const time = {
    /**
     * Converts seconds to a formatted time string (MM:SS)
     */
    timer: (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${format(minutes)}:${format(secs)}`;
    }
};