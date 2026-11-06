import { Link } from 'react-router-dom';
import { keyClass } from '../ui/buttons';

interface NotFoundProps {
    /** What couldn't be found, e.g. "Song not found" */
    title?: string;
    message?: string;
}

/** A panel for a missing page or song, with a key back to Explore. */
const NotFound = ({
    title = 'Page not found',
    message = 'There’s nothing at this address.',
}: NotFoundProps) => (
    <div className="flex min-h-full items-center justify-center p-6 lg:h-full">
        <div className="flex w-full max-w-md flex-col items-center gap-3 panel screws p-8 text-center">
            <h1 className="text-[11px] silk">Error</h1>
            <p className="text-lg font-bold tracking-[-0.01em]">{title}</p>
            <p className="text-sm text-silk">{message}</p>
            <Link to="/" className={`${keyClass} mt-2`}>
                Back to Explore
            </Link>
        </div>
    </div>
);

export default NotFound;
