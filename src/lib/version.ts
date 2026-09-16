/** Release tag baked in at build time (e.g. `v1.0.0`). Local/dev builds show `dev`. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'
