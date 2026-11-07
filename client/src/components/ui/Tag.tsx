/** A small printed tag, such as a song's length or how many colors it has. */
const Tag = ({ children }: { children: string }) => (
    <span className="rounded-[3px] border border-silk/60 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-silk uppercase">
        {children}
    </span>
);

export default Tag;
