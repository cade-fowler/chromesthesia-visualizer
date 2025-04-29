import PlayingAnimation from "./PlayingAnimation";
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './index.scss'

const SpotifyNowPlaying = (props) => {
    return (
        <div className="player">
            <div className="status">
                <div className="logo">
                    <FontAwesomeIcon icon={faSpotify} color='#1ad861'/>
                </div>
                <p className="status-text">{props.song.isPlaying ? 'Now playing' : "Currently offline"}</p>
            </div>
            <div className="song-box"> 
                <img className="album-art"
                    alt={`${props.song.title} album art`}
                    src={props.song.albumImageUrl}
                />
                <div className="song-info">
                    <div className="top-line">
                        <PlayingAnimation isPlaying={props.song.isPlaying}/>
                        <a className="song-name" href={props.song.songUrl} target="_blank" rel="noopener noreferrer">{props.song.title}</a>
                    </div>
                    <p className="artist-name">{props.song.artist}</p>
                </div>
            </div>
        </div>
    )
};

export default SpotifyNowPlaying;
