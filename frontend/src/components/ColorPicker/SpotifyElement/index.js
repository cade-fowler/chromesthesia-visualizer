import './index.scss'
import { useEffect, useState } from 'react'
// import { useSearchParams } from 'react-router-dom'
import SpotifyNowPlaying from './SpotifyNowPlaying'
import { getUsername, getNowPlayingItem } from './SpotifyAPI'
import { postSong } from '../../databaseAPI'
import ColorSwatch from './ColorSwatch/ColorSwatch'
import { getColors } from '../../databaseAPI'
import { login, getToken, currentToken } from './SpotifyAPI'

const SpotifyElement = (props) => {
    // const REDIRECT_URI = "http://localhost:3000"
    // const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
    // const RESPONSE_TYPE = "code"
    // const SCOPE = "user-read-currently-playing user-top-read user-read-private"

    const [username, setUsername] = useState("")

    const [currentSong, setCurrentSong] = useState({id: 0, isPlaying: false})

    const [colors, setColors] = useState([]);

    useEffect(() => {
        Promise.all([
            getUsername()
        ]).then((results) => {
            setUsername(results[0]);
        });
    }, [props.client_id, props.client_secret, props.refresh_token]);

    useEffect(() => {
        // On page load, try to fetch auth code from current browser search URL
        const args = new URLSearchParams(window.location.search);
        const code = args.get('code');

        console.log(code)
        console.log('lajsdlkjslkdsjfldksj')
        // If we find a code, we're in a callback, do a token exchange
        if (code) {
            async function updateToken() {
                const token = await getToken(code);
                if ('access_token' in token) {
                    console.log('getting there')
                    console.log(token.access_token)
                    window.localStorage.setItem('access_token', token.access_token)
                }

                // Remove code from URL so we can refresh correctly.
                const url = new URL(window.location.href);
                url.searchParams.delete("code");

                const updatedUrl = url.search ? url.href : url.href.replace('?', '');
                window.history.replaceState({}, document.title, updatedUrl);
                console.log('222')
            }
            updateToken();
            console.log('111')
        }

        // If we have a token, we're logged in, so fetch user data and render logged in template
        if (currentToken.access_token) {
            console.log('no fuck')
        }

        // Otherwise we're not logged in, so render the login template
        if (!currentToken.access_token) {
            console.log('fuck')  
        }
    }, [])

    const logout = () => {
        setUsername("")
        window.localStorage.removeItem("access_token")
    }

    return (
        <div  className='spotify'>
            {username ? "Hi, " + username : "No name"}
            <div className="login-out">
                {!currentToken.access_token ?  
                    <button onClick={login}>Login</button> :
                    <button onClick={logout}>Logout</button>
                } 
            </div>
            <SpotifyNowPlaying 
                song={currentSong}
            />
            <div className="swatch-box">
                { Array.isArray(colors) ? 
                    colors.map(color => (
                        <ColorSwatch color={color} key={color} songId={currentSong.id}/>
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