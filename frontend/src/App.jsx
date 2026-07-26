import React, { useState } from 'react';
import EasyLeanWorkspace from './components/BlocklyWorkspace';
import GameWorkspace from './game/GameWorkspace';
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
        <button style={modeButtonStyle(mode === 'game')} onClick={() => setMode('game')}>משחק: עולם תת-קבוצות</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {mode === 'sandbox' ? <EasyLeanWorkspace /> : <GameWorkspace />}
      </div>
    </div>
  );
}

export default App;
