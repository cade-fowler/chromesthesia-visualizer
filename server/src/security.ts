import helmet from 'helmet';

// Spotify's album art hosts. Track images are on i.scdn.co today; the others are its newer CDN.
const SPOTIFY_IMAGES = ['https://*.scdn.co', 'https://*.spotifycdn.com'];
// The browser talks to Spotify directly (PKCE login and now playing); there's no proxy here
const SPOTIFY_APIS = ['https://accounts.spotify.com', 'https://api.spotify.com'];

/**
 * Security headers for every response, from helmet. The Content-Security-Policy matters once
 * Express serves the built client: only this site's own scripts can run, so injected markup
 * can't run code that writes with the owner's cookie, and no other site can frame the page.
 * In dev Vite serves the page and these only reach /api responses.
 */
export const securityHeaders = () =>
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                // React sets runtime colors through style attributes
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', ...SPOTIFY_IMAGES],
                fontSrc: ["'self'", 'data:'],
                connectSrc: ["'self'", ...SPOTIFY_APIS],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
            },
        },
    });
