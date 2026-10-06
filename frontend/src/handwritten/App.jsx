import React, { useState } from 'react';
import GameWorkspace from '../game/GameWorkspace';
import { defineHandwrittenBlocks } from './blocks';
import { HANDWRITTEN_EXPLANATIONS, INCOMPLETE_MOVE } from './explanations';
import { applyMoveStates, buildMoveStatesSource, readMoveStates } from './moveStates';
import { unit0Levels, unit0WorldName } from './unit0World';
import { unit1Levels, unit1WorldName } from './unit1World';
import { BACKEND_URL } from '../backendUrl';
import '../App.css';

// The handwritten version of the course (handwritten.html): moves read like a
// proof written by hand, and assumptions are chosen by what they say.

defineHandwrittenBlocks();

const VERSION = {
  hideAssumptionNames: true,
  explanations: HANDWRITTEN_EXPLANATIONS,
  incompleteMessage: INCOMPLETE_MOVE,
  moveStates: { build: buildMoveStatesSource, read: readMoveStates, apply: applyMoveStates },
};

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

const UNITS = {
  unit0: { levels: unit0Levels, worldName: unit0WorldName, next: { mode: 'unit1', label: 'ליחידה 1' } },
  unit1: { levels: unit1Levels, worldName: unit1WorldName },
};

function App() {
  const [mode, setMode] = useState('unit0');

  return (
    <div className="App">
      <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 0 20px', direction: 'rtl', fontFamily: 'sans-serif', flexShrink: 0 }}>
        {Object.entries(UNITS).map(([unitMode, unit]) => (
          <button key={unitMode} style={modeButtonStyle(mode === unitMode)} onClick={() => setMode(unitMode)}>{unit.worldName}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GameWorkspace
          // A fresh workspace per unit, so switching units starts at its first level.
          key={mode}
          levels={UNITS[mode].levels}
          worldName={UNITS[mode].worldName}
          toolboxLabel="מהלכי הוכחה"
          newTacticsLabel="מהלך חדש"
          hideCompilerDetails
          proofStateEndpoint={`${BACKEND_URL}/proof-state`}
          nextWorldLabel={UNITS[mode].next?.label}
          onNextWorld={UNITS[mode].next && (() => setMode(UNITS[mode].next.mode))}
          version={VERSION}
        />
      </div>
    </div>
  );
}

export default App;
