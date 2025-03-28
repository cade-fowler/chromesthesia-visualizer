import querystring from 'querystring'
import { Buffer } from 'buffer'

const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const USER_ENDPOINT = `https://api.spotify.com/v1/me`
const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const client_secret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.REACT_APP_SPOTIFY_REFRESH_TOKEN;


const getAccessToken = async () => {
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
    const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: querystring.stringify({
            grant_type: "refresh_token",
            refresh_token,
        }),
    }).catch(err => console.log(err))
    
    return response.json()
}

export const getUsername = async  (client_id, client_secret, refresh_token) => {
    const { access_token } = await getAccessToken(
        client_id,
        client_secret,
        refresh_token
    )
    const response = await fetch(USER_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    }).catch(err => console.log(err))

    if (response.status === 204 || response.status > 400) {
        return false
    }

    const user = await response.json()
    return user.display_name
}

export const getNowPlaying = async (client_id, client_secret, refresh_token) => {
    const { access_token } = await getAccessToken(
        client_id,
        client_secret,
        refresh_token
    )
    return fetch(NOW_PLAYING_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
}

export default async function getNowPlayingItem(
    client_id,
    client_secret,
    refresh_token
) {
    const response = await getNowPlaying(client_id, client_secret, refresh_token).catch(err => console.log(err))
    if (response === undefined || response.status === 204 || response.status > 400) {
        return false
    }
    const song = await response.json()
    const albumImageUrl = song.item.album.images[0].url
    const artist = song.item.artists.map((_artist) => _artist.name).join(", ")
    const isPlaying = song.is_playing
    const songUrl = song.item.external_urls.spotify
    const title = song.item.name
    const id = song.item.id
    
    return {
        albumImageUrl,
        artist,
        isPlaying,
        songUrl,
        title,
        id
    }
}