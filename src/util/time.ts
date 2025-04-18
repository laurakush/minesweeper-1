function format(num: number) {
    return num < 10 ? `0${num}` : `${num}`;
}

export const time = {
    timer: (sec: number) => {
        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;
        return `${format(minutes)}:${format(seconds)}`;
    }
}