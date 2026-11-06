const keyType =
    'inline-flex items-center justify-center gap-2 font-bold uppercase whitespace-nowrap';

/** A regular key (Log out, Cancel, Whole song, …) */
export const keyClass = `key h-9 px-4 text-[11px] tracking-[0.1em] ${keyType}`;

/** A small key that sits inside or beside a field (Mark, …) */
export const smallKeyClass = `key h-7 px-2.5 text-[10px] tracking-[0.1em] ${keyType}`;

/** The dark key for a form's main action (Add color, Save changes) */
export const primaryKeyClass = `key-dark h-11 px-6 text-sm tracking-[0.12em] ${keyType}`;

/** A square key holding one icon */
export const iconKeyClass = `key size-7 text-xs ${keyType}`;
