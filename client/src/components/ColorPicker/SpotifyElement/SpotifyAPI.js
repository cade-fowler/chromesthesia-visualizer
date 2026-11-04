const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const USER_ENDPOINT = `https://api.spotify.com/v1/me`
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

// Spotify requires the redirect URI to exactly match one registered in the dashboard
const redirectUri = window.location.origin;
const scope = 'user-read-private user-read-currently-playing';
const authorizationEndpoint = "https://accounts.spotify.com/authorize";


// Data structure that manages the current active token, caching it in localStorage
export const currentToken = {
    get access_token() { return localStorage.getItem('access_token') || null; },
    get refresh_token() { return localStorage.getItem('refresh_token') || null; },
    get expires_in() { return localStorage.getItem('expires_in') || null },
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

export const logout = () => {
    ['access_token', 'refresh_token', 'expires_in', 'expires', 'code_verifier']
        .forEach(key => localStorage.removeItem(key));
};

const postToken = async (params) => {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, ...params }),
    });
    const token = await response.json();
    if (!response.ok || !token.access_token) {
        throw new Error(token.error_description || 'Spotify token request failed');
    }
    currentToken.save(token);
    return token;
};

// Exchange the ?code=... from the login redirect for tokens
export const getToken = (code) => postToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: localStorage.getItem('code_verifier'),
});

export const refreshToken = () => postToken({
    grant_type: 'refresh_token',
    refresh_token: currentToken.refresh_token,
});

// Returns a usable access token, refreshing it first if it has expired
const getAccessToken = async () => {
    if (!currentToken.access_token) return null;
    const expires = currentToken.expires ? new Date(currentToken.expires) : null;
    if (expires && expires.getTime() - Date.now() < 60_000) {
        try {
            await refreshToken();
        } catch {
            logout();
            return null;
        }
    }
    return currentToken.access_token;
};

const spotifyGet = async (url) => {
    const token = await getAccessToken();
    if (!token) return null;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    // 204 = nothing playing
    if (response.status === 204 || !response.ok) return null;
    return response.json();
};

export const getUsername = async () => {
    const user = await spotifyGet(USER_ENDPOINT);
    return user?.display_name ?? '';
};

export const getNowPlayingItem = async () => {
    const playback = await spotifyGet(NOW_PLAYING_ENDPOINT);
    // item is null for ads, and podcasts have no album/artists
    const item = playback?.item;
    if (!item || item.type !== 'track') return null;

    return {
        albumImageUrl: item.album.images[0]?.url,
        artist: item.artists.map(artist => artist.name).join(', '),
        isPlaying: playback.is_playing,
        songUrl: item.external_urls.spotify,
        title: item.name,
        id: item.id,
    };
};
