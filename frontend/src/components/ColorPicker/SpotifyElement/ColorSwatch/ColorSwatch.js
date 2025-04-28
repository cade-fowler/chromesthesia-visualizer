import './ColorSwatch.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrashCan } from '@fortawesome/free-regular-svg-icons'

const ColorSwatch = (props) => {

    const isDark = () => {
        var red = parseInt(props.color.substring(1, 3), 16)
        var green = parseInt(props.color.substring(3, 5), 16)
        var blue = parseInt(props.color.substring(5, 7), 16)
        return (red + green + blue) / 3 <= 140
    }

    //TODO fix key when duplicate colors
    return (
        <div className="swatch" style={{'background': props.color}}>
            <div className="swatch-text" style={isDark() ? {color: "#f5f5f5"} : {color: "#1c1c1c"}}>
                <button className="delete swatch-button">
                    <FontAwesomeIcon icon={faTrashCan} style={isDark() ? {color: "#f5f5f5"} : {color: "#1c1c1c"}}/>
                </button>
                <button className="edit swatch-button">
                    <FontAwesomeIcon icon={faPenToSquare} style={isDark() ? {color: "#f5f5f5"} : {color: "#1c1c1c"}}/>
                </button>
                {props.color}
            </div>
        </div> 
    )
}

export default ColorSwatch