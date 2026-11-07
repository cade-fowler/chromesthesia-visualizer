const format = (n: number) => n.toLocaleString('en-US');

interface StatReadoutProps {
    /** Label and value pairs, shown two to a row */
    readings: [label: string, value: number][];
}

/** A recessed readout of counts. Shown from lg up only, to save room on phones. */
const StatReadout = ({ readings }: StatReadoutProps) => (
    <dl className="hidden content-center gap-4 well rounded-md p-5 lg:grid lg:grid-cols-2">
        {readings.map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse gap-1">
                <dt className="text-[10px] silk">{label}</dt>
                <dd className="font-mono text-3xl leading-none font-medium tabular-nums">
                    {format(value)}
                </dd>
            </div>
        ))}
    </dl>
);

export default StatReadout;
