import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import type { HexColor } from '@chromesthesia/shared'
import { isDark, textColorOn } from '../../../../utils/color'

interface ColorSwatchProps {
    color: HexColor
}

const ColorSwatch = ({ color }: ColorSwatchProps) => {
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const textColor = textColorOn(color)

    return (
        <div
            className="group relative max-h-[30%] min-h-40 min-w-1/5 grow transition-transform duration-300 hover:scale-110"
            style={{ background: color }}
        >
            <div
                className="flex h-full items-center justify-center overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ color: textColor }}
            >
                <div className="absolute top-2 right-2 flex flex-col gap-0.5">
                    {confirmingDelete ? (
                        <>
                            {/* TODO: wire up to the delete API */}
                            <button className="rounded-[5px] border border-red-600 bg-red-600/20 px-2 text-red-600">
                                Delete
                            </button>
                            <button
                                className="rounded-[5px] border px-2"
                                style={{ color: textColor, borderColor: textColor }}
                                onClick={() => setConfirmingDelete(false)}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            aria-label={`Delete ${color}`}
                            className={`rounded-[30%] px-1.5 py-1 text-base ${
                                isDark(color) ? 'hover:bg-white/20' : 'hover:bg-black/20'
                            }`}
                            onClick={() => setConfirmingDelete(true)}
                        >
                            <FontAwesomeIcon icon={faTrashCan} style={{ color: textColor }} />
                        </button>
                    )}
                </div>
                {color}
            </div>
        </div>
    )
}

export default ColorSwatch
