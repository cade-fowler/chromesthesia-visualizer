import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PlayingAnimation from './PlayingAnimation'
import type { NowPlaying } from '../../../types'
import './index.scss'

interface SpotifyNowPlayingProps {
    song: NowPlaying | null
}

const SpotifyNowPlaying = ({ song }: SpotifyNowPlayingProps) => {
    const isPlaying = song?.isPlaying ?? false

    return (
        <div className="player">
            <div className="status">
                <div className="logo">
                    <FontAwesomeIcon icon={faSpotify} color='#1ad861' />
                </div>
                <p className="status-text">{isPlaying ? 'Now playing' : 'Currently offline'}</p>
            </div>
            {song && (
                <div className="song-box">
                    <img className="album-art"
                        alt={`${song.title} album art`}
                        src={song.albumImageUrl}
                    />
                    <div className="song-info">
                        <div className="top-line">
                            <PlayingAnimation isPlaying={isPlaying} />
                            <a className="song-name" href={song.songUrl} target="_blank" rel="noopener noreferrer">{song.title}</a>
                        </div>
                        <p className="artist-name">{song.artist}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SpotifyNowPlaying
