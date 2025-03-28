export const getColors = async () => {
    const response = await fetch('http://localhost:5050/songs/665ec2b315dc2b43dccdc176/colors')
      .catch(err => console.error(err));
    return response.json();
}

export const postSong = async () => {
    // const response = await fetch
}