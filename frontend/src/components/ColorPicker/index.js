import './index.scss'
import ColorPickerElement from './ColorPickerElement'
import SpotifyElement from './SpotifyElement'
import { useState, useEffect } from 'react'

const ColorPicker = () => {
    // const saveColor = (color) => {
    //     console.log(color);
    // }

    const [currentColor, setCurrentColor] = useState('');
    const [colors, setColors] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5050/songs/665ec2b315dc2b43dccdc176/colors')
          .then(res => res.json())
          .then(json => setColors(json))
          .catch(err => console.error(err));
    }, []);

    const handleColorChange = (value) => setCurrentColor(value);

    return (
        <div className='container'>
            <div className="box">
                <SpotifyElement colors={colors}/>
            </div>
            <div className="box">
                <ColorPickerElement
                    color={currentColor}
                    onColorChange={handleColorChange}    
                />
            </div>
            {/* <div>{currentColor}</div> */}
        </div>
        
    )
}

export default ColorPicker