import './index.scss'
import ColorPickerElement from './ColorPickerElement'
import SpotifyElement from './SpotifyElement'
import { useState, useEffect } from 'react'
import { getColors } from '../databaseAPI'

const ColorPicker = () => {
    // const saveColor = (color) => {
    //     console.log(color);
    // }

    const [currentColor, setCurrentColor] = useState('');
    const [colors, setColors] = useState([]);

    useEffect(() => {
        Promise.all([getColors()])
            .then((results) => {
                setColors(results[0]);
            }
        );
    }, []);

    return (
        <div className='container'>
            <div className="box">
                <SpotifyElement colors={colors}/>
            </div>
            <div className="box">
                <ColorPickerElement
                    color={currentColor}
                    onColorChange={setCurrentColor}    
                />
            </div>
            {/* <div>{currentColor}</div> */}
        </div>
        
    )
}

export default ColorPicker