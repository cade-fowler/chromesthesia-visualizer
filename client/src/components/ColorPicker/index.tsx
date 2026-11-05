import { useState } from 'react';
import type { HexColor } from '@chromesthesia/shared';
import ColorPickerElement from './ColorPickerElement';
import SpotifyElement from './SpotifyElement';

const ColorPicker = () => {
    const [currentColor, setCurrentColor] = useState<HexColor>('#ffffff');

    return (
        <div className="flex h-full w-full flex-wrap items-stretch justify-evenly max-[1074px]:max-h-1/2">
            <div className="h-full min-w-[538px] flex-1 basis-0">
                <SpotifyElement color={currentColor} onColorChange={setCurrentColor} />
            </div>
            <div className="h-full min-w-[538px] flex-1 basis-0">
                <ColorPickerElement color={currentColor} onColorChange={setCurrentColor} />
            </div>
        </div>
    );
};

export default ColorPicker;
