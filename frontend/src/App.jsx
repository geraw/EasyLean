import React, { useState } from 'react';
import EasyLeanWorkspace from './components/BlocklyWorkspace';
import GameWorkspace from './game/GameWorkspace';
import { unit0Levels, unit0WorldName } from './game/unit0World';
import { unit1Levels, unit1WorldName } from './game/unit1World';
import './App.css';

const modeButtonStyle = (active) => ({
  padding: '8px 16px',
  fontSize: '14px',
  border: 'none',
  borderRadius: '5px 5px 0 0',
  cursor: 'pointer',
  backgroundColor: active ? '#4CAF50' : '#ddd',
  color: active ? 'white' : '#333',
  fontWeight: active ? 'bold' : 'normal',
});

const PROOF_STATE_ENDPOINT = 'http://localhost:3001/proof-state';

// Free mode is hidden for now; its code stays so it can come back later.
const SHOW_SANDBOX = false;

const UNITS = {
  unit0: { levels: unit0Levels, worldName: unit0WorldName, next: { mode: 'unit1', label: 'ליחידה 1' } },
  unit1: { levels: unit1Levels, worldName: unit1WorldName },
};

function App() {
  const [mode, setMode] = useState('unit0');

  return (
    <div className="App">
      <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 0 20px', direction: 'rtl', fontFamily: 'sans-serif', flexShrink: 0 }}>
        {SHOW_SANDBOX && <button style={modeButtonStyle(mode === 'sandbox')} onClick={() => setMode('sandbox')}>מצב חופשי</button>}
        {Object.entries(UNITS).map(([unitMode, unit]) => (
          <button key={unitMode} style={modeButtonStyle(mode === unitMode)} onClick={() => setMode(unitMode)}>{unit.worldName}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {mode === 'sandbox' ? <EasyLeanWorkspace /> : (
          <GameWorkspace
            // A fresh workspace per unit, so switching units starts at its first level.
            key={mode}
            levels={UNITS[mode].levels}
            worldName={UNITS[mode].worldName}
            toolboxLabel="מהלכי הוכחה"
            newTacticsLabel="מהלך חדש"
            hideCompilerDetails
            proofStateEndpoint={PROOF_STATE_ENDPOINT}
            nextWorldLabel={UNITS[mode].next?.label}
            onNextWorld={UNITS[mode].next && (() => setMode(UNITS[mode].next.mode))}
          />
        )}
      </div>
    </div>
  );
}

export default App;
