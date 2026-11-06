import type { ReactNode } from 'react';

interface SectionLabelProps {
    children: ReactNode;
    /** Shown at the right end of the rule, e.g. a count or a small key */
    aside?: ReactNode;
}

/** A printed section label with a thin rule running to the edge, like the labels on a synth. */
const SectionLabel = ({ children, aside }: SectionLabelProps) => (
    <div className="flex items-center gap-3">
        <h2 className="shrink-0 text-[11px] silk">{children}</h2>
        <span aria-hidden className="h-px flex-1 bg-silk/45" />
        {aside !== undefined && (
            <div className="flex shrink-0 items-center font-mono text-xs text-silk">{aside}</div>
        )}
    </div>
);

export default SectionLabel;
