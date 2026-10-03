// Where the backend that runs Lean is. Set VITE_BACKEND_URL when building for
// the public site (see .github/workflows/deploy.yml); locally it is the dev server.
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
