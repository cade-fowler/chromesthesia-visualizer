const outlined =
    'rounded-[5px] border-medium text-medium transition-colors hover:bg-medium hover:text-dark ' +
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ' +
    'disabled:hover:text-medium';

/** The panel's main outlined buttons (Login, Save, …) */
export const buttonClass = `m-2 border-[3px] p-2 text-xl ${outlined}`;

/** Smaller outlined buttons for inline actions (Mark, Clear, …) */
export const smallButtonClass = `border-2 px-2 py-1 text-sm ${outlined}`;
