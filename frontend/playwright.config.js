import { defineConfig, devices } from '@playwright/test';

// End-to-end tests against the real app: Vite dev server + backend + Lean.
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://localhost:5173/EasyLean/',
        viewport: { width: 1440, height: 800 },
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 800 } } }],
    webServer: [
        {
            command: 'npm start',
            cwd: '../backend',
            port: 3001,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'npm run dev -- --port 5173 --strictPort',
            url: 'http://localhost:5173/EasyLean/',
            reuseExistingServer: !process.env.CI,
        },
    ],
});
