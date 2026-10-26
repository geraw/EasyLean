import React, { useEffect, useRef, useState } from 'react';
import GameWorkspace from './game/GameWorkspace';
import TruthTableWorkspace from './game/TruthTableWorkspace';
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
import { BACKEND_URL } from './backendUrl';
import FeedbackButton from './feedback/FeedbackButton';
import './App.css';

// The course: lessons, each the units of one lecture, and units of levels,
// each a proof built from moves that read like a proof written by hand;
// assumptions are chosen by what they say. Units are numbered across the
// lessons, as their texts refer to one another ("ביחידה 4, שלב 3").

const lessonButtonStyle = (active) => ({
  padding: '6px 14px',
  fontSize: '15px',
  border: '1px solid #3730a3',
  borderRadius: '5px',
  cursor: 'pointer',
  backgroundColor: active ? '#3730a3' : 'white',
  color: active ? 'white' : '#3730a3',
  fontWeight: 'bold',
});

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
  // Unit 1 is truth tables, filled in rather than proved.
  unit1: { levels: unit1Levels, worldName: unit1WorldName, truthTables: true, next: { mode: 'unit2', label: 'ליחידה 2' } },
  unit2: { levels: unit2Levels, worldName: unit2WorldName, next: { mode: 'unit3', label: 'ליחידה 3' } },
  unit3: { levels: unit3Levels, worldName: unit3WorldName, next: { mode: 'unit4', label: 'ליחידה 4' } },
  unit4: { levels: unit4Levels, worldName: unit4WorldName, next: { mode: 'unit5', label: 'ליחידה 5' } },
  unit5: { levels: unit5Levels, worldName: unit5WorldName, next: { mode: 'unit6', label: 'ליחידה 6' } },
  unit6: { levels: unit6Levels, worldName: unit6WorldName, next: { mode: 'unit7', label: 'ליחידה 7' } },
  unit7: { levels: unit7Levels, worldName: unit7WorldName, next: { mode: 'unit8', label: 'ליחידה 8' } },
  unit8: { levels: unit8Levels, worldName: unit8WorldName, next: { mode: 'unit9', label: 'ליחידה 9' } },
  unit9: { levels: unit9Levels, worldName: unit9WorldName, next: { mode: 'unit10', label: 'ליחידה 10' } },
  unit10: { levels: unit10Levels, worldName: unit10WorldName, next: { mode: 'unit11', label: 'ליחידה 11' } },
  unit11: { levels: unit11Levels, worldName: unit11WorldName },
};

// A lesson is linked to by its address, …/#lesson2; a unit by …/#unit9.
const LESSONS = [
  { id: 'lesson1', title: 'שיעור 1: קשרים, כמתים ומבני הוכחה', units: ['unit1', 'unit2', 'unit3', 'unit4', 'unit5', 'unit6', 'unit7'] },
  { id: 'lesson2', title: 'שיעור 2: קבוצות', units: ['unit8', 'unit9', 'unit10', 'unit11'] },
];

const lessonOf = (mode) => LESSONS.find((lesson) => lesson.units.includes(mode));

// The unit an address points to: a unit, or the first unit of a lesson.
const modeFromHash = (hash) => {
  const id = hash.replace(/^#/, '');
  if (UNITS[id]) return id;
  return LESSONS.find((lesson) => lesson.id === id)?.units[0] || LESSONS[0].units[0];
};

function App() {
  const [mode, setMode] = useState(() => modeFromHash(window.location.hash));
  const lesson = lessonOf(mode);
  // The address names the lesson that is open, so that it can be shared; an
  // address typed or followed later opens its lesson.
  useEffect(() => {
    if (window.location.hash !== `#${lesson.id}` && !(window.location.hash === `#${mode}`)) {
      window.history.replaceState(null, '', `#${lesson.id}`);
    }
  }, [lesson.id, mode]);
  useEffect(() => {
    const follow = () => setMode(modeFromHash(window.location.hash));
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);
  const openLesson = (id) => {
    window.history.replaceState(null, '', `#${id}`);
    setMode(LESSONS.find((l) => l.id === id).units[0]);
  };
  const openUnit = (unitMode) => {
    window.history.replaceState(null, '', `#${lessonOf(unitMode).id}`);
    setMode(unitMode);
  };

  // The open unit's workspace keeps here a function that describes where the
  // student is and the state of their work, for feedback.
  const feedbackSnapshotRef = useRef(null);
  const feedbackContext = () => {
    let snapshot = null;
    try {
      snapshot = feedbackSnapshotRef.current?.() || null;
    } catch (error) {
      snapshot = { error: String(error) };
    }
    const level = snapshot?.level;
    return {
      where: level ? `${UNITS[mode].worldName}, שלב ${level.number}/${level.total}` : UNITS[mode].worldName,
      lesson: { id: lesson.id, title: lesson.title },
      unit: { mode, name: UNITS[mode].worldName },
      ...snapshot,
      site: import.meta.env.BASE_URL,
      url: window.location.href,
      userAgent: navigator.userAgent,
      window: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      time: new Date().toISOString(),
    };
  };

  return (
    <div className="App">
      <div style={{ display: 'flex', gap: '6px', padding: '10px 20px 0 20px', direction: 'rtl', fontFamily: "'EasyLean Big Operators', sans-serif", flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {LESSONS.length > 1 && LESSONS.map((l) => (
          <button key={l.id} style={lessonButtonStyle(l.id === lesson.id)} onClick={() => openLesson(l.id)}>{l.title}</button>
        ))}
        <span style={{ marginInlineStart: 'auto' }}><FeedbackButton getContext={feedbackContext} /></span>
      </div>
      <div style={{ display: 'flex', gap: '6px', padding: '8px 20px 0 20px', direction: 'rtl', fontFamily: "'EasyLean Big Operators', sans-serif", flexShrink: 0 }}>
        {lesson.units.map((unitMode) => (
          <button key={unitMode} style={modeButtonStyle(mode === unitMode)} onClick={() => openUnit(unitMode)}>{UNITS[unitMode].worldName}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {UNITS[mode].truthTables ? (
          <TruthTableWorkspace
            key={mode}
            levels={UNITS[mode].levels}
            worldName={UNITS[mode].worldName}
            nextWorldLabel={UNITS[mode].next?.label}
            onNextWorld={UNITS[mode].next && (() => openUnit(UNITS[mode].next.mode))}
            feedbackSnapshotRef={feedbackSnapshotRef}
          />
        ) : (
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
            onNextWorld={UNITS[mode].next && (() => openUnit(UNITS[mode].next.mode))}
            feedbackSnapshotRef={feedbackSnapshotRef}
          />
        )}
      </div>
    </div>
  );
}

export default App;
