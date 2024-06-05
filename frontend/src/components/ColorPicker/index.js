import './index.scss'
import ColorPickerElement from './ColorPickerElement'
import SpotifyElement from './SpotifyElement'

const ColorPicker = () => {
    return (
        <div className='container'>
            <div className="box">
                <SpotifyElement/>
            </div>
            <div className="box">
                <ColorPickerElement/>
            </div>
        </div>
        
    )
}

export default ColorPicker