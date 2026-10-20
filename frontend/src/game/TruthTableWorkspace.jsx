import React, { useState } from 'react';
import { isolateFormulas } from './bidi';
import { renderMarkdownLite } from './markdownLite';
import { checkTable, formulaKey, kindName, showRow, tableColumns, tf, truthRows } from './truthTable';

// A level of unit 1: the student fills in a truth table, T or F in each cell,
// and answers the level's questions about it (are two statements equivalent,
// in which row is a statement false, is it a tautology). The same frame as a
// proof level: the title and the level menu above, the explanation, the
// hints and the check on the side, and the conclusion once it is right.

const FORMULA_FONT = "'EasyLean Big Operators', monospace";
const cellStyle = { border: '1px solid #b7cbea', padding: 0, textAlign: 'center', minWidth: '64px' };
const headStyle = { ...cellStyle, padding: '6px 10px', background: '#eef4ff', whiteSpace: 'nowrap' };

const RowChoice = ({ variables, value, onChange, label }) => (
    <select
        aria-label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #aaa', background: 'white', marginInlineStart: '6px' }}
    >
        <option value="">?</option>
        {truthRows(variables).map((row, index) => (
            <option key={index} value={index}>{`שורה ${index + 1} (${showRow(variables, row)})`}</option>
        ))}
    </select>
);

const Choice = ({ name, options, value, onChange }) => (
    <span style={{ display: 'inline-flex', gap: '14px', flexWrap: 'wrap' }}>
        {options.map(([optionValue, text]) => (
            <label key={String(optionValue)} style={{ cursor: 'pointer' }}>
                <input type="radio" name={name} checked={value === optionValue} onChange={() => onChange(optionValue)} />
                {' '}{text}
            </label>
        ))}
    </span>
);

const Question = ({ level, question, index, answer, setAnswer }) => {
    const number = level.questions.length > 1 ? `${index + 1}. ` : '';
    const name = `question-${level.id}-${index}`;
    if (question.kind === 'equivalent') {
        const pair = `${formulaKey(question.left)} ו־${formulaKey(question.right)}`;
        return (
            <div role="group" aria-label={`שאלה ${index + 1}`}>
                <div style={{ marginBottom: '6px' }}>{number}{isolateFormulas(`האם ${pair} שקולות?`)}</div>
                <Choice name={name} value={answer.equivalent} onChange={(equivalent) => setAnswer({ equivalent })}
                    options={[[true, 'כן, הן שקולות'], [false, 'לא, הן לא שקולות']]} />
                {answer.equivalent === false && (
                    <div style={{ marginTop: '6px' }}>
                        שורה שבה הן שונות:
                        <RowChoice variables={level.variables} value={answer.row} label={`שאלה ${index + 1}: שורה שבה הן שונות`}
                            onChange={(row) => setAnswer({ ...answer, row })} />
                    </div>
                )}
            </div>
        );
    }
    if (question.kind === 'falseRow') {
        return (
            <div role="group" aria-label={`שאלה ${index + 1}`}>
                {number}{isolateFormulas(`באיזו שורה ${formulaKey(question.formula)} שקרית?`)}
                <RowChoice variables={level.variables} value={answer.row} label={`שאלה ${index + 1}: השורה`}
                    onChange={(row) => setAnswer({ row })} />
            </div>
        );
    }
    return (
        <div role="group" aria-label={`שאלה ${index + 1}`}>
            <div style={{ marginBottom: '6px' }}>{number}{isolateFormulas(`מה ${formulaKey(question.formula)}?`)}</div>
            <Choice name={name} value={answer.kind} onChange={(kind) => setAnswer({ kind })}
                options={['tautology', 'contradiction', 'neither'].map((kind) => [kind, kindName(kind)])} />
        </div>
    );
};

const TruthTableLevel = ({ level, hasNextLevel, onNextLevel, nextWorldLabel, onNextWorld }) => {
    const [cells, setCells] = useState({});
    const [answers, setAnswers] = useState([]);
    const [result, setResult] = useState(null);
    const [hintsShown, setHintsShown] = useState(0);
    const rows = truthRows(level.variables);
    const columns = tableColumns(level.variables, level.statements);
    // The statements a question compares are marked, like the colored columns of the lecture.
    const asked = new Set((level.questions || []).flatMap((q) => (q.kind === 'equivalent' ? [q.left, q.right] : [q.formula])).map(formulaKey));
    const wrong = new Set((result?.wrong || []).map(({ column, row }) => `${column}#${row}`));
    const canContinue = hasNextLevel || Boolean(onNextWorld);

    // A change after a check starts a new attempt.
    const toggle = (column, row) => {
        setCells((current) => ({ ...current, [column]: { ...current[column], [row]: current[column]?.[row] !== true } }));
        setResult(null);
    };
    const setAnswer = (index) => (answer) => {
        setAnswers((current) => Object.assign([...current], { [index]: answer }));
        setResult(null);
    };

    return (
        <div style={{ display: 'flex', flexGrow: 1, gap: '20px', minHeight: 0 }}>
            <div style={{ flex: 1, minWidth: '520px', minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <table aria-label="טבלת אמת" style={{ borderCollapse: 'collapse', direction: 'ltr', alignSelf: 'center', fontFamily: FORMULA_FONT, fontSize: '18px', marginTop: '10px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...headStyle, minWidth: 0, color: '#777', fontWeight: 'normal' }}>#</th>
                            {level.variables.map((name) => <th key={name} style={headStyle}>{name}</th>)}
                            {columns.map((column) => (
                                <th key={column} style={{ ...headStyle, color: asked.has(column) ? '#1d4ed8' : undefined }}>{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                <td style={{ ...cellStyle, minWidth: 0, padding: '0 8px', color: '#777', fontSize: '14px' }}>{index + 1}</td>
                                {level.variables.map((name) => (
                                    <td key={name} style={{ ...cellStyle, padding: '8px', background: '#f5f5f5', fontWeight: 'bold' }}>{tf(row[name])}</td>
                                ))}
                                {columns.map((column) => {
                                    const value = cells[column]?.[index];
                                    const isWrong = wrong.has(`${column}#${index}`);
                                    return (
                                        <td key={column} style={cellStyle}>
                                            <button
                                                type="button"
                                                aria-label={`${column}, שורה ${index + 1}`}
                                                onClick={() => toggle(column, index)}
                                                style={{
                                                    width: '100%', minHeight: '38px', border: 'none', cursor: 'pointer', fontFamily: FORMULA_FONT, fontSize: '18px',
                                                    background: isWrong ? '#fde2e1' : value === undefined ? 'white' : '#fbfdff',
                                                    color: isWrong ? '#b3261e' : '#111', fontWeight: 'bold',
                                                }}
                                            >
                                                {value === undefined ? '' : tf(value)}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {level.questions?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: '#eef4ff', border: '1px solid #b7cbea', borderRadius: '5px' }}>
                        <h3 style={{ margin: 0 }}>{level.questions.length > 1 ? 'שאלות' : 'שאלה'}</h3>
                        {level.questions.map((question, index) => (
                            <Question key={index} level={level} question={question} index={index} answer={answers[index] || {}} setAnswer={setAnswer(index)} />
                        ))}
                    </div>
                )}
            </div>

            <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '5px' }}>
                    {renderMarkdownLite(level.introduction)}
                </div>
                <div style={{ padding: '10px', background: '#f0e6ff', borderRadius: '5px' }}>
                    {level.hints.slice(0, hintsShown).map((hint, index) => (
                        <p key={index} style={{ margin: '0 0 6px 0' }}>💡 {isolateFormulas(hint)}</p>
                    ))}
                    {hintsShown < level.hints.length && (
                        <button onClick={() => setHintsShown((shown) => shown + 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #999', cursor: 'pointer', background: 'white' }}>
                            הצג רמז
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setResult(checkTable(level, cells, answers))}
                    style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    בדוק טבלה
                </button>
                {result && !result.ok && (
                    <div role="alert" style={{ padding: '10px', background: '#333', color: 'white', borderRadius: '5px', lineHeight: 1.6 }}>
                        {isolateFormulas(result.message)}
                    </div>
                )}
                {result?.ok && (
                    <div style={{ padding: '12px', background: '#e6ffed', border: '1px solid #4CAF50', borderRadius: '5px' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>הצלחה!</p>
                        {renderMarkdownLite(level.conclusion)}
                        <button
                            onClick={hasNextLevel ? onNextLevel : onNextWorld}
                            disabled={!canContinue}
                            style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px', backgroundColor: canContinue ? '#2196F3' : '#bbb', color: 'white', border: 'none', borderRadius: '5px', cursor: canContinue ? 'pointer' : 'default' }}
                        >
                            {hasNextLevel ? 'לשלב הבא' : nextWorldLabel && onNextWorld ? nextWorldLabel : 'שלבים נוספים בקרוב...'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TruthTableWorkspace = ({ levels, worldName, nextWorldLabel = null, onNextWorld = null }) => {
    const [levelIdx, setLevelIdx] = useState(0);
    const level = levels[levelIdx];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', padding: '20px', fontFamily: "'EasyLean Big Operators', sans-serif", direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>{worldName} — שלב {level.levelNumber}/{level.totalLevels}: {isolateFormulas(level.title)}</h1>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    מעבר ישיר לשלב:
                    <select
                        value={levelIdx}
                        onChange={(event) => setLevelIdx(Number(event.target.value))}
                        aria-label="מעבר ישיר לשלב"
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #aaa', background: 'white' }}
                    >
                        {levels.map((available, index) => (
                            <option key={available.id} value={index}>{available.levelNumber}/{available.totalLevels} — {isolateFormulas(available.title)}</option>
                        ))}
                    </select>
                </label>
            </div>
            {/* A fresh table for each level. */}
            <TruthTableLevel
                key={level.id}
                level={level}
                hasNextLevel={levelIdx < levels.length - 1}
                onNextLevel={() => setLevelIdx((index) => index + 1)}
                nextWorldLabel={nextWorldLabel}
                onNextWorld={onNextWorld}
            />
        </div>
    );
};

export default TruthTableWorkspace;
