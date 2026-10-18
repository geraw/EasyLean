import * as Blockly from 'blockly/core';
import { generateGameLeanSource, proofMoves } from './gameLeanCode';
import { findLeanProblem, parseLeanMessages } from './leanErrors';
import { openGoals } from './proofState';

// The proof state before each move, from one Lean check: the proof cut right
// before each move becomes its own theorem, all after one shared header.
// Each theorem's messages are read on their own, with their own line numbers.
// Moves that write what they give (setStateAfter: unfolding a definition,
// replacing by an equality or an equivalence) also get the state right after
// them, from a theorem cut there.

// Declarations of the level's vocabulary (P Q : Prop) are not assumptions.
const isDeclaration = (prop) => /^(Prop|Type|Sort)\b|→ Prop$/.test(prop.trim());

export const buildMoveStatesSource = (workspace, level, preamble = '') => {
    const moves = proofMoves(workspace);
    if (moves.length === 0) return null;
    let header = null;
    let line = 0; // lines of the combined code so far
    const bodies = [];
    const cuts = moves.flatMap((move) => [{ move, after: false }, ...(move.setStateAfter ? [{ move, after: true }] : [])]);
    const segments = cuts.map(({ move, after }, index) => {
        const name = `${level.name}_${after ? 'after' : 'before'}_${index}`;
        const source = generateGameLeanSource(workspace, { ...level, name }, preamble, { includeFallback: false, untilBlockId: move.id, includeUntilBlock: after });
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
        return { blockId: move.id, after, offset: firstLine - ownFirstLine, firstLine, lastLine: line, stateLine: source.stateLine };
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
    // Natural numbers (n : ℕ), and lists, trees and formulas (unit 11), are objects too.
    // A pair of objects (obj × obj) is one too.
    const isObject = ({ prop }) => domains.has(prop.trim()) || ['Nat', 'ℕ', 'Tree', 'Formula'].includes(prop.trim()) || /^List\s/.test(prop.trim())
        || prop.trim().split(' × ').every((part) => domains.has(part));
    const isSet = ({ prop }) => /^Set\b/.test(prop.trim());
    // A relation is a set of pairs (R : Set (obj × obj), unit 8).
    const isRelation = ({ prop }) => /^Set\s*\(.*×.*\)$/.test(prop.trim());
    // A function between domains or sets of them (f : obj → obj, unit 9).
    const isType = (text) => domains.has(text) || ['Nat', 'ℕ'].includes(text) || /^Set\s/.test(text);
    const isFunction = ({ prop }) => { const sides = prop.trim().split(' → '); return sides.length === 2 && sides.every(isType); };
    const names = (test) => assumptions.filter(test).flatMap(({ name }) => name.split(/\s+/));
    return {
        objects: names(isObject),
        sets: names((a) => isSet(a) && !isRelation(a)),
        relations: names(isRelation),
        functions: names(isFunction),
        isThing: (a) => isObject(a) || isSet(a) || isFunction(a),
    };
};

// blockId → { assumptions, objects, sets, goal } before that move, for the moves
// Lean got to; and `${blockId}:after` → the state right after it, for the moves
// that write what they give (and that Lean accepted).
export const readMoveStates = (output, { segments }) => {
    const messages = parseLeanMessages(output);
    const states = new Map();
    segments.forEach((segment) => {
        const own = segmentOutput(messages, segment);
        if (findLeanProblem(own)) return;
        const goal = openGoals(own, segment.stateLine).at(-1);
        if (!goal) return;
        const { objects, sets, relations, functions, isThing } = objectsOf(goal.assumptions);
        states.set(segment.after ? `${segment.blockId}:after` : segment.blockId, {
            assumptions: [...new Set(goal.assumptions.filter((a) => !isDeclaration(a.prop) && !isThing(a)).map(({ prop }) => prop))],
            objects,
            sets,
            relations,
            functions,
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
            block.setStateAfter?.(states.get(`${block.id}:after`) || null);
        } finally {
            Blockly.Events.enable();
        }
    });
};
