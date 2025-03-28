import './index.scss'
import ColorPickerElement from './ColorPickerElement'
import SpotifyElement from './SpotifyElement'
import { useState } from 'react'

const ColorPicker = () => {
    // const saveColor = (color) => {
    //     console.log(color);
    // }

    const [currentColor, setCurrentColor] = useState('');

    return (
        <div className='container'>
            <div className="box">
                <SpotifyElement/>
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