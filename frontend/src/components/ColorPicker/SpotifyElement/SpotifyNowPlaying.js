import React, { useEffect, useState } from "react";
import getNowPlayingItem from "./SpotifyAPI";
import SpotifyLogo from "./SpotifyLogo";
import PlayingAnimation from "./PlayingAnimation";
import { faSpotify } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './index.scss'

const SpotifyNowPlaying = (props) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({});

  useEffect(() => {
    Promise.all([
      getNowPlayingItem(
        props.client_id,
        props.client_secret,
        props.refresh_token
      ),
    ]).then((results) => {
      setResult(results[0]);
      setLoading(false);
    });
  });

  console.log(result.songUrl)
  return (
    <div className="player">
        <div className="status">
            <div className="logo">
                <FontAwesomeIcon icon={faSpotify} color='#1ad861'/>
            </div>
            <p className="status-text">{result.isPlaying ? 'Now playing' : "Currently offline"}</p>
        </div>
        {result.isPlaying && 
            <div className="song-box"> 
                <img className="album-art"
                    alt={`${result.title} album art`}
                    src={result.albumImageUrl}
                />
                <div className="song-info">
                    <div className="top-line">
                        <div className="playing-animation">
                            <PlayingAnimation />
                        </div>
                        <a className="song-name" href={result.songUrl} target="_blank">{result.title}</a> 
                    </div>
                   <p className="artist-name">{result.artist}</p>
                </div>
            </div>
        }
    </div>
  )
};

export default SpotifyNowPlaying;
