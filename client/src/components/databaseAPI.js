export const getColors = async (id) => {
    if (!id) return [];

    const response = await fetch(`/api/songs/${id}/colors`);
    if (!response.ok) return [];
    return response.json();
}

export const postSong = async (song, color) => {
    // Copy instead of mutating: `song` is React state owned by the caller.
    const { artist, isPlaying, ...rest } = song;
    const body = {
        ...rest,
        artists: artist.split(",").map(a => a.trim()),
        color,
    };

    const response = await fetch('/api/songs', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Saving color failed (${response.status})`);
    return response.json();
}
