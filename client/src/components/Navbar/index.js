import './index.scss'
import { NavLink, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faEyeDropper } from '@fortawesome/free-solid-svg-icons'

const Navbar = () => (
    <div className="nav-bar">
        <Link className='logo' to='/'>
            Chromesthesia Visualizer
        </Link>
        <nav>
            <NavLink exact='true' activeclassname='active' to='/' className='color-picker-link'>  
                <FontAwesomeIcon icon={faEyeDropper} color='#6b7a85'/>
            </NavLink>
            <NavLink exact='true' activeclassname='active' to='/databaseexplorer' className='database-explorer-link'>  
                <FontAwesomeIcon icon={faMagnifyingGlass} color='#6b7a85'/>
            </NavLink>
        </nav>
    </div>
)


export default Navbar