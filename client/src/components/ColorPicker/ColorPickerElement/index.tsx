import { HexColorPicker, HexColorInput } from 'react-colorful';
import type { HexColor } from '@chromesthesia/shared';

interface ColorPickerElementProps {
    color: HexColor;
    onColorChange: (color: HexColor) => void;
}

/** The picker in its bezel. The bezel's background is the picked color, so it's set inline. */
const ColorPickerElement = ({ color, onColorChange }: ColorPickerElementProps) => (
    <div className="flex h-full flex-col bg-case-dark p-5 lg:border-l lg:border-edge lg:p-9">
        <div
            className="flex min-h-0 flex-1 flex-col gap-3 bezel p-3 lg:gap-4 lg:p-5"
            style={{ backgroundColor: color }}
        >
            <div className="min-h-0 flex-1">
                <HexColorPicker color={color} onChange={onColorChange} />
            </div>
            <HexColorInput
                color={color}
                onChange={onColorChange}
                prefixed
                aria-label="Hex color"
                className="mx-auto h-9 w-36 shrink-0 well text-center font-mono text-lg tracking-[0.06em] uppercase"
            />
        </div>
    </div>
);

export default ColorPickerElement;
