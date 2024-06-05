import './index.scss'
import { useEffect, useState } from 'react';
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'

const SpotifyElement = () => {
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

    const requestAccessToken =  async () => {
        const { data } = await axios.post("https://accounts.spotify.com/api/token", {
            headers: {
                Authorization: `Bearer `,
                Content_Type: "application/x-www-form-urlencoded"
            },
            params: {
                grant_type: "authorization_code",
                code: `${window.localStorage.getItem("code")}`,
                redirect_uri: `${REDIRECT_URI}`
            }
        })
    }

    return (
        <div  className='spotify'>
            {!code ? 
                <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`}>Login to Spotify</a>
                : <button onClick={logout}>Logout</button>
            }
        </div>
    )
}

export default SpotifyElement