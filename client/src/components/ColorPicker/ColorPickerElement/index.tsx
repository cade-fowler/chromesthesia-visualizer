import './index.scss'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import type { HexColor } from '@chromesthesia/shared'
import { textColorOn } from '../../../utils/color'

interface ColorPickerElementProps {
    color: HexColor
    onColorChange: (color: HexColor) => void
}

const ColorPickerElement = ({ color, onColorChange }: ColorPickerElementProps) => {
    const style = {
        backgroundColor: color,
        color: textColorOn(color),
    }

    return (
        <div style={style} className='color-picker'>
            <HexColorPicker color={color} onChange={onColorChange} />
            <HexColorInput color={color} onChange={onColorChange} style={style} prefixed />
        </div>
    )
}

export default ColorPickerElement
