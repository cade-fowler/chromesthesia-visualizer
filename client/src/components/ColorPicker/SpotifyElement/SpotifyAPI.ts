import type { NowPlaying } from '@chromesthesia/shared';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const AUTHORIZATION_ENDPOINT = 'https://accounts.spotify.com/authorize';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const USER_ENDPOINT = 'https://api.spotify.com/v1/me';

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// Spotify requires the redirect URI to exactly match one registered in the dashboard
const redirectUri = window.location.origin;
const scope = 'user-read-private user-read-currently-playing';

/** Response body from Spotify's token endpoint. */
interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
}

/** The parts of Spotify's currently-playing response that we use. */
interface SpotifyPlayback {
    is_playing: boolean;
    progress_ms: number | null;
    item: {
        id: string;
        name: string;
        duration_ms: number;
        type: 'track' | 'episode';
        album: { images: { url: string }[] };
        artists: { name: string }[];
        external_urls: { spotify: string };
    } | null;
}

/** Access/refresh tokens, persisted in localStorage. */
export const currentToken = {
    get access_token() {
        return localStorage.getItem('access_token');
    },
    get refresh_token() {
        return localStorage.getItem('refresh_token');
    },
    get expires() {
        return localStorage.getItem('expires');
    },

    save(response: TokenResponse) {
        localStorage.setItem('access_token', response.access_token);
        // Spotify may omit refresh_token on refresh; keep the old one in that case
        if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
        }
        const expiry = new Date(Date.now() + response.expires_in * 1000);
        localStorage.setItem('expires', expiry.toISOString());
    },
};

const TOKEN_KEYS = ['access_token', 'refresh_token', 'expires', 'expires_in', 'code_verifier'];

export const logout = () => {
    TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
};

/** Start the Authorization Code + PKCE flow by redirecting to Spotify. */
export const login = async () => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codeVerifier = Array.from(
        crypto.getRandomValues(new Uint8Array(64)),
        (x) => possible[x % possible.length],
    ).join('');

    const hashed = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hashed)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    localStorage.setItem('code_verifier', codeVerifier);

    const authUrl = new URL(AUTHORIZATION_ENDPOINT);
    authUrl.search = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
    }).toString();
    window.location.href = authUrl.toString();
};

const postToken = async (params: Record<string, string>): Promise<TokenResponse> => {
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

/** Exchange the ?code=... from the login redirect for tokens. */
export const getToken = (code: string) =>
    postToken({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: localStorage.getItem('code_verifier') ?? '',
    });

export const refreshToken = () =>
    postToken({
        grant_type: 'refresh_token',
        refresh_token: currentToken.refresh_token ?? '',
    });

/** Returns a usable access token, refreshing it first if it is about to expire. */
const getAccessToken = async (): Promise<string | null> => {
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

const spotifyGet = async <T>(url: string): Promise<T | null> => {
    const token = await getAccessToken();
    if (!token) return null;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    // 204 = nothing playing
    if (response.status === 204 || !response.ok) return null;
    return response.json() as Promise<T>;
};

export const getUsername = async (): Promise<string> => {
    const user = await spotifyGet<{ display_name: string | null }>(USER_ENDPOINT);
    return user?.display_name ?? '';
};

export const getNowPlayingItem = async (): Promise<NowPlaying | null> => {
    const playback = await spotifyGet<SpotifyPlayback>(NOW_PLAYING_ENDPOINT);
    // item is null for ads, and podcasts have no album/artists
    const item = playback?.item;
    if (!playback || !item || item.type !== 'track') return null;

    return {
        id: item.id,
        title: item.name,
        artist: item.artists.map((artist) => artist.name).join(', '),
        albumImageUrl: item.album.images[0]?.url,
        songUrl: item.external_urls.spotify,
        isPlaying: playback.is_playing,
        progressMs: playback.progress_ms ?? 0,
        durationMs: item.duration_ms,
    };
};
