# EasyLean 🎓📐

EasyLean is an interactive educational web application designed to teach students how to construct formal mathematical proofs using a visual, drag-and-drop interface powered by **Blockly**, which compiles to and verifies against the **Lean 4** proof assistant.

By bridging visual block-based programming and formal logic, EasyLean makes the learning curve of Lean 4 much gentler and more accessible to students.

---

## Repository Structure

The project is split into two main components:
- **`backend/`**: A Node.js & Express server that receives generated Lean 4 code from the client, saves it temporarily, runs the local Lean compiler to verify the proof, and returns the compiler's output and exit status.
- **`frontend/`**: A modern React + Vite application leveraging `react-blockly` to provide a visual interface for constructing proofs.

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

### 1. Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
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

## How It Works

1. **Visual Editing**: The user constructs a proof visually by dragging, connecting, and nesting puzzle blocks (representing assumptions, theorems, and logical rules) in the workspace.
2. **Lean Code Generation**: The Blockly workspace converts the block configuration into a Lean 4 source string.
3. **Verification**: Clicking the **"Prove" / "Verify"** (Hebrew: "בדוק") button sends the Lean code to the backend.
4. **Lean Execution**: The backend writes the code into a temporary file inside its `lean_project/` folder, executes the local `lean` binary, parses stdout/stderr, cleans up the temporary file, and returns the verification result.
5. **Feedback**: The client displays the compile/verify feedback to the user, confirming if the proof is logically sound.
