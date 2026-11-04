import { NavLink, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faEyeDropper, type IconDefinition } from '@fortawesome/free-solid-svg-icons'

interface NavItemProps {
    to: string
    icon: IconDefinition
    label: string
}

// Shows an icon; on hover the icon fades out and the label fades in over it
const NavItem = ({ to, icon, label }: NavItemProps) => (
    <NavLink
        to={to}
        end
        className="group grid h-full w-1/4 place-items-center text-center text-[30px] no-underline"
    >
        {({ isActive }) => (
            <>
                <FontAwesomeIcon
                    icon={icon}
                    className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out group-hover:opacity-0 ${
                        isActive ? 'text-spotify' : 'text-medium'
                    }`}
                />
                <span className="col-start-1 row-start-1 text-[22px] tracking-[2px] text-spotify opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                    {label}
                </span>
            </>
        )}
    </NavLink>
)

const Navbar = () => (
    <header className="fixed bottom-0 z-10 flex h-(--height-navbar) w-full min-w-[300px] items-center justify-between bg-dark">
        <Link
            to="/"
            className="hidden pl-[25px] font-display text-[45px] tracking-[2px] text-medium no-underline min-[1075px]:block"
        >
            Chromesthesia Visualizer
        </Link>
        <nav className="flex h-full w-full justify-evenly min-[1075px]:w-1/2">
            <NavItem to="/" icon={faEyeDropper} label="COLOR PICKER" />
            <NavItem to="/databaseexplorer" icon={faMagnifyingGlass} label="DATABASE EXPLORER" />
        </nav>
    </header>
)

export default Navbar
