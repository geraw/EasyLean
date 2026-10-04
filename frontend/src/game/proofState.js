import { parseLeanMessages } from './leanErrors';

// Reads the goals left open at a point of the proof from Lean's "unsolved
// goals" errors. The proof was cut at that point (see generateGameLeanSource),
// so its goals are reported on stateLine, the line opening the part of the
// proof that was still open; parts nested inside it that were left unfinished
// are reported on later lines, and are open too.

// One goal: its optional case tag, its assumptions and what is left to prove.
const parseGoal = (text) => {
    const lines = text.split('\n');
    const caseName = lines[0].startsWith('case ') ? lines.shift().slice('case '.length).trim() : null;
    const goalIndex = lines.findIndex((line) => line.startsWith('⊢'));
    if (goalIndex === -1) return null;
    const assumptions = [];
    lines.slice(0, goalIndex).forEach((line) => {
        if (/^\s/.test(line) && assumptions.length > 0) {
            // A long assumption continues on indented lines.
            assumptions[assumptions.length - 1].prop += ` ${line.trim()}`;
            return;
        }
        const separator = line.indexOf(':');
        if (separator === -1) return;
        assumptions.push({ name: line.slice(0, separator).trim(), prop: line.slice(separator + 1).trim() });
    });
    const goal = [lines[goalIndex].slice(1), ...lines.slice(goalIndex + 1)].map((line) => line.trim()).join(' ').trim();
    return { caseName, assumptions, goal };
};

const goalsOfMessage = (text) => text
    .replace(/^unsolved goals\s*\n/, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim() && parseGoal(block.replace(/^\n+|\n+$/g, '')))
    .filter(Boolean);

// The open goals at stateLine and below, the part's own goals last (they come
// after the ones of the parts nested inside it), or [] if none is open.
export const openGoals = (output, stateLine) => {
    const unsolved = parseLeanMessages(output)
        .filter(({ severity, text, line }) => severity === 'error' && /^unsolved goals/.test(text) && line >= stateLine);
    const nested = unsolved.filter(({ line }) => line > stateLine).sort((a, b) => a.line - b.line);
    const own = unsolved.filter(({ line }) => line === stateLine);
    return [...nested, ...own].flatMap(({ text }) => goalsOfMessage(text));
};

// Hebrew names for the parts Lean's rules split a proof into.
const CASE_LABELS = {
    left: 'צד שמאל',
    right: 'צד ימין',
    mp: 'כיוון ראשון (→)',
    mpr: 'כיוון שני (←)',
    hab: 'הכלה ראשונה (⊆)',
    hba: 'הכלה שנייה (⊇)',
    zero: 'בסיס',
    succ: 'צעד',
    inl: 'מקרה ראשון',
    inr: 'מקרה שני',
};

export const goalLabel = (goal, index) => CASE_LABELS[goal.caseName?.split('.').pop()] || `מטרה ${index + 1}`;
