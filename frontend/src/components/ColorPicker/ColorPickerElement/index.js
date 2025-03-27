import './index.scss'
import { useState } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'

const ColorPickerElement = () => {
    const [color, setColor] = useState('#f5f5f5')
    
    const isDark = () => {
        var red = parseInt(color.substring(1, 3), 16)
        var green = parseInt(color.substring(3, 5), 16)
        var blue = parseInt(color.substring(5, 7), 16)
        return (red + green + blue) / 3 <= 140
    }

    var style = {
        backgroundColor: color,
        color: isDark(color) ? "#f5f5f5" : "#1c1c1c"
    }

    const saveColor = () => {

    }

    return (
        <div style={style} className='color-picker'>
            <HexColorPicker color={color} onChange={setColor} />
            <HexColorInput color={color} onChange={setColor} style={style} prefixed='true'/>
            <button onClick={saveColor}>Save</button>
        </div>
    )
}

export default ColorPickerElement