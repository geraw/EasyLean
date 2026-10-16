import * as Blockly from 'blockly/core';
import { generateGameLeanSource, proofMoves } from './gameLeanCode';
import { findLeanProblem, parseLeanMessages } from './leanErrors';
import { openGoals } from './proofState';

// The proof state before each move, from one Lean check: the proof cut right
// before each move becomes its own theorem, all after one shared header.
// Each theorem's messages are read on their own, with their own line numbers.

// Declarations of the level's vocabulary (P Q : Prop) are not assumptions.
const isDeclaration = (prop) => /^(Prop|Type|Sort)\b|→ Prop$/.test(prop.trim());

export const buildMoveStatesSource = (workspace, level, preamble = '') => {
    const moves = proofMoves(workspace);
    if (moves.length === 0) return null;
    let header = null;
    let line = 0; // lines of the combined code so far
    const bodies = [];
    const segments = moves.map((move, index) => {
        const name = `${level.name}_before_${index}`;
        const source = generateGameLeanSource(workspace, { ...level, name }, preamble, { includeFallback: false, untilBlockId: move.id });
        const start = source.code.indexOf(`\ntheorem ${name} `) + 1;
        if (header === null) {
            header = source.code.slice(0, start);
            line = header.split('\n').length - 1;
        }
        const body = source.code.slice(start);
        const ownFirstLine = header.split('\n').length; // the body's first line in its own code
        const firstLine = line + 1;
        const bodyLines = body.split('\n').length - 1;
        bodies.push(body);
        line += bodyLines;
        return { blockId: move.id, offset: firstLine - ownFirstLine, firstLine, lastLine: line, stateLine: source.stateLine };
    });
    return { code: header + bodies.join(''), segments };
};

// The messages of one segment, as Lean output with the segment's own line numbers.
const segmentOutput = (messages, { offset, firstLine, lastLine }) => messages
    .filter(({ line }) => line >= firstLine && line <= lastLine)
    .map(({ line, severity, text }) => `proof.lean:${line - offset}:0: ${severity}: ${text}`)
    .join('\n');

// The objects of the domain in hand (a : α, where α : Type is declared) and
// the sets (A : Set α, or a family F : Set (Set α)), by name, apart from the
// assumptions: they are things we have, not claims.
const objectsOf = (assumptions) => {
    const domains = new Set(assumptions.filter(({ prop }) => /^(Type|Sort)\b/.test(prop.trim())).flatMap(({ name }) => name.split(/\s+/)));
    // Natural numbers (n : ℕ) are objects too.
    const isObject = ({ prop }) => domains.has(prop.trim()) || ['Nat', 'ℕ'].includes(prop.trim());
    const isSet = ({ prop }) => /^Set\b/.test(prop.trim());
    const names = (test) => assumptions.filter(test).flatMap(({ name }) => name.split(/\s+/));
    return { objects: names(isObject), sets: names(isSet), isThing: (a) => isObject(a) || isSet(a) };
};

// blockId → { assumptions, objects, sets, goal } before that move, for the moves Lean got to.
export const readMoveStates = (output, { segments }) => {
    const messages = parseLeanMessages(output);
    const states = new Map();
    segments.forEach((segment) => {
        const own = segmentOutput(messages, segment);
        if (findLeanProblem(own)) return;
        const goal = openGoals(own, segment.stateLine).at(-1);
        if (!goal) return;
        const { objects, sets, isThing } = objectsOf(goal.assumptions);
        states.set(segment.blockId, {
            assumptions: [...new Set(goal.assumptions.filter((a) => !isDeclaration(a.prop) && !isThing(a)).map(({ prop }) => prop))],
            objects,
            sets,
            goal: goal.goal,
        });
    });
    return states;
};

// Gives each move its state (or none, where Lean did not get to it).
export const applyMoveStates = (workspace, states) => {
    proofMoves(workspace).forEach((block) => {
        if (!block.setStateBefore) return;
        Blockly.Events.disable();
        try {
            block.setStateBefore(states.get(block.id) || null);
        } finally {
            Blockly.Events.enable();
        }
    });
};
