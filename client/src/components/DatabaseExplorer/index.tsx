import Nameplate from '../ui/Nameplate';

// A placeholder until browsing and searching are built
const DatabaseExplorer = () => (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 p-6 lg:h-full lg:overflow-y-auto">
        <div className="flex w-full max-w-md flex-col items-center gap-2 panel screws p-8 text-center">
            <h1 className="text-[11px] silk">Explorer</h1>
            <p className="text-lg font-bold tracking-[-0.01em]">Browsing your songs and colors</p>
            <p className="text-sm text-silk">
                Search by song, artist or color is on the way. For now, add colors from the color
                picker.
            </p>
        </div>
        <Nameplate details={['Model CV-1']} />
    </div>
);

export default DatabaseExplorer;
