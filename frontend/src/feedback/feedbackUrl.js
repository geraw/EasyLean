// Where feedback is sent: the feedback service (feedback/ at the repository's
// root, deployed by ops/deploy-feedback.sh), apart from the server that runs
// Lean. Set VITE_FEEDBACK_URL to send it elsewhere; locally it is the service
// ./dev.sh starts.
const DEPLOYED = 'https://easylean-feedback-449500484127.europe-west1.run.app';
export const FEEDBACK_URL = (import.meta.env.VITE_FEEDBACK_URL
    || (import.meta.env.PROD && DEPLOYED)
    || 'http://localhost:3002').replace(/\/$/, '');
