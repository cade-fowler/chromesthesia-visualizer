interface PlayingAnimationProps {
    isPlaying: boolean;
}

// Bar delays offset each bar's place in the shared `playing` keyframes
const BAR_DELAYS = ['0s', '-2.2s', '-3.7s'];

/** Three bouncing equalizer bars, shown while a song is playing. */
const PlayingAnimation = ({ isPlaying }: PlayingAnimationProps) => {
    if (!isPlaying) return null;
    return (
        <div className="box-content flex h-8 w-8 shrink-0 justify-between pr-[5%]" aria-hidden>
            {BAR_DELAYS.map((delay) => (
                <span
                    key={delay}
                    className="h-full w-1/4 origin-bottom animate-playing rounded-[3px] bg-[#1ed760]"
                    style={{ animationDelay: delay }}
                />
            ))}
        </div>
    );
};

export default PlayingAnimation;
