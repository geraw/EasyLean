import React, { useState } from 'react';
import GameWorkspace from './game/GameWorkspace';
import { unit0Levels, unit0WorldName } from './game/unit0World';
import { unit1Levels, unit1WorldName } from './game/unit1World';
import { unit2Levels, unit2WorldName } from './game/unit2World';
import { unit3Levels, unit3WorldName } from './game/unit3World';
import { unit4Levels, unit4WorldName } from './game/unit4World';
import { unit5Levels, unit5WorldName } from './game/unit5World';
import { unit6Levels, unit6WorldName } from './game/unit6World';
import { unit7Levels, unit7WorldName } from './game/unit7World';
import { unit8Levels, unit8WorldName } from './game/unit8World';
import { unit9Levels, unit9WorldName } from './game/unit9World';
import { unit10Levels, unit10WorldName } from './game/unit10World';
import { unit11Levels, unit11WorldName } from './game/unit11World';
import { unit12Levels, unit12WorldName } from './game/unit12World';
import { BACKEND_URL } from './backendUrl';
import './App.css';

// The course: units of levels, each a proof built from moves that read like a
// proof written by hand; assumptions are chosen by what they say.

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
  unit1: { levels: unit1Levels, worldName: unit1WorldName, next: { mode: 'unit2', label: 'ליחידה 2' } },
  unit2: { levels: unit2Levels, worldName: unit2WorldName, next: { mode: 'unit3', label: 'ליחידה 3' } },
  unit3: { levels: unit3Levels, worldName: unit3WorldName, next: { mode: 'unit4', label: 'ליחידה 4' } },
  unit4: { levels: unit4Levels, worldName: unit4WorldName, next: { mode: 'unit5', label: 'ליחידה 5' } },
  unit5: { levels: unit5Levels, worldName: unit5WorldName, next: { mode: 'unit6', label: 'ליחידה 6' } },
  unit6: { levels: unit6Levels, worldName: unit6WorldName, next: { mode: 'unit7', label: 'ליחידה 7' } },
  unit7: { levels: unit7Levels, worldName: unit7WorldName, next: { mode: 'unit8', label: 'ליחידה 8' } },
  unit8: { levels: unit8Levels, worldName: unit8WorldName, next: { mode: 'unit9', label: 'ליחידה 9' } },
  unit9: { levels: unit9Levels, worldName: unit9WorldName, next: { mode: 'unit10', label: 'ליחידה 10' } },
  unit10: { levels: unit10Levels, worldName: unit10WorldName, next: { mode: 'unit11', label: 'ליחידה 11' } },
  unit11: { levels: unit11Levels, worldName: unit11WorldName, next: { mode: 'unit12', label: 'ליחידה 12' } },
  unit12: { levels: unit12Levels, worldName: unit12WorldName },
};

function App() {
  const [mode, setMode] = useState('unit0');

  return (
    <div className="App">
      <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 0 20px', direction: 'rtl', fontFamily: "'EasyLean Big Operators', sans-serif", flexShrink: 0 }}>
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
        />
      </div>
    </div>
  );
}

export default App;
