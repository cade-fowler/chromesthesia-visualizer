export const getColors = async (id) => {
    if (!id) return false;
    
    const url = `http://localhost:5050/songs/${id}/colors/`;
    const response = await fetch(url)
      .catch(err => console.error(err));
    return response.json();
}

export const postSong = async () => {
    // const response = await fetch
}