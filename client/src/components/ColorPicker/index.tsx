import { useState } from 'react';
import type { HexColor } from '@chromesthesia/shared';
import ColorPickerElement from './ColorPickerElement';
import SpotifyElement from './SpotifyElement';

// Desktop (lg): the Spotify panel and the picker side by side, each filling the height.
// Smaller screens: a compact picker on top and the Spotify panel below, scrolling as one page.
const ColorPicker = () => {
    const [currentColor, setCurrentColor] = useState<HexColor>('#ffffff');

    return (
        <div className="flex flex-col lg:h-full lg:flex-row">
            <div className="h-[min(22rem,52dvh)] shrink-0 lg:order-2 lg:h-full lg:min-w-0 lg:flex-1">
                <ColorPickerElement color={currentColor} onColorChange={setCurrentColor} />
            </div>
            <div className="lg:order-1 lg:h-full lg:min-w-0 lg:flex-1 lg:overflow-y-auto">
                <SpotifyElement color={currentColor} onColorChange={setCurrentColor} />
            </div>
        </div>
    );
};

export default ColorPicker;
