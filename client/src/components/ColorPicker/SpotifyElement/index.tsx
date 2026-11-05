import { useEffect, useRef, useState } from 'react';
import SpotifyNowPlaying from './SpotifyNowPlaying';
import ColorSwatch from './ColorSwatch/ColorSwatch';
import ColorEntryForm from './ColorEntryForm';
import { buttonClass } from './buttons';
import usePlaybackPosition from '../../../hooks/usePlaybackPosition';
import Timeline from '../../Timeline';
import { deleteColor, getColors, saveColor, updateColor } from '../../databaseAPI';
import { insertInSongOrder, replaceInSongOrder } from '../../../utils/colorOrder';
import { colorEntryChanges, fieldsFromEntry } from '../../../utils/colorEntryForm';
import {
    login,
    logout,
    getToken,
    getUsername,
    getNowPlayingItem,
    currentToken,
} from './SpotifyAPI';
import type { AddColorRequest, ColorEntry, HexColor, NowPlaying } from '@chromesthesia/shared';

const POLL_INTERVAL_MS = 5000;

interface SpotifyElementProps {
    /** The color currently selected in the picker */
    color: HexColor;
    /** Sets the picker's color (editing an entry loads its color into the picker) */
    onColorChange: (color: HexColor) => void;
}

const SpotifyElement = ({ color, onColorChange }: SpotifyElementProps) => {
    const [loggedIn, setLoggedIn] = useState(Boolean(currentToken.access_token));
    const [username, setUsername] = useState('');
    const [currentSong, setCurrentSong] = useState<NowPlaying | null>(null);
    // When currentSong was fetched, so the playback position can count forward between polls
    const [polledAt, setPolledAt] = useState(0);
    // Colors are stored with the song they were loaded for, so a stale list is never shown
    const [loadedColors, setLoadedColors] = useState<{
        songId: string;
        colors: ColorEntry[];
    } | null>(null);
    // The entry being edited, and the picker's color from before, to put back afterwards
    const [editing, setEditing] = useState<{ entry: ColorEntry; colorBefore: HexColor } | null>(
        null,
    );
    const exchangedCode = useRef(false);

    // Handle the redirect back from Spotify: swap ?code=... for tokens.
    // The ref guards against StrictMode running this twice (a code is single-use).
    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('code');
        if (!code || exchangedCode.current) return;
        exchangedCode.current = true;

        getToken(code)
            .then(() => setLoggedIn(true))
            .catch((err) => console.error(err))
            .finally(() => {
                // Remove ?code from the URL so a refresh doesn't reuse it
                const url = new URL(window.location.href);
                url.searchParams.delete('code');
                window.history.replaceState({}, document.title, url.href);
            });
    }, []);

    useEffect(() => {
        if (!loggedIn) return;
        getUsername().then(setUsername);
    }, [loggedIn]);

    // Poll Spotify for the currently playing song
    useEffect(() => {
        if (!loggedIn) return;
        let cancelled = false;

        const poll = async () => {
            const song = await getNowPlayingItem().catch(() => null);
            if (cancelled) return;
            if (!currentToken.access_token) {
                setLoggedIn(false); // refresh failed, tokens were cleared
                return;
            }
            setCurrentSong(song);
            setPolledAt(Date.now());
        };

        poll();
        const interval = setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [loggedIn]);

    // Load saved colors whenever the song changes
    const songId = currentSong?.id;
    useEffect(() => {
        if (!songId) return;
        let cancelled = false;
        getColors(songId).then((colors) => {
            if (!cancelled) setLoadedColors({ songId, colors });
        });
        return () => {
            cancelled = true;
        };
    }, [songId]);
    const colors = loadedColors && loadedColors.songId === songId ? loadedColors.colors : [];
    // Editing ends when the song changes
    const editingEntry = editing && editing.entry.songId === songId ? editing.entry : null;

    const handleLogout = () => {
        logout();
        setLoggedIn(false);
        setUsername('');
        setCurrentSong(null);
    };

    const positionMs = usePlaybackPosition(currentSong, polledAt);

    // Throws on failure so the form keeps its values and shows the error
    const handleSave = async (request: AddColorRequest) => {
        if (!currentSong) return;
        const saved = await saveColor(currentSong, request);
        setLoadedColors((prev) => ({
            songId: saved.songId,
            colors: prev?.songId === saved.songId ? insertInSongOrder(prev.colors, saved) : [saved],
        }));
    };

    const startEditing = (entry: ColorEntry) => {
        // Switching from one entry to another keeps the color from before the first
        setEditing((prev) => ({ entry, colorBefore: prev ? prev.colorBefore : color }));
        onColorChange(entry.color);
    };

    const stopEditing = () => {
        if (editing) onColorChange(editing.colorBefore);
        setEditing(null);
    };

    // Throws on failure so the form keeps its values and shows the error
    const handleUpdate = async (request: AddColorRequest) => {
        if (!editingEntry) return;
        const changes = colorEntryChanges(editingEntry, request);
        if (Object.keys(changes).length > 0) {
            const updated = await updateColor(editingEntry.id, changes);
            setLoadedColors((prev) =>
                prev ? { ...prev, colors: replaceInSongOrder(prev.colors, updated) } : prev,
            );
        }
        stopEditing();
    };

    // Throws on failure so the swatch or form can stay put and let you retry
    const handleDelete = async (id: string) => {
        await deleteColor(id);
        setLoadedColors((prev) =>
            prev ? { ...prev, colors: prev.colors.filter((entry) => entry.id !== id) } : prev,
        );
        if (editingEntry?.id === id) stopEditing();
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-panel p-[5%] text-white">
            <div className="flex items-center justify-between">
                <span>{username ? `Hi, ${username}` : 'Not connected to Spotify'}</span>
                {loggedIn ? (
                    <button onClick={handleLogout} className={buttonClass}>
                        Logout
                    </button>
                ) : (
                    <button onClick={login} className={buttonClass}>
                        Login
                    </button>
                )}
            </div>
            <SpotifyNowPlaying song={currentSong} />
            {currentSong && (
                <Timeline
                    entries={colors}
                    durationMs={currentSong.durationMs}
                    positionMs={positionMs}
                    selectedId={editingEntry?.id}
                    onSelect={startEditing}
                />
            )}
            {editingEntry && (
                <ColorEntryForm
                    key={editingEntry.id}
                    editing
                    initial={fieldsFromEntry(editingEntry)}
                    color={color}
                    positionMs={positionMs}
                    durationMs={currentSong?.durationMs}
                    onSubmit={handleUpdate}
                    onCancel={stopEditing}
                    onDelete={() => handleDelete(editingEntry.id)}
                />
            )}
            {/* Hidden rather than unmounted while editing, so it keeps what you'd typed. Keyed
                by song so a new song starts empty. The part stays filled in after saving, so
                several colors can go on the same part. */}
            <div className={editingEntry ? 'hidden' : undefined}>
                <ColorEntryForm
                    key={songId ?? 'none'}
                    color={color}
                    positionMs={positionMs}
                    durationMs={currentSong?.durationMs}
                    disabled={!currentSong}
                    onSubmit={handleSave}
                />
            </div>
            <div className="flex w-full flex-wrap pt-[3%]">
                {colors.length > 0 ? (
                    colors.map((entry) => (
                        <ColorSwatch
                            entry={entry}
                            key={entry.id}
                            onDelete={() => handleDelete(entry.id)}
                            onEdit={() => startEditing(entry)}
                        />
                    ))
                ) : (
                    <div>No colors have been set for this song.</div>
                )}
            </div>
        </div>
    );
};

export default SpotifyElement;
