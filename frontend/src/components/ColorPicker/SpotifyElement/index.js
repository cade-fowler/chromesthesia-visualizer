import './index.scss'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SpotifyNowPlaying from './SpotifyNowPlaying'

const SpotifyElement = (props) => {
    const REDIRECT_URI = "http://localhost:3000"
    const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
    const RESPONSE_TYPE = "code"
    const SCOPE = "user-read-currently-playing user-top-read"

    const [code, setCode] = useState("")
    
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

    const logout = () => {
        setCode("")
        window.localStorage.removeItem("code")
    }

    return (
        <div  className='spotify'>
            <div className="login-out">
                {!code ? 
                    <a href={`${AUTH_ENDPOINT}?client_id=${process.env.REACT_APP_SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`}>Login</a>
                    : <button onClick={logout}>Logout</button>
                }
            </div>
            <SpotifyNowPlaying colors={props.colors}/>
        </div>
    )
}

export default SpotifyElement