import './index.scss'
import { HexColorPicker, HexColorInput } from 'react-colorful'

const ColorPickerElement = (props) => {
    // const [color, setColor] = useState('#f5f5f5')
    // const changeColor = (color) => {
    //     setColor(color)
    //     props.onColorChange(color)
    // }
    
    const isDark = () => {
        var red = parseInt(props.color.substring(1, 3), 16)
        var green = parseInt(props.color.substring(3, 5), 16)
        var blue = parseInt(props.color.substring(5, 7), 16)
        return (red + green + blue) / 3 <= 140
    }

    var style = {
        backgroundColor: props.color,
        color: isDark(props.color) ? "#f5f5f5" : "#1c1c1c"
    }


    return (
        <div style={style} className='color-picker'>
            <HexColorPicker color={props.color} onChange={c => props.onColorChange(c)} />
            <HexColorInput color={props.color} onChange={c => props.onColorChange(c)} style={style} prefixed='true'/>
            {/* <button onClick={saveColor}>Save</button> */}
        </div>
    )
}

export default ColorPickerElement