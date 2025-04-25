export const getColors = async (id) => {
    if (!id) return false;
    
    const url = `http://localhost:5050/songs/${id}/colors/`;
    const response = await fetch(url)
      .catch(err => console.error(err));
    return response.json().catch(err => console.error("JSON ERROR"));
}

export const postSong = async (data) => {
    console.log("Posting:")
    console.log(data)
    // TODO split multiple artists
    const response = await fetch('http://localhost:5050/songs/', {
        method: "POST",
        body: JSON.stringify(data)
    }).catch(err => console.error(err))
    return response.json().catch(err => console.error("JSON ERROR"));
}