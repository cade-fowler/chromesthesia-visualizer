export const getColors = async (id) => {
    if (!id) return false;
    
    const url = `http://localhost:5050/songs/${id}/colors/`;
    const response = await fetch(url)
      .catch(err => console.error(err));
    return response.json().catch(err => console.error("JSON ERROR"));
}

export const postSong = async (song, color) => {
    let newSong = song;
    newSong.color = color
    newSong.artists = song.artist.split(",")
    delete newSong.artist
    delete newSong.isPlaying

    const response = await fetch('http://localhost:5050/songs/', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newSong)
    }).catch(err => console.error(err))
    return response;
}