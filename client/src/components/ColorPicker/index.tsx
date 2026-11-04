import './index.scss'
import ColorPickerElement from './ColorPickerElement'
import SpotifyElement from './SpotifyElement'
import { useState } from 'react'
import type { HexColor } from '../../types'

const ColorPicker = () => {
    const [currentColor, setCurrentColor] = useState<HexColor>('#ffffff');

    return (
        <div className='container'>
            <div className="box">
                <SpotifyElement color={currentColor}/>
            </div>
            <div className="box">
                <ColorPickerElement
                    color={currentColor}
                    onColorChange={setCurrentColor}    
                />
            </div>
        </div>
        
    )
}

export default ColorPicker