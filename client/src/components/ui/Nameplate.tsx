interface NameplateProps {
    /** Short lines printed after the name, e.g. "Model CV-1" */
    details: string[];
}

const screw = (x: string) =>
    `radial-gradient(circle at ${x} 50%, #8f8e89 0 2.4px, #eeede9 3px, transparent 3.6px)`;

/** The device's recessed nameplate, held on by a screw at each end. */
const Nameplate = ({ details }: NameplateProps) => (
    <div
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 rounded-[5px] bg-case-dark px-9 py-3 text-center text-[10px] silk shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_1px_0_#efeee9]"
        style={{ backgroundImage: `${screw('14px')}, ${screw('calc(100% - 14px)')}` }}
    >
        <span className="text-ink">Chromesthesia Visualizer</span>
        {details.map((detail) => (
            <span key={detail}>{detail}</span>
        ))}
    </div>
);

export default Nameplate;
