import React, { useEffect, useState } from "react";
import { getNowPlayingItem } from "./SpotifyAPI";
// import SpotifyLogo from "./SpotifyLogo";
import PlayingAnimation from "./PlayingAnimation";
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getColors } from '../../databaseAPI'
import './index.scss'

const SpotifyNowPlaying = (props) => {
    const [loading, setLoading] = useState(true);
    const [colors, setColors] = useState([]);

    useEffect(() => {
        const spotifyTimeout = setTimeout(() => {
            Promise.all([
                getNowPlayingItem(
                    props.client_id,
                    props.client_secret,
                    props.refresh_token
                ),
            ]).then((results) => {
                props.onSongChange(results[0]);
                setLoading(false);

                if (props.song) {
                    Promise.all([getColors(props.song.id)])
                        .then((results) => {
                            setColors(results[0]);
                        }
                    );
                }
            }).catch(err => console.log(err));
        }, 5000);
    });

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
            <div className="swatch-box">
                { Array.isArray(colors) ? 
                    colors.map(color => (
                        <div className="swatch" style={{'background': color}} key={color}>{color}</div> //TODO fix key when duplicate colors
                    )) 
                    : ( <div>No Colors</div> )
                }
            </div>
            
            
            {/* <div>
                {songId}
            </div> */}
        </div>
    )
};

export default SpotifyNowPlaying;
