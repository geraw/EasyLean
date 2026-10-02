import React, { useState } from 'react';
import EasyLeanWorkspace from './components/BlocklyWorkspace';
import GameWorkspace from './game/GameWorkspace';
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

function App() {
  const [mode, setMode] = useState('sandbox');

  return (
    <div className="App">
      <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 0 20px', direction: 'rtl', fontFamily: 'sans-serif', flexShrink: 0 }}>
        <button style={modeButtonStyle(mode === 'sandbox')} onClick={() => setMode('sandbox')}>מצב חופשי</button>
        <button style={modeButtonStyle(mode === 'unit1')} onClick={() => setMode('unit1')}>{unit1WorldName}</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {mode === 'sandbox' ? <EasyLeanWorkspace /> : <GameWorkspace levels={unit1Levels} worldName={unit1WorldName} toolboxLabel="מהלכי הוכחה" newTacticsLabel="מהלך חדש" hideCompilerDetails proofStateEndpoint="http://localhost:3001/proof-state" />}
      </div>
    </div>
  );
}

export default App;
