import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { NowPlaying } from '@chromesthesia/shared';
import PlayingAnimation from './PlayingAnimation';

interface SpotifyNowPlayingProps {
    song: NowPlaying | null;
}

const SpotifyNowPlaying = ({ song }: SpotifyNowPlayingProps) => {
    const isPlaying = song?.isPlaying ?? false;

    return (
        <div className="mx-[5%] max-w-[90%] font-body">
            <div className="flex items-center">
                <div className="p-[2%] text-[4rem]">
                    <FontAwesomeIcon icon={faSpotify} className="text-spotify" />
                </div>
                <p className="w-full py-[5%] pr-[5%] text-[2.5rem] font-bold text-light">
                    {isPlaying ? 'Now playing' : 'Currently offline'}
                </p>
            </div>
            {song && (
                <div className="flex rounded-[15px] border-[3px] border-medium">
                    {song.albumImageUrl && (
                        <img
                            className="box-content h-auto w-1/4 shrink-0 rounded-[18%] p-[5%]"
                            alt={`${song.title} album art`}
                            src={song.albumImageUrl}
                        />
                    )}
                    <div className="flex w-full flex-col justify-evenly py-[8%]">
                        <div className="flex pr-[5%] text-[2rem]">
                            <PlayingAnimation isPlaying={isPlaying} />
                            <a
                                className="grow font-bold text-light no-underline"
                                href={song.songUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {song.title}
                            </a>
                        </div>
                        <p className="text-[1.5rem] text-medium">{song.artist}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpotifyNowPlaying;
