interface PlayingAnimationProps {
    isPlaying: boolean;
}

// Bar delays offset each bar's place in the shared `playing` keyframes
const BAR_DELAYS = ['0s', '-2.2s', '-3.7s'];

/** Three bouncing equalizer bars, shown while a song is playing. */
const PlayingAnimation = ({ isPlaying }: PlayingAnimationProps) => {
    if (!isPlaying) return null;
    return (
        <span className="flex h-3 w-3.5 shrink-0 justify-between" aria-hidden>
            {BAR_DELAYS.map((delay) => (
                <span
                    key={delay}
                    className="h-full w-[3px] origin-bottom animate-playing bg-ink motion-reduce:animate-none"
                    style={{ animationDelay: delay }}
                />
            ))}
        </span>
    );
};

export default PlayingAnimation;
