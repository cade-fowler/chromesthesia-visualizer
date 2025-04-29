import './index.scss'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SpotifyNowPlaying from './SpotifyNowPlaying'
import { getUsername, getNowPlayingItem } from './SpotifyAPI'
import { postSong } from '../../databaseAPI'
import ColorSwatch from './ColorSwatch/ColorSwatch'
import { getColors } from '../../databaseAPI'

const SpotifyElement = (props) => {
    const REDIRECT_URI = "http://localhost:3000"
    const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
    const RESPONSE_TYPE = "code"
    const SCOPE = "user-read-currently-playing user-top-read user-read-private"

    const [code, setCode] = useState("")
    const [username, setUsername] = useState("")

    const [currentSong, setCurrentSong] = useState({id: 0, isPlaying: false})

    const [colors, setColors] = useState([]);

    useEffect(() => {
        Promise.all([
            getUsername(
                props.client_id,
                props.client_secret,
                props.refresh_token
            ),
        ]).then((results) => {
            setUsername(results[0]);
        });
    }, [props.client_id, props.client_secret, props.refresh_token]);
    
    const [queryParameters] = useSearchParams()

    useEffect(() => {
        let code = queryParameters.get("code")
        let storageCode = window.localStorage.getItem("code")
    
        if (!storageCode && code) {
            storageCode = code
    
            window.location.hash = ""
            window.localStorage.setItem("code", code)
            console.log(window.localStorage.getItem("code"))
        }
        setCode(code)
    }, [queryParameters])

    useEffect(() => {
        const spotifyTimeout = setTimeout(() => {
            Promise.all([
                getNowPlayingItem(
                    props.client_id,
                    props.client_secret,
                    props.refresh_token
                ),
            ]).then((results) => {
                setCurrentSong(results[0]);
                if (currentSong) {
                    // Promise.all([getColors(currentSong.id)])
                    Promise.all([getColors("2kXjRzwcTZhGLnVjUud8l3")])
                        .then((results) => {
                            setColors(results[0]);
                            console.log(colors)
                        }
                    );
                }
            }).catch(err => console.log(err));
        }, 5000);
    });

    const logout = () => {
        setCode("")
        setUsername("")
        window.localStorage.removeItem("code")
    }

    return (
        <div  className='spotify'>
            {username ? "Hi, " + username : "No name"}
            <div className="login-out">
                {!code ? 
                    <a 
                        href={`${AUTH_ENDPOINT}?client_id=${process.env.REACT_APP_SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`}
                        className='main-button'
                    >
                        Login
                        </a>
                    : <button onClick={logout} className='main-button'>Logout</button>
                }
            </div>
            <SpotifyNowPlaying 
                song={currentSong}
            />
            <div className="swatch-box">
                { Array.isArray(colors) ? 
                    colors.map(color => (
                        <ColorSwatch color={color}/>
                    )) 
                    : ( <div>No colors have been set for this song.</div> )
                }
            </div>
            {/* <div className="temp">
                id = {currentSong ? currentSong.id : "No ID"}
                color = {props.color}
                <div style={{'background': props.color}}>{props.color}</div>
            </div> */}
            <div>
                <button onClick={_ => postSong(currentSong, props.color)} className='main-button'>Save</button>
            </div>
        </div>
    )
}

export default SpotifyElement