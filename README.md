# EasyLean 🎓📐

EasyLean is an interactive educational web application designed to teach students how to construct formal mathematical proofs using a visual, drag-and-drop interface powered by **Blockly**, which compiles to and verifies against the **Lean 4** proof assistant.

By bridging visual block-based programming and formal logic, EasyLean makes the learning curve of Lean 4 much gentler and more accessible to students.

---

## Repository Structure

The project is split into three components:
- **`backend/`**: A Node.js & Express server that receives generated Lean 4 code from the client, saves it temporarily, runs the local Lean compiler to verify the proof, and returns the compiler's output and exit status.
- **`frontend/`**: A modern React + Vite application leveraging `react-blockly` to provide a visual interface for constructing proofs.
- **`feedback/`**: A small Node.js & Express service that keeps the feedback students send with the site's feedback button: their remarks and images, the contact details they chose to give, where they were in the course, the state of their proof or truth table, and a screenshot. `feedback/inbox.js` shows it all on one page.

The curriculum design (in Hebrew) lives in **[`docs/curriculum/`](docs/curriculum/README.md)**: one document per unit, plus the design principles, architecture and open decisions. When a change affects a unit, update its document in the same pull request.

---

## Prerequisites

To run EasyLean locally, you must have the following installed on your machine:

1. **Node.js** (Version `>= 18.0.0`)
2. **elan** (The Lean Version Manager) and the **Lean 4** toolchain.

### Installing `elan` and Lean 4

#### Windows (PowerShell)
1. Download the `elan` installer script:
   ```powershell
   curl -O --location https://raw.githubusercontent.com/leanprover/elan/master/elan-init.ps1
   ```
2. Run the installer script:
   ```powershell
   .\elan-init.ps1 -NoPrompt $true
   ```
3. Delete the downloaded script:
   ```powershell
   Remove-Item elan-init.ps1
   ```
4. Restart your terminal or command prompt so the `elan` path is recognized.

> [!IMPORTANT]
> **Windows SSL Revocation Issue (CRYPT_E_REVOCATION_OFFLINE):**
>
> If the installer or subsequent `elan` toolchain downloads fail with an SSL/TLS error like:
> `CRYPT_E_REVOCATION_OFFLINE (0x80092013) - The revocation function was unable to check revocation because the revocation server was offline.`
>
> This is a common issue on Windows when standard certificate revocation check servers are blocked or offline. You can temporarily disable this check to allow the installation:
> 1. Run PowerShell as an Administrator or User.
> 2. Run the following command to disable the server certificate revocation check in the Windows Registry:
>    ```powershell
   Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name 'CertificateRevocation' -Value 0
   ```
> 3. Proceed with the `elan` installation.

#### macOS / Linux (Terminal)
Run the following command to install `elan`:
```bash
curl -fsSL https://elan.lean-lang.org/elan-init.sh | sh
```
Follow the on-screen instructions to complete the installation.

---

## Installation & Running

After installing the dependencies (`npm install` in `backend/`, `feedback/` and `frontend/`, as below), one command runs everything locally:

```bash
./dev.sh
```

It starts the backend on port 3001, the feedback service on port 3002 and the frontend at http://localhost:5173/EasyLean/; Ctrl+C stops them all. Feedback sent locally is kept in `feedback/inbox/`; `cd feedback && npm run inbox` writes `feedback/inbox/index.html`, which shows it. The frontend reloads on its own, and the backend restarts when `server.js` changes. Locally the site always uses this backend, never the public one. The steps below run each side separately.

### 1. Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the Lean REPL, which keeps Lean loaded between checks (`./dev.sh` does this too; it needs `git`, and takes a few seconds the first time):
   ```bash
   ./build-repl.sh
   ```
   Without it the backend still works, running `lean` for each check, several times slower. `LEAN_REPL=off` makes it do that even when the REPL is built.
4. Start the Express server:
   ```bash
   npm start
   ```
   The backend server will run on `http://localhost:3001`.

---

### 2. Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The development client will run on `http://localhost:5173`. Open this URL in your web browser.

---

## Testing

There are three layers of tests. CI (`.github/workflows/test.yml`) runs all of them on every push and pull request.

| Layer | Where | Run with | Needs |
|---|---|---|---|
| Frontend unit tests (Vitest): Lean code generation, goal formatting, level data | `frontend/src/**/*.test.js` | `cd frontend && npm test` | Node |
| Feedback service tests (`node:test`): what is kept, what is refused, the inbox page | `feedback/test/` | `cd feedback && npm test` | Node |
| Backend tests (`node:test`): proof-state parser, the Lean REPL pool, `/verify` and `/proof-state` (with the REPL, and with `lean` for each check) | `backend/test/` | `cd backend && npm test` | Node, Lean (the Lean-backed tests are skipped when `lean` is missing), the REPL (`backend/build-repl.sh`) |
| End-to-end tests (Playwright): the real app in Chromium, and in Safari's WebKit as an iPad, upright and on its side | `frontend/e2e/` | `cd frontend && npm run test:e2e` | Node, Lean, `npx playwright install chromium webkit` once |

The end-to-end tests start the backend and the Vite dev server themselves, or reuse them if they are already running. `solutions.spec.js` checks every solution of every level (defined in `e2e/solutions.js`) against Lean, building the proofs through `window.__easyleanWorkspace`, which is only set in dev mode; `walk.spec.js` solves levels the way a student would, dragging moves from the toolbox with the mouse and choosing only what their menus offer. `screens.spec.js` checks that every level fits the screen, its check button and proof state in view, and that on a touch screen a swipe scrolls a long toolbox. The `ipad` project runs every test as an iPad but the walks, which drag with a mouse on a large screen (`--project chromium` runs only the desktop), and `ipad-landscape` runs `screens.spec.js`. An emulated iPad is not a real one: it has no Safari bars, and its swipes are touch pointer events sent to Blockly, not the browser's own scrolling. Use `npm run test:watch` in `frontend/` to re-run unit tests on save.

---

## Deployment (pilot)

- **Frontend:** GitHub Pages, at https://geraw.github.io/EasyLean/, and the course's version (branch `for-course`) at https://geraw.github.io/EasyLean/for-course/. Every push to `main` or to `for-course` builds both and deploys them together, since Pages serves one site (`.github/workflows/deploy.yml`, the same file on both branches). The repository variable `BACKEND_URL` tells it where the backend is; without it the site expects a backend on `localhost:3001`.
- **Backend:** Google Cloud Run, project `easylean-pilot-1003`, region `europe-west1`, built from `backend/Dockerfile`. Deploy with `ops/deploy-backend.sh` (needs `gcloud`, signed in to the owning account). `.github/workflows/backend.yml` builds the image and checks it with a real proof on every change to `backend/`.
- **Feedback:** the service `easylean-feedback` on Cloud Run, in the same project, built from `feedback/Dockerfile`; it keeps each feedback in its own folder in the private bucket `gs://easylean-pilot-1003-feedback`, as a service account that can only create objects there. Deploy with `ops/deploy-feedback.sh`; read the feedback with `ops/feedback-inbox.sh`, which downloads it to `~/EasyLeanFeedback` and opens a page that shows it all, newest first. The site sends feedback to the service's address, set in `frontend/src/feedback/feedbackUrl.js`.
- **Cost:** at most one instance, scaling to zero when idle, keeps the pilot within the free tier (expected: cents a month, for storing the image). The project has a hard cap: an 18 ILS (about $5) budget, with email alerts at 50%, 90% and 100%, whose notifications trigger the function in `ops/billing-cap/`; when the budget is reached it unlinks the project from billing, which stops everything in it. Budget reports lag by a few hours. To restart after that: `gcloud billing projects link easylean-pilot-1003 --billing-account=<account>`.

> [!CAUTION]
> **Security risk:** the backend runs the Lean code it receives. For the pilot it rejects what could run programs or read files on the server (`#eval` and the other `#` commands, `run_cmd`, `native_decide`, `implemented_by`, `import`, macros other than the preludes' tactic macros, and the like; see `FORBIDDEN` in `backend/server.js`); a public, long-term deployment needs a stricter check (accept only the lines the blocks generate).

## How It Works

1. **Visual Editing**: The user constructs a proof visually by dragging, connecting, and nesting puzzle blocks (representing assumptions, theorems, and logical rules) in the workspace.
2. **Lean Code Generation**: The Blockly workspace converts the block configuration into a Lean 4 source string.
3. **Verification**: Clicking the **"Prove" / "Verify"** (Hebrew: "בדוק") button sends the Lean code to the backend.
4. **Lean Execution**: The backend checks the code with a long-running Lean REPL process (`backend/leanRepl.js`), which elaborates the code's header (the preludes and the level's variables) once and keeps it, and answers with the messages `lean` would print for the file; without the REPL, it writes the code into a temporary file inside its `lean_project/` folder and runs the local `lean` binary on it.
5. **Feedback**: The client displays the compile/verify feedback to the user, confirming if the proof is logically sound.
