/** The public page for a song */
export const songPagePath = (id: string) => `/songs/${encodeURIComponent(id)}`;

/** The public page for an album */
export const albumPagePath = (id: string) => `/albums/${encodeURIComponent(id)}`;
