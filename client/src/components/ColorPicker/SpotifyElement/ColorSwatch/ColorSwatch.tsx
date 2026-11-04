import './ColorSwatch.scss'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import type { HexColor } from '../../../../types'
import { isDark, textColorOn } from '../../../../utils/color'

interface ColorSwatchProps {
    color: HexColor
}

const ColorSwatch = ({ color }: ColorSwatchProps) => {
    const [isHoverDelete, setIsHoverDelete] = useState(false)
    const [deletePressed, setDeletePressed] = useState(false)

    const textColor = textColorOn(color)
    const buttonColor = isDark(color) ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0)'
    const buttonHoverColor = isDark(color) ? 'rgba(255, 255, 255, .2)' : 'rgba(0, 0, 0, .2)'

    return (
        <div className="swatch" style={{ background: color }}>
            <div className="swatch-text" style={{ color: textColor }}>
                <div className="delete">
                    <button
                        className="swatch-button"
                        onMouseEnter={() => setIsHoverDelete(true)}
                        onMouseLeave={() => setIsHoverDelete(false)}
                        onClick={() => setDeletePressed(!deletePressed)}
                        style={{
                            backgroundColor: isHoverDelete ? buttonHoverColor : buttonColor,
                            display: deletePressed ? 'none' : 'block',
                        }}
                    >
                        <FontAwesomeIcon icon={faTrashCan} style={{ color: textColor }} />
                    </button>
                    {/* TODO: wire up to the delete API */}
                    <button className='delete-hidden confirm' style={{ display: deletePressed ? 'block' : 'none' }}>
                        Delete
                    </button>
                    <button
                        className='delete-hidden'
                        style={{
                            display: deletePressed ? 'block' : 'none',
                            color: textColor,
                            borderColor: textColor,
                        }}
                        onClick={() => setDeletePressed(false)}
                    >
                        Cancel
                    </button>
                </div>
                {color}
            </div>
        </div>
    )
}

export default ColorSwatch
