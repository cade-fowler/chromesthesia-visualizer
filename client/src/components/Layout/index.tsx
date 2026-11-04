import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';

const Layout = () => (
    <div className="h-screen">
        <Navbar />
        <main className="h-[calc(100vh-var(--height-navbar))]">
            <Outlet />
        </main>
    </div>
);

export default Layout;
