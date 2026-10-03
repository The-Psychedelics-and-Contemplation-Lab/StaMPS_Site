/** Prefix an internal path with the site's base (/repo on github.io, "" on the custom domain). */
export const u = (p: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + p;
