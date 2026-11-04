import { HexColorPicker, HexColorInput } from 'react-colorful'
import type { HexColor } from '@chromesthesia/shared'
import { textColorOn } from '../../../utils/color'

interface ColorPickerElementProps {
    color: HexColor
    onColorChange: (color: HexColor) => void
}

const ColorPickerElement = ({ color, onColorChange }: ColorPickerElementProps) => {
    // The background follows the picked color, so it has to be an inline style
    const style = {
        backgroundColor: color,
        color: textColorOn(color),
    }

    return (
        <div
            style={style}
            className="h-full w-full [&_.react-colorful]:h-4/5 [&_.react-colorful]:w-[90%] [&_.react-colorful]:p-[5%] [&_.react-colorful]:pb-0"
        >
            <HexColorPicker color={color} onChange={onColorChange} />
            <HexColorInput
                color={color}
                onChange={onColorChange}
                style={style}
                prefixed
                className="ml-[5%] w-[90%] border-none text-center text-base outline-none"
            />
        </div>
    )
}

export default ColorPickerElement
