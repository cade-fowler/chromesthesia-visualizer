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
        // Centers the picker + hex input as a group, both ways
        <div style={style} className="flex h-full w-full flex-col items-center justify-center gap-2">
            {/* react-colorful injects unlayered CSS (200px x 200px), which beats Tailwind's
                layered utilities regardless of specificity, so the size needs `!` (important) */}
            <HexColorPicker
                color={color}
                onChange={onColorChange}
                className="h-4/5! w-[90%]!"
            />
            <HexColorInput
                color={color}
                onChange={onColorChange}
                style={style}
                prefixed
                className="w-[90%] border-none text-center text-base outline-none"
            />
        </div>
    )
}

export default ColorPickerElement
