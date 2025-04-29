import './ColorSwatch.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { useState } from 'react'

const ColorSwatch = (props) => {

    const isDark = () => {
        var red = parseInt(props.color.substring(1, 3), 16)
        var green = parseInt(props.color.substring(3, 5), 16)
        var blue = parseInt(props.color.substring(5, 7), 16)
        return (red + green + blue) / 3 <= 140
    }

    const [isHoverEdit, setIsHoverEdit] = useState(false);
    const [isHoverDelete, setIsHoverDelete] = useState(false);
    const [deletePressed, setDeletePressed] = useState(false);

    const handleMouseEnterEdit = () => {
        setIsHoverEdit(true);
    };
    const handleMouseLeaveEdit = () => {
        setIsHoverEdit(false);
    };
    const handleMouseEnterDelete = () => {
        setIsHoverDelete(true);
    };
    const handleMouseLeaveDelete = () => {
        setIsHoverDelete(false);
    };

    const buttonColor = isDark() ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0)';
    const buttonHoverColor = isDark() ? 'rgba(255, 255, 255, .2)' : 'rgba(0, 0, 0, .2)';

    return (
        <div className="swatch" style={{'background': props.color}} >
            <div className="swatch-text" style={{color: isDark() ? "#f5f5f5" : "#1c1c1c"}}>
                {/* <button 
                    className="edit swatch-button" 
                    onMouseEnter={handleMouseEnterEdit}
                    onMouseLeave={handleMouseLeaveEdit}
                    style={ isHoverEdit ?
                        {backgroundColor: buttonHoverColor} :
                        {backgroundColor: buttonColor}
                    }
                >
                    <FontAwesomeIcon 
                        icon={faPenToSquare} 
                        style={isDark() ? {color: "#f5f5f5"} : {color: "#1c1c1c"}}
                    />
                </button> */}
                <div className="delete">
                    <button 
                        className="swatch-button" 
                        onMouseEnter={handleMouseEnterDelete}
                        onMouseLeave={handleMouseLeaveDelete}
                        onClick={_ => setDeletePressed(!deletePressed)}
                        style={{
                            backgroundColor: isHoverDelete ? buttonHoverColor : buttonColor,
                            display: deletePressed ? "none" : "block"
                        }}
                    >
                        <FontAwesomeIcon 
                            icon={faTrashCan} 
                            style={{color: isDark() ?  "#f5f5f5" : "#1c1c1c"}}
                        />
                    </button>
                    <button className='delete-hidden confirm' style={{display: deletePressed ? "block" : "none"}}>
                        Delete
                    </button>
                    <button 
                        className='delete-hidden' 
                        style={{
                            display: deletePressed ? "block" : "none",
                            color: isDark() ?  "#f5f5f5" : "#1c1c1c",
                            borderColor: isDark() ?  "#f5f5f5" : "#1c1c1c",
                        }}
                        onClick={_ => setDeletePressed(false)}
                    >
                        Cancel
                    </button>
                </div>
                {props.color}
            </div>
                {/* <div className="edit-modal">
                Pick a new color to replace this one with.
                <button>Save</button>
                <button>Cancel</button>
            </div> */}
            {/* <div className="delete-modal" style={deletePressed ? {display: "block"} : {display: "none"}}>
                Are you sure you would like to delete this color?
                {props.color}
                <button>Delete</button>
                <button onClick={_ => setDeletePressed(false)}>Cancel</button>
            </div> */}
        </div>  
    )
}

export default ColorSwatch