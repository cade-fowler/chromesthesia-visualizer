import './index.scss'
import { useEffect, useRef, useState } from 'react'
import SpotifyNowPlaying from './SpotifyNowPlaying'
import ColorSwatch from './ColorSwatch/ColorSwatch'
import { getColors, postSong } from '../../databaseAPI'
import { login, logout, getToken, getUsername, getNowPlayingItem, currentToken } from './SpotifyAPI'

const POLL_INTERVAL_MS = 5000
const NO_SONG = { id: null, isPlaying: false }

const SpotifyElement = (props) => {
    const [loggedIn, setLoggedIn] = useState(Boolean(currentToken.access_token))
    const [username, setUsername] = useState('')
    const [currentSong, setCurrentSong] = useState(NO_SONG)
    const [colors, setColors] = useState([])
    const [saving, setSaving] = useState(false)
    const exchangedCode = useRef(false)

    // Handle the redirect back from Spotify: swap ?code=... for tokens.
    // The ref guards against StrictMode running this twice (a code is single-use).
    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('code')
        if (!code || exchangedCode.current) return
        exchangedCode.current = true

        getToken(code)
            .then(() => setLoggedIn(true))
            .catch(err => console.error(err))
            .finally(() => {
                // Remove ?code from the URL so a refresh doesn't reuse it
                const url = new URL(window.location.href)
                url.searchParams.delete('code')
                window.history.replaceState({}, document.title, url.href)
            })
    }, [])

    useEffect(() => {
        if (!loggedIn) return
        getUsername().then(setUsername)
    }, [loggedIn])

    // Poll Spotify for the currently playing song
    useEffect(() => {
        if (!loggedIn) return
        let cancelled = false

        const poll = async () => {
            const song = await getNowPlayingItem().catch(() => null)
            if (cancelled) return
            if (!currentToken.access_token) {
                setLoggedIn(false) // refresh failed, tokens were cleared
                return
            }
            setCurrentSong(song ?? NO_SONG)
        }

        poll()
        const interval = setInterval(poll, POLL_INTERVAL_MS)
        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [loggedIn])

    // Load saved colors whenever the song changes
    useEffect(() => {
        if (!currentSong.id) {
            setColors([])
            return
        }
        let cancelled = false
        getColors(currentSong.id).then(c => { if (!cancelled) setColors(c) })
        return () => { cancelled = true }
    }, [currentSong.id])

    const handleLogout = () => {
        logout()
        setLoggedIn(false)
        setUsername('')
        setCurrentSong(NO_SONG)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const saved = await postSong(currentSong, props.color)
            setColors(saved.colors ?? [])
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className='spotify'>
            {username ? `Hi, ${username}` : 'Not connected to Spotify'}
            <div className="login-out">
                {loggedIn
                    ? <button onClick={handleLogout}>Logout</button>
                    : <button onClick={login}>Login</button>
                }
            </div>
            <SpotifyNowPlaying song={currentSong} />
            <div className="swatch-box">
                {colors.length > 0
                    ? colors.map(color => <ColorSwatch color={color} key={color} />)
                    : <div>No colors have been set for this song.</div>
                }
            </div>
            <div>
                <button
                    onClick={handleSave}
                    disabled={!currentSong.id || saving}
                    className='main-button'
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    )
}

export default SpotifyElement
