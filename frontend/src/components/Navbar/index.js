import './index.scss'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faEyeDropper } from '@fortawesome/free-solid-svg-icons'

const Navbar = () => (
    <div className="nav-bar">
        <NavLink exact='true' activeclassname='active' to='/' className='color-picker-link'>  
            <FontAwesomeIcon icon={faEyeDropper} color='#4d4d4e'/>
        </NavLink>
        <NavLink exact='true' activeclassname='active' to='/databaseexplorer' className='database-explorer-link'>  
            <FontAwesomeIcon icon={faMagnifyingGlass} color='#4d4d4e'/>
        </NavLink>
    </div>
)

export default Navbar