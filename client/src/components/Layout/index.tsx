import { Outlet } from 'react-router-dom';
import { TabBar, TopBar } from '../Navbar';

// dvh rather than vh so phones don't hide the bottom of the page behind the browser's toolbar.
// Phones scroll the whole page; from lg up each page lays out its own scrolling panels.
const Layout = () => (
    <div className="flex h-dvh flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
            <Outlet />
        </main>
        <TabBar />
    </div>
);

export default Layout;
