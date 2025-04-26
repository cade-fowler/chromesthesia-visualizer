import querystring from 'querystring'
import { Buffer } from 'buffer'

const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const USER_ENDPOINT = `https://api.spotify.com/v1/me`
const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;

const redirectUri = 'http://localhost:3000';
const scope = 'user-read-private user-read-currently-playing';
const authorizationEndpoint = "https://accounts.spotify.com/authorize";


// Data structure that manages the current active token, caching it in localStorage
export const currentToken = {
    get access_token() { return localStorage.getItem('access_token') || null; },
    get refresh_token() { return localStorage.getItem('refresh_token') || null; },
    get expires_in() { return localStorage.getItem('refresh_in') || null },
    get expires() { return localStorage.getItem('expires') || null },
  
    save: function (response) {
      const { access_token, refresh_token, expires_in } = response;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('expires_in', expires_in);
  
      const now = new Date();
      const expiry = new Date(now.getTime() + (expires_in * 1000));
      localStorage.setItem('expires', expiry);
    }
  };


export const login = async () => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    const randomString = randomValues.reduce((acc, x) => acc + possible[x % possible.length], "");
    
    const code_verifier = randomString;
    const data = new TextEncoder().encode(code_verifier);
    const hashed = await crypto.subtle.digest('SHA-256', data);
    
    const code_challenge_base64 = btoa(String.fromCharCode(...new Uint8Array(hashed)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    
    window.localStorage.setItem('code_verifier', code_verifier);
    
    const authUrl = new URL(authorizationEndpoint)
    const params = {
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        code_challenge_method: 'S256',
        code_challenge: code_challenge_base64,
        redirect_uri: redirectUri,
    };
    
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
}

// Soptify API Calls
export async function getToken(code) {
    const code_verifier = localStorage.getItem('code_verifier');
  
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: code_verifier,
      }),
    });
  
    return await response.json();
  }
  
export async function refreshToken() {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: currentToken.refresh_token
      }),
    });
  
    return await response.json();
  }
  

















// const getAccessToken = async () => {
//     const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
//     const response = await fetch(TOKEN_ENDPOINT, {
//         method: "POST",
//         headers: {
//             Authorization: `Basic ${basic}`,
//             "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: querystring.stringify({
//             grant_type: "refresh_token",
//             refresh_token,
//         }),
//     }).catch(err => console.log(err))
    
//     return response.json().catch(err => console.log(err))
// }

export const getUsername = async () => {
    const response = await fetch(USER_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
    }).catch(err => console.log(err))

    if (response.status === 204 || response.status > 400) {
        return false
    }

    const user = await response.json()
    return user.display_name
}

export const getNowPlaying = async (client_id, client_secret, refresh_token) => {
    // const { access_token } = await getAccessToken(
    //     client_id,
    //     client_secret,
    //     refresh_token
    // )
    return fetch(NOW_PLAYING_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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