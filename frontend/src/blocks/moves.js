import * as Blockly from 'blockly/core';
import { leanBranches, leanGenerator } from '../generator/lean';
import { PLACEHOLDER } from '../blocks/gameBlocks';
import { boundNames, formatProofGoal, freshName, negatedStatement, splitConnective, splitImplication, splitQuantifier, splitRelation, substitute, unfoldMembership } from '../game/formatProofGoal';
import { isolateFormulas, isolateHebrew } from '../game/bidi';
import { hasNoVariables, unfoldableParts } from '../game/terms';

// The moves of the course: they read like a proof written by hand ("נניח P
// ונוכיח Q"), and assumptions have no names. A move points to
// an assumption by what it says, chosen from the assumptions in hand or typed
// in; Lean finds the assumption by its statement (‹P›).

const WRITE_OWN = '__write_own__';
const WRITE_OWN_LABEL = '✎ כתיבה ידנית...';

// A formula as students see it: fully parenthesized, in left-to-right order.
const shown = (formula) => isolateFormulas(formatProofGoal(formula));

// What a student typed, in Lean's notation (the contradiction ⊥ is False),
// with a name's subscript typed after an underscore, x_0, as x₀.
export const normalizeTyped = (text) => text.trim().replace(/->/g, '→').replace(/⊥/g, 'False').replace(/\s+/g, ' ')
    .replace(/(?<=\p{L})_(\d+)/gu, (_, digits) => digits.replace(/\d/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[digit]));

// The statement of an assumption: a menu of the assumptions in hand before the
// move (block.stateBefore, from Lean), and a last item for typing one in.
// With objects, the same for an object of the domain or a set, by its name.
// For a statement that may also be the goal (withGoal), the goal is offered
// first; only the statements that pass the filter are offered. A field for
// where something happens (goalOption) offers "the goal" itself, first.
const GOAL = '__goal__';
// Terms a level offers where an object is chosen (level.terms).
let levelTerms = [];
export const setLevelTerms = (terms = []) => { levelTerms = terms; };
const GOAL_LABEL = 'המטרה';
const optionLabel = (value) => (value === PLACEHOLDER ? PLACEHOLDER : value === GOAL ? GOAL_LABEL : shown(value));

class FieldAssumption extends Blockly.FieldDropdown {
    constructor({ objects = false, withGoal = false, goalOption = false, filter = () => true } = {}) {
        super(function () {
            const state = this.getSourceBlock()?.stateBefore;
            // With sets, the empty set is a set too, for a "for all sets"; with
            // functions, their values at the objects in hand, f(x₀); and the
            // terms the level offers (level.terms, e.g. a set for Cantor's theorem).
            const values = (state?.functions || []).flatMap((f) => (state?.objects || []).map((x) => `${f} ${x}`));
            const inHand = objects
                ? [...new Set([...(state?.objects || []), ...(state?.sets || []), ...(state?.sets?.length ? ['∅'] : []), ...values, ...levelTerms])]
                : [...new Set([...(goalOption ? [GOAL] : []), ...(withGoal && state?.goal ? [state.goal] : []), ...(state?.assumptions || [])])].filter((value) => value === GOAL || filter(value));
            const options = inHand.map((value) => [optionLabel(value), value]);
            // A new field starts as the first option: the placeholder (or the goal).
            const current = this.getValue() || (goalOption ? GOAL : PLACEHOLDER);
            if (!inHand.includes(current)) options.unshift([optionLabel(current), current]);
            return [...options, [WRITE_OWN_LABEL, WRITE_OWN]];
        });
        this.prompt = objects ? 'כתבו עצם, למשל a או n + 1 (ואת x₀ כ־x_0)' : 'כתבו את הטענה של ההנחה, למשל P → Q (ואת x₀ כ־x_0)';
    }

    // Any statement is a value: Lean checks that it is an assumption in hand.
    doClassValidation_(value) {
        if (value === WRITE_OWN) {
            // After the menu closes, ask for the statement.
            setTimeout(() => Blockly.dialog.prompt(isolateFormulas(this.prompt), [PLACEHOLDER, GOAL].includes(this.getValue()) ? '' : this.getValue(), (typed) => {
                if (typed && normalizeTyped(typed)) this.setValue(normalizeTyped(typed));
            }));
            return null;
        }
        return typeof value === 'string' && value.trim() ? value : null;
    }

    doValueUpdate_(value) {
        super.doValueUpdate_(value);
        this.selectedOption = [optionLabel(value), value];
        // The block's text may depend on the statement (e.g. its conclusion).
        this.getSourceBlock()?.updateText?.();
    }
}

// The statement of an intermediate claim (the move claim): a menu of claims
// the level offers (level.claims, set when the level is loaded), some of them
// not needed, and a last item for typing one in.
let levelClaims = [];
export const setLevelClaims = (claims = []) => { levelClaims = claims; };


class FieldClaim extends FieldAssumption {
    constructor() {
        super();
        this.menuGenerator_ = function () {
            const current = this.getValue() || PLACEHOLDER;
            const options = levelClaims.map((value) => [optionLabel(value), value]);
            if (!levelClaims.includes(current)) options.unshift([optionLabel(current), current]);
            return [...options, [WRITE_OWN_LABEL, WRITE_OWN]];
        };
        this.prompt = 'כתבו את טענת העזר, למשל A ⊆ B';
    }
}

// Which side of an "or" to prove, shown by its statement once the goal before
// the move is known (block.stateBefore). A new field starts unchosen.
class FieldSide extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const sides = splitConnective(this.getSourceBlock()?.stateBefore?.goal, '∨');
            const options = [[sides ? shown(sides[0]) : 'צד שמאל', 'LEFT'], [sides ? shown(sides[1]) : 'צד ימין', 'RIGHT']];
            const current = this.getValue();
            return !current || current === PLACEHOLDER ? [[PLACEHOLDER, PLACEHOLDER], ...options] : options;
        });
    }

    // Shows the chosen side by the goal before the move, as it is now.
    refreshText() {
        const option = this.getOptions(false).find(([, value]) => value === this.getValue());
        if (!option) return;
        this.selectedOption = option;
        this.forceRerender();
    }
}

// The direction of a substitution by an equality, shown as the replacement
// it makes once the equality is chosen ("את y ב־x + 7"); see rewrite.
class FieldDirection extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const sides = splitRelation(filled(this.getSourceBlock()?.getFieldValue('EQUATION')) && this.getSourceBlock().getFieldValue('EQUATION'), '=');
            return sides
                ? [[isolateHebrew(`את ${shown(sides[0])} ב־${shown(sides[1])}`), 'FORWARD'], [isolateHebrew(`את ${shown(sides[1])} ב־${shown(sides[0])}`), 'BACKWARD']]
                : [['משמאל לימין', 'FORWARD'], ['מימין לשמאל', 'BACKWARD']];
        });
    }

    // Shows the chosen direction by the equality, as it is now.
    refreshText() {
        const option = this.getOptions(false).find(([, value]) => value === this.getValue());
        if (!option) return;
        this.selectedOption = option;
        this.forceRerender();
    }
}

// Unit 6. The laws of logical equivalence, each proved earlier (in a truth
// table of unit 1, or in both directions by moves), as students read them
// (with schematic letters A, B, as the moves of unit 4 do) and as Lean's
// lemmas (EQUIV_PRELUDE). A law about a quantifier is restated with the bound
// variable of the formula it is used in (see variable), so that a substitution
// keeps the formula's names. Double negation is used only to remove one:
// backward, its side A fits any statement.
// Each side of a law: when a formula has its form (match, giving the parts),
// and the formula it is for given parts (text, in Lean's spelling).
const both = (symbol, negatedLeft, negatedRight) => ({
    match: (formula) => {
        const sides = splitConnective(formula, symbol);
        if (!sides) return null;
        const a = negatedLeft ? negatedStatement(sides[0]) : sides[0];
        const b = negatedRight ? negatedStatement(sides[1]) : sides[1];
        return a && b ? { a, b } : null;
    },
    text: ({ a, b }) => `(${negatedLeft ? '¬' : ''}(${a})) ${symbol} (${negatedRight ? '¬' : ''}(${b}))`,
});
const negated = (symbol) => ({
    match: (formula) => {
        const sides = splitConnective(negatedStatement(formula), symbol);
        return sides ? { a: sides[0], b: sides[1] } : null;
    },
    text: ({ a, b }) => `¬((${a}) ${symbol} (${b}))`,
});
const quantified = (symbol, negatedOutside) => ({
    match: (formula) => {
        const quantifier = splitQuantifier(negatedOutside ? negatedStatement(formula) : formula, symbol);
        if (!quantifier) return null;
        const body = negatedOutside ? quantifier.body : negatedStatement(quantifier.body);
        return body ? { x: quantifier.variable, body } : null;
    },
    text: ({ x, body }) => (negatedOutside ? `¬${symbol} ${x}, ${body}` : `${symbol} ${x}, ¬(${body})`),
});
const negatedTwice = {
    match: (formula) => {
        const denied = negatedStatement(negatedStatement(formula));
        return denied ? { a: denied } : null;
    },
    text: ({ a }) => `¬¬(${a})`,
};
const any = { match: (formula) => ({ a: formula }), text: ({ a }) => a };
// Contraposition: ¬B → ¬A has the parts in the other order.
const contraposed = {
    match: (formula) => {
        const parts = both('→', true, true).match(formula);
        return parts && { a: parts.b, b: parts.a };
    },
    text: ({ a, b }) => `(¬(${b})) → (¬(${a}))`,
};

// Unit 6. The laws of logical equivalence, each proved earlier (in a truth
// table of unit 1, or in both directions by moves), as students read them
// (with schematic letters A, B, as the moves of unit 4 do), as Lean's lemmas
// (EQUIV_PRELUDE), and as the forms of their two sides, to show what a
// replacement replaces. A law about a
// quantifier is restated with the bound variable of the formula it is used in
// (see variable), so that a substitution keeps the formula's names. Double
// negation is used only to remove one: backward, its side A fits any statement.
export const LAWS = [
    { value: 'easylean_not_not', left: '¬¬A', right: 'A', backward: false, sides: [negatedTwice, any] },
    { value: 'easylean_not_or', left: '¬(A ∨ B)', right: '(¬A ∧ ¬B)', sides: [negated('∨'), both('∧', true, true)] },
    { value: 'easylean_not_and', left: '¬(A ∧ B)', right: '(¬A ∨ ¬B)', sides: [negated('∧'), both('∨', true, true)] },
    { value: 'easylean_imp_or', left: '(A → B)', right: '(¬A ∨ B)', sides: [both('→', false, false), both('∨', true, false)] },
    { value: 'easylean_or_as_imp', left: '(¬A → B)', right: '(A ∨ B)', sides: [both('→', true, false), both('∨', false, false)] },
    { value: 'easylean_contrapositive', left: '(A → B)', right: '(¬B → ¬A)', sides: [both('→', false, false), contraposed] },
    { value: 'easylean_not_imp', left: '¬(A → B)', right: '(A ∧ ¬B)', sides: [negated('→'), both('∧', false, true)] },
    {
        value: 'easylean_not_exists', left: '¬∃x (P(x))', right: '∀x (¬P(x))', sides: [quantified('∃', true), quantified('∀', false)],
        statement: (x) => `(¬∃ ${x}, p ${x}) ↔ ∀ ${x}, ¬p ${x}`,
        variable: [/¬\s*∃\s*\(?\s*([^\s,:()]+)/, /∀\s*\(?\s*([^\s,:()]+)[^,]*,\s*¬/],
    },
    {
        value: 'easylean_not_forall', left: '¬∀x (P(x))', right: '∃x (¬P(x))', sides: [quantified('∀', true), quantified('∃', false)],
        statement: (x) => `(¬∀ ${x}, p ${x}) ↔ ∃ ${x}, ¬p ${x}`,
        variable: [/¬\s*∀\s*\(?\s*([^\s,:()]+)/, /∃\s*\(?\s*([^\s,:()]+)[^,]*,\s*¬/],
    },
];

// The parts of a formula, in the order Lean's rewrite looks at them: a
// formula before its parts, and the left part before the right one.
const formulaParts = (formula) => {
    for (const symbol of ['↔', '→', '∨', '∧']) {
        const sides = splitConnective(formula, symbol);
        if (sides) return sides;
    }
    const denied = negatedStatement(formula);
    if (denied) return [denied];
    const quantifier = splitQuantifier(formula, '∀') || splitQuantifier(formula, '∃');
    return quantifier ? [quantifier.body] : [];
};

// The parts of a formula of the given side's form, in that order, each as the
// replacement it makes: [what is replaced, by what].
const lawInstances = (law, backward, formula) => {
    const [from, to] = backward ? [law.sides[1], law.sides[0]] : law.sides;
    const found = [];
    const search = (part) => {
        const parts = from.match(part);
        if (parts) found.push([from.text(parts), to.text(parts)]);
        formulaParts(part).forEach(search);
    };
    if (formula && from !== any) search(formula);
    return found;
};

const lawOf = (value) => LAWS.find((law) => law.value === value);
const lawLabel = (law) => `${law.left} ↔ ${law.right}`;

// The laws a level offers (level.laws), set when the level is loaded, as its
// toolbox offers only the moves of its solutions.
let levelLaws = [];
export const setLevelLaws = (laws = []) => { levelLaws = laws; };

// The law of an equivalence move: a menu of the level's laws.
class FieldLaw extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const values = [...new Set([...levelLaws, this.getValue()])].filter((value) => lawOf(value));
            return [[PLACEHOLDER, PLACEHOLDER], ...values.map((value) => [isolateFormulas(lawLabel(lawOf(value))), value])];
        });
    }

    // Any law, also one set before the level's laws are (a test, a saved proof).
    doClassValidation_(value) {
        return value === PLACEHOLDER || lawOf(value) ? value : null;
    }
}

// Which side of the chosen law to replace by the other, shown by the law.
class FieldLawDirection extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const block = this.getSourceBlock();
            const law = lawOf(block?.getFieldValue('LAW'));
            if (!law) return [['משמאל לימין', 'FORWARD'], ['מימין לשמאל', 'BACKWARD']];
            // What it replaces in the chosen place, when that has the side's form;
            // otherwise the law's sides themselves.
            const target = block.getFieldValue('TARGET');
            const formula = target === GOAL ? block.stateBefore?.goal : filled(target) && target;
            const sides = (backward) => (backward ? [law.right, law.left] : [law.left, law.right]).map(isolateFormulas);
            // The first part of that form, as Lean finds it.
            const option = (backward) => {
                const instances = lawInstances(law, backward, formula);
                const [from, to] = instances.length ? instances[0].map(shown) : sides(backward);
                return [isolateHebrew(`את ${from} ב־${to}`), backward ? 'BACKWARD' : 'FORWARD'];
            };
            return law.backward === false ? [option(false)] : [option(false), option(true)];
        });
    }

    doClassValidation_(value) {
        return ['FORWARD', 'BACKWARD'].includes(value) ? value : null;
    }

    refreshText() {
        const options = this.getOptions(false);
        const option = options.find(([, value]) => value === this.getValue());
        if (!option) {
            this.setValue(options[0][1]);
            return;
        }
        this.selectedOption = option;
        this.forceRerender();
    }
}

// The structures that induction is on, each by the ways it is built (units 11
// and 11): a part of the proof for each, headed by what is proved in it. A
// part's case in Lean names the parts of the structure (args) and the
// induction hypotheses (one _ each, found by their statement); the structure's
// own parts that are like it get the variable's name, as Logic and Proof
// keeps n in the step ("נניח P(n) ונוכיח P(n + 1)").
const other = (variable, name, instead) => (variable === name ? instead : name);
const STRUCTURES = {
    Nat: [
        { input: 'BASE', ctor: 'zero', args: () => [], hypotheses: () => [], term: () => '0' },
        { input: 'STEP', ctor: 'succ', args: (v) => [v], hypotheses: (v) => [v], term: (v) => `${v} + 1` },
    ],
    List: [
        { input: 'NIL', ctor: 'nil', args: () => [], hypotheses: () => [], term: () => '[]' },
        { input: 'CONS', ctor: 'cons', args: (v) => [other(v, 'a', 'b'), v], hypotheses: (v) => [v], term: (v) => `${other(v, 'a', 'b')} :: ${v}` },
    ],
    Tree: [
        { input: 'LEAF', ctor: 'leaf', args: () => [], hypotheses: () => [], term: () => 'leaf' },
        { input: 'NODE', ctor: 'node', args: () => ['l', 'r'], hypotheses: () => ['l', 'r'], term: () => 'node l r' },
    ],
};
const formulaCases = (connectives) => [
    { input: 'ATOM', ctor: 'atom', args: () => ['i'], hypotheses: () => [], term: () => 'atom i' },
    { input: 'NEG', ctor: 'neg', args: (v) => [v], hypotheses: (v) => [v], term: (v) => `neg ${v}` },
    ...connectives.map((ctor) => ({
        input: ctor.toUpperCase(), ctor,
        args: (v) => [v, other(v, 'ψ', 'χ')], hypotheses: (v) => [v, other(v, 'ψ', 'χ')], term: (v) => `${ctor} ${v} ${other(v, 'ψ', 'χ')}`,
    })),
];
STRUCTURES.Formula = formulaCases(['conj']);
const TYPICAL_NAMES = { Nat: 'n', List: 'l', Tree: 't', Formula: 'φ' };

// The structure the level's induction is on (level.structure), set when the
// level is loaded: the induction move's parts are its cases.
let levelStructure = 'Nat';
export const setLevelStructure = (structure = 'Nat') => { levelStructure = STRUCTURES[structure] ? structure : 'Nat'; };

// The functions defined by recursion, and the definitions of addition and
// power (units 11 and 12): their names, the structure they are defined on, and
// the equations that unfold them (the first that applies).
const FUNCTIONS = [
    ['double', 'double', ['double'], 'Nat'],
    ['sumTo', 'sumTo', ['sumTo'], 'Nat'],
    ['oddSum', 'oddSum', ['oddSum'], 'Nat'],
    ['sumCubes', 'sumCubes', ['sumCubes'], 'Nat'],
    ['החיבור', 'add', ['easylean_add_succ'], 'Nat'],
    ['החזקה', 'pow', ['Nat.pow_succ'], 'Nat'],
    ['++', 'append', ['List.nil_append', 'List.cons_append'], 'List'],
    ['length', 'length', ['List.length'], 'List'],
    ['leaves', 'leaves', ['leaves'], 'Tree'],
    ['nodes', 'nodes', ['nodes'], 'Tree'],
    ['height', 'height', ['height'], 'Tree'],
    ['mirror', 'mirror', ['mirror'], 'Tree'],
    ['opening', 'opening', ['opening'], 'Formula'],
    ['closing', 'closing', ['closing'], 'Formula'],
    ['atoms', 'atoms', ['atoms'], 'Formula'],
    ['binaries', 'binaries', ['binaries'], 'Formula'],
    ['negations', 'negations', ['negations'], 'Formula'],
    ['depth', 'depth', ['depth'], 'Formula'],
];
const functionOf = (value) => FUNCTIONS.find(([, candidate]) => candidate === value);
const structureFunctions = () => FUNCTIONS.filter(([, , , structure]) => structure === levelStructure);

// Which part of the chosen place to unfold the definition in: a menu of the
// parts it applies to there (see game/terms.js), one at a time, so that the
// proof says what it rewrites. A new block takes the first part, in the order
// they are read (which is also where Lean would unfold first).
class FieldPart extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const parts = this.getSourceBlock()?.unfoldableParts?.() || [];
            const options = parts.map((part) => [shown(part), part]);
            const current = this.getValue() || PLACEHOLDER;
            if (!parts.includes(current)) options.unshift([current === PLACEHOLDER ? PLACEHOLDER : shown(current), current]);
            return options;
        });
    }

    doClassValidation_(value) {
        return typeof value === 'string' && value.trim() ? value : null;
    }

    // Shows the chosen part as it is now; a block without one takes the first.
    refreshText() {
        const parts = this.getSourceBlock()?.unfoldableParts?.() || [];
        if (this.getValue() === PLACEHOLDER && parts.length) {
            this.setValue(parts[0]);
            return;
        }
        this.selectedOption = this.getOptions(false).find(([, value]) => value === this.getValue()) || this.selectedOption;
        this.forceRerender();
    }
}

// The function whose definition to unfold: a menu of those of the level's structure.
class FieldFunction extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const values = [...structureFunctions().map(([, value]) => value), this.getValue()].filter((value, index, all) => functionOf(value) && all.indexOf(value) === index);
            return [[PLACEHOLDER, PLACEHOLDER], ...values.map((value) => [functionOf(value)[0], value])];
        });
    }

    // Any function, also one set before the level's structure is (a test, a saved proof).
    doClassValidation_(value) {
        return value === PLACEHOLDER || functionOf(value) ? value : null;
    }
}

const MOVE_COLOUR = 160;

const move = (block, tooltip) => {
    block.setPreviousStatement(true, 'tactic');
    block.setNextStatement(true, 'tactic');
    block.setColour(MOVE_COLOUR);
    block.setTooltip(tooltip);
};

// A sentence that follows the proof state and the fields, as a row of labels:
// Hebrew and formulas in separate labels, since one label mixing them is
// drawn left to right. Unused labels are hidden. A move has its sentence
// (PHRASE0…), and a move that splits the proof also has one heading each part
// (LEFT_TEXT0… for the part LEFT).
const PHRASE_LENGTH = 6;

const appendPhrase = (block, input = block.appendDummyInput('PHRASE'), prefix = 'PHRASE') => {
    for (let index = 0; index < PHRASE_LENGTH; index += 1) input.appendField(new Blockly.FieldLabel(''), `${prefix}${index}`);
    return input;
};

// A part of the proof, headed by its own sentence.
const appendPart = (block, name) => appendPhrase(block, block.appendStatementInput(name).setCheck('tactic'), `${name}_TEXT`);

// Sets the sentence, given as Hebrew strings and { formula } parts, without
// firing events: it is not a change the student made. The punctuation after a
// formula (end: '.') is in its label, after a right-to-left mark (RLM): a
// label is drawn left to right, and Blockly ends it with an RLM, so the mark
// before the formula makes the formula and its punctuation one right-to-left
// run, with the punctuation on the formula's left, where the sentence ends.
const RLM = '\u200f';
const setPhrase = (block, parts, prefix = 'PHRASE') => {
    Blockly.Events.disable();
    try {
        for (let index = 0; index < PHRASE_LENGTH; index += 1) {
            const field = block.getField(`${prefix}${index}`);
            if (!field) return;
            const part = parts[index];
            const formula = part?.raw !== undefined ? isolateFormulas(part.raw) : part && shown(part.formula);
            const text = part === undefined ? '' : typeof part === 'string' ? part : part.end ? `${RLM}${formula}${part.end}` : formula;
            if (field.getValue() !== text) field.setValue(text);
            if (field.isVisible() !== Boolean(text)) field.setVisible(Boolean(text));
        }
    } finally {
        Blockly.Events.enable();
    }
    if (block.rendered) block.queueRender?.();
};

const setPartHeading = (block, name, parts) => setPhrase(block, parts, `${name}_TEXT`);

// A part headed by several lines (an induction step: "נניח" a line for each
// hypothesis, then "ונוכיח"), so that the block does not grow wide: rows
// above the part (shown only when used), and the part's own row last.
const appendHeadedPart = (block, name, rows) => {
    for (let row = 1; row <= rows; row += 1) appendPhrase(block, block.appendDummyInput(`${name}_ROW${row}`), `${name}_ROW${row}_TEXT`);
    appendPart(block, name);
};
const setPartHeadingLines = (block, name, lines) => {
    const above = lines.slice(0, -1);
    for (let row = 1; block.getInput(`${name}_ROW${row}`); row += 1) {
        const input = block.getInput(`${name}_ROW${row}`);
        setPhrase(block, above[row - 1] || [], `${name}_ROW${row}_TEXT`);
        if (input.isVisible() !== Boolean(above[row - 1])) input.setVisible(Boolean(above[row - 1]));
    }
    setPartHeading(block, name, lines.at(-1));
};
// A part's heading as students read it, all its lines (for tests).
export const headingOf = (block, name) => [
    ...Array.from({ length: 3 }, (_, index) => block.getInput(`${name}_ROW${index + 1}`)).filter((input) => input?.isVisible())
        .map((input) => phraseOf(block, `${input.name}_TEXT`)),
    phraseOf(block, `${name}_TEXT`),
].join(' ');

// The sentence as students read it, or a part's heading (for tests).
export const phraseOf = (block, prefix = 'PHRASE') => Array.from({ length: PHRASE_LENGTH }, (_, index) => block.getFieldValue(`${prefix}${index}`))
    .filter(Boolean).join(' ').replace(/[\u2066\u2069\u200f]/g, '');

const filled = (value) => value && value !== PLACEHOLDER;

const negation = (formula) => `¬(${formula})`;

// The element taken to prove an inclusion: a set when the sets are of sets
// (a power set), a pair (x₀, y₀) when they are relations (unit 9), otherwise
// an object.
const elementName = (block, smaller, larger = '') => {
    if (isRelationSet(block, smaller) || isRelationSet(block, larger)) {
        // With a composition, (x₀, z₀), so that its middle is y₀, as the
        // definitions (of composition, of transitivity) name it.
        const x = newObjectName(block, 'x');
        return `(${x}, ${freshName(`${smaller} ${larger}`.includes('∘') ? 'z' : 'y', [...thingsInHand(block), x])})`;
    }
    if (smaller.startsWith('Set.image')) return newObjectName(block, 'y');
    return newObjectName(block, smaller.startsWith('𝒫') || larger.startsWith('𝒫') ? 'X' : 'x');
};
// Whether a set expression is built from relations in hand (an equivalence
// class [x]_R is a set of objects).
const isRelationSet = (block, text) => (text.replace(/\[[^\]]*\]_\S+/g, '').match(/\p{L}[\p{L}\p{N}₀-₉_']*/gu) || [])
    .some((name) => block.stateBefore?.relations?.includes(name));

// The name of a new object: its variable's, unless an object in hand has it,
// or a variable bound in a statement in hand or in the goal does, so that an
// object never reads as a bound variable; then the first subscript free, x₀
// (see freshName). The object ∀ introduction and ∃ elimination take is named
// apart from the variable of the statement they take apart: "יהי x₀ שרירותי".
const thingsInHand = (block) => [...(block.stateBefore?.objects || []), ...(block.stateBefore?.sets || []), ...(block.stateBefore?.relations || []), ...(block.stateBefore?.functions || [])];
const takenNames = (block) => [...thingsInHand(block), ...[...(block.stateBefore?.assumptions || []), block.stateBefore?.goal || ''].flatMap(boundNames)];
const newObjectName = (block, variable) => freshName(variable, takenNames(block));
const arbitraryObjectName = (block, variable) => freshName(variable, [...takenNames(block), variable]);

const sameStatement = (a, b) => formatProofGoal(a) === formatProofGoal(b);

// Whether a statement chosen in a move is the goal before it.
const isGoal = (block, statement) => Boolean(block.stateBefore?.goal) && sameStatement(block.stateBefore.goal, statement);

// What contradicts the chosen statement: its negation, or, for a negation
// ¬Q, the statement Q it denies (unless ¬¬Q is what is in hand).
const contradictionPartner = (fact, inHand = []) => {
    const denied = negatedStatement(fact);
    return denied && !inHand.some((formula) => sameStatement(formula, negation(fact))) ? denied : negation(fact);
};

// Blocks keep their text up to date: from their own fields (see
// FieldAssumption), and from the proof state before them (stateBefore, set by
// the game workspace).
const followState = {
    setStateBefore(state) {
        this.stateBefore = state;
        this.updateText();
    },
};

// A move that changes a statement writes what it gives, as a written proof
// does ("ונקבל ..."), from Lean's state right after it (see moveStates.js): on
// the goal, what is left to prove; on a statement in hand, the new one, which
// joins the assumptions. Until Lean has checked the move, "ונקבל …".
const followResult = {
    ...followState,
    setStateAfter(state) {
        this.stateAfter = state;
        this.updateText();
    },
};
// The induction hypotheses where a move is: in a step of an induction, the
// statements its heading assumes ("נניח P(l) ו־P(r)"), as Lean spells them,
// so that a move that uses one says so, as written proofs do ("לפי הנחת
// האינדוקציה"). The nearest induction around the move counts.
const inductionHypotheses = (block) => {
    for (let child = block, parent = block.getSurroundParent(); parent; child = parent, parent = parent.getSurroundParent()) {
        if (parent.type !== 'induction') continue;
        let first = child;
        while (first.getPreviousBlock() && first.getPreviousBlock() !== parent) first = first.getPreviousBlock();
        const input = parent.inputList.find((candidate) => candidate.connection?.targetBlock() === first);
        const part = STRUCTURES[parent.structure || 'Nat'].find(({ input: name }) => name === input?.name);
        const variable = parent.getFieldValue('VARIABLE');
        const goal = parent.stateBefore?.goal;
        if (!part || !filled(variable) || !goal) return [];
        return part.hypotheses(variable).map((name) => substitute(goal, variable, name));
    }
    return [];
};
const isInductionHypothesis = (block, statement) => filled(statement) && inductionHypotheses(block).some((hypothesis) => sameStatement(hypothesis, statement));

// A label set by the move's text, without firing events.
const setLabel = (block, name, text) => {
    const field = block.getField(name);
    if (!field || field.getValue() === text) return;
    Blockly.Events.disable();
    try {
        field.setValue(text);
    } finally {
        Blockly.Events.enable();
    }
};

// The assumptions that arithmetic or algebra is to use, chosen by their
// statement: the first (FACT), then each more in a field of its own (AND1,
// AND2, ...), the last of which is empty until one more is chosen, so that the
// move says what it uses: "ומ־[A] [ו־B] [ו־C]", or "ומהנחת/ומהנחות האינדוקציה
// ..." when they are induction hypotheses. The field that ends the list is
// empty: only its arrow shows that one more can be chosen.
const NONE = '__none__';
const NONE_LABEL = '\u00a0';
const andLabel = (value) => (value === NONE ? NONE_LABEL : isolateHebrew(`ו־${shown(value)}`));
class FieldOtherAssumption extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const block = this.getSourceBlock();
            const others = chosenFacts(block).filter((fact) => fact !== this.getValue());
            const inHand = (block?.stateBefore?.assumptions || []).filter((statement) => !others.includes(statement));
            const options = [[NONE_LABEL, NONE], ...inHand.map((statement) => [andLabel(statement), statement])];
            const current = this.getValue() || NONE;
            if (!options.some(([, value]) => value === current)) options.push([andLabel(current), current]);
            return options;
        });
    }

    doClassValidation_(value) {
        return typeof value === 'string' && value.trim() ? value : null;
    }

    doValueUpdate_(value) {
        super.doValueUpdate_(value);
        this.selectedOption = [andLabel(value), value];
        this.getSourceBlock()?.updateText?.();
    }
}
const andFields = (block) => block.inputList.flatMap((input) => input.fieldRow).filter((field) => /^AND\d+$/.test(field.name || ''));
// Each further assumption on a row of its own, so that the block does not grow wide.
const appendAndRow = (block, number) => block.appendDummyInput(`ANDROW${number}`).appendField(new FieldOtherAssumption(), `AND${number}`);
const chosenFacts = (block) => (block ? [block.getFieldValue('FACT'), ...andFields(block).map((field) => field.getValue())] : [])
    .filter((value) => filled(value) && value !== NONE);
// Keeps exactly one field that stops the list, after the chosen ones.
const keepOneMoreField = (block) => {
    if (!block.getInput('FROMROW')) return;
    let fields = andFields(block);
    const stop = fields.findIndex((field) => field.getValue() === NONE);
    if (stop >= 0) fields.slice(stop + 1).forEach((field) => block.removeInput(`ANDROW${field.name.slice(3)}`));
    fields = andFields(block);
    if (!fields.length || fields.at(-1).getValue() !== NONE) appendAndRow(block, fields.length + 1);
};
const fromChosen = (block) => {
    const facts = chosenFacts(block);
    if (!facts.length || !facts.every((fact) => isInductionHypothesis(block, fact))) return 'ומ־';
    return facts.length === 1 ? 'ומהנחת האינדוקציה' : 'ומהנחות האינדוקציה';
};
const appendFromChosen = (block, text) => {
    block.appendDummyInput().appendField(text);
    block.appendDummyInput('FROMROW')
        .appendField(new Blockly.FieldLabel('ומ־'), 'FROM')
        .appendField(new FieldAssumption(), 'FACT');
    appendAndRow(block, 1);
};
// The number of fields of further assumptions, so that a copy of the block
// (a drag from the toolbox, undo) has them before their values are set.
const moreFieldsState = {
    saveExtraState() {
        return { more: andFields(this).length };
    },
    loadExtraState(state) {
        for (let count = andFields(this).length; count < (state?.more || 1); count += 1) appendAndRow(this, count + 1);
    },
};

const appendResult = (block) => appendPhrase(block, block.appendDummyInput('RESULTROW'), 'RESULT');
const setResult = (block, target) => {
    const after = block.stateAfter;
    if (after && target === GOAL && after.goal) {
        setPhrase(block, ['ונקבל שצריך להוכיח', { formula: after.goal }], 'RESULT');
        return;
    }
    const added = after && target !== GOAL && after.assumptions.filter((statement) => !(block.stateBefore?.assumptions || []).includes(statement)).at(-1);
    setPhrase(block, added ? ['ונקבל', { formula: added }] : ['ונקבל …'], 'RESULT');
};

// A move that opens a structure of the proof, as the course writes it: an
// opening line, the proof inside it, and a closing line ("נניח P. … לכן
// P → Q."). Nothing follows it, since what is inside proves the goal it was
// given. In Lean, the inside is a part of its own (see leanBranches).
const appendClose = (block) => appendPhrase(block, block.appendDummyInput('CLOSE'), 'CLOSE');
const setClose = (block, parts) => setPhrase(block, parts, 'CLOSE');
const closing = (block, tooltip) => {
    appendClose(block);
    move(block, tooltip);
    block.setNextStatement(false);
};
const wrap = (block, tooltip) => {
    block.appendStatementInput('BODY').setCheck('tactic');
    closing(block, tooltip);
};

export const defineMoveBlocks = () => {
    // Closing the goal: something in hand says exactly the goal ("Q בידינו").
    // Lean looks for it among everything in hand, so the student does not
    // point to it.
    Blockly.Blocks['exact'] = {
        init() {
            appendPhrase(this);
            move(this, 'כאשר אחת ההנחות אומרת בדיוק את מה שעלינו להראות, ההוכחה הושלמה.');
            this.updateText();
        },
        ...followState,
        // In a step whose goal is its induction hypothesis, says so.
        updateText() {
            const goal = this.stateBefore?.goal;
            if (isInductionHypothesis(this, goal)) setPhrase(this, ['זו בדיוק הנחת האינדוקציה.']);
            else if (goal) setPhrase(this, [{ formula: goal }, 'בידינו, וזה מה שעלינו להראות.']);
            else setPhrase(this, ['המטרה בידינו, וזה מה שעלינו להראות.']);
        },
    };

    // Proving an implication: assume its condition, prove its conclusion.
    Blockly.Blocks['assume'] = {
        init() {
            appendPhrase(this);
            wrap(this, 'כדי להוכיח גרירה, מניחים את התנאי שלה ומוכיחים את המסקנה שלה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const parts = splitImplication(goal);
            if (parts && parts[1] !== 'False') {
                setPhrase(this, ['נניח', { formula: parts[0], end: '.' }, 'עלינו להראות', { formula: parts[1], end: '.' }]);
                setClose(this, ['לכן', { formula: goal, end: '.' }]);
            } else {
                setPhrase(this, ['נניח את התנאי של הגרירה. עלינו להראות את המסקנה שלה.']);
                setClose(this, ['לכן הגרירה נכונה.']);
            }
        },
    };

    // Using an implication backward: its conclusion is the goal, so it is
    // enough to prove its condition.
    Blockly.Blocks['apply_rule'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי')
                .appendField(new FieldAssumption(), 'RULE');
            appendPhrase(this);
            move(this, 'אם המסקנה של גרירה שבידינו היא מה שעלינו להראות, די להוכיח את התנאי שלה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const rule = this.getFieldValue('RULE');
            const parts = filled(rule) && splitImplication(rule);
            if (!parts) setPhrase(this, ['כדי להוכיח את המסקנה של הגרירה, די להוכיח את התנאי שלה.']);
            else setPhrase(this, ['כדי להוכיח', { formula: parts[1] }, 'די להוכיח', { formula: parts[0], end: '.' }]);
        },
    };

    // Using an implication forward: from it and its condition, its conclusion.
    Blockly.Blocks['forward'] = {
        init() {
            this.appendDummyInput()
                .appendField('מ־')
                .appendField(new FieldAssumption(), 'RULE')
                .appendField('ומ־')
                .appendField(new FieldAssumption(), 'PREMISE');
            appendPhrase(this);
            move(this, 'מגרירה ומהתנאי שלה נקבל את המסקנה שלה, והיא מצטרפת להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const rule = this.getFieldValue('RULE');
            const parts = filled(rule) && splitImplication(rule);
            setPhrase(this, parts ? ['נקבל', { formula: parts[1], end: '.' }] : ['נקבל את המסקנה של הגרירה.']);
        },
    };

    // Using an "and": both of its sides follow.
    Blockly.Blocks['and_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('מ־')
                .appendField(new FieldAssumption(), 'AND');
            appendPhrase(this);
            move(this, 'מ"P וגם Q" נקבל את P ואת Q. שתיהן מצטרפות להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const and = this.getFieldValue('AND');
            const sides = filled(and) && splitConnective(and, '∧');
            setPhrase(this, sides
                ? ['נקבל', { formula: sides[0] }, 'וגם', { formula: sides[1], end: '.' }]
                : ['נקבל את שני החלקים של ה"וגם".']);
        },
    };

    // Proving an "and": each side in a part of its own.
    Blockly.Blocks['and_intro'] = {
        init() {
            appendPhrase(this);
            appendPart(this, 'LEFT');
            appendPart(this, 'RIGHT');
            closing(this, 'כדי להוכיח "P וגם Q" מוכיחים את P ומוכיחים את Q, כל אחד לחוד.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const sides = splitConnective(goal, '∧');
            setPhrase(this, sides ? ['נוכיח את שני החלקים של', { formula: goal, end: '.' }] : ['נוכיח את שני החלקים של ה"וגם".']);
            setPartHeading(this, 'LEFT', sides ? ['החלק הראשון:', { formula: sides[0] }] : ['החלק הראשון:']);
            setPartHeading(this, 'RIGHT', sides ? ['החלק השני:', { formula: sides[1] }] : ['החלק השני:']);
            setClose(this, sides ? ['הוכחנו את שני החלקים, ולכן', { formula: goal, end: '.' }] : ['הוכחנו את שני החלקים, ולכן ה"וגם" נכון.']);
        },
    };

    // Combining two assumptions into one "and" (proving an "and" forward).
    Blockly.Blocks['and_combine'] = {
        init() {
            this.appendDummyInput()
                .appendField('מ־')
                .appendField(new FieldAssumption(), 'LEFT')
                .appendField('ומ־')
                .appendField(new FieldAssumption(), 'RIGHT');
            appendPhrase(this);
            move(this, 'מ־P ומ־Q נקבל "P וגם Q", והוא מצטרף להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const left = this.getFieldValue('LEFT');
            const right = this.getFieldValue('RIGHT');
            setPhrase(this, filled(left) && filled(right)
                ? ['נקבל', { formula: `(${left}) ∧ (${right})`, end: '.' }]
                : ['נקבל את ה"וגם" של שתיהן.']);
        },
    };

    // Proving an "or" by one of its sides, chosen by what it says.
    Blockly.Blocks['or_intro'] = {
        init() {
            appendPhrase(this).appendField(new FieldSide(), 'SIDE');
            wrap(this, 'כדי להוכיח "P או Q" די להוכיח את אחד הצדדים: את זה שאפשר להוכיח ממה שבידינו.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const or = splitConnective(goal, '∨');
            setPhrase(this, or ? ['כדי להוכיח', { formula: goal }, 'נוכיח את'] : ['כדי להוכיח את ה"או" נוכיח את']);
            setClose(this, or ? ['לכן', { formula: goal, end: '.' }] : ['לכן ה"או" נכון.']);
            this.getField('SIDE')?.refreshText();
        },
    };

    // Using an "or": the goal is proved in each of its cases.
    Blockly.Blocks['or_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('נחלק למקרים לפי')
                .appendField(new FieldAssumption(), 'OR');
            appendPart(this, 'LEFT');
            appendPart(this, 'RIGHT');
            closing(this, 'אם ידוע "P או Q", מוכיחים את המטרה פעם אחת בהנחה P ופעם אחת בהנחה Q.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const or = this.getFieldValue('OR');
            const sides = filled(or) && splitConnective(or, '∨');
            const goal = this.stateBefore?.goal;
            setPartHeading(this, 'LEFT', sides ? ['מקרה 1:', { formula: sides[0] }] : ['מקרה 1: צד שמאל נכון']);
            setPartHeading(this, 'RIGHT', sides ? ['מקרה 2:', { formula: sides[1] }] : ['מקרה 2: צד ימין נכון']);
            setClose(this, goal ? ['המקרים מכסים את כל האפשרויות, ובשניהם', { formula: goal, end: '.' }] : ['המקרים מכסים את כל האפשרויות, ובשניהם המטרה נכונה.']);
        },
    };

    // Proving an "iff": each direction in a part of its own.
    Blockly.Blocks['iff_intro'] = {
        init() {
            appendPhrase(this);
            appendPart(this, 'FORWARD');
            appendPart(this, 'BACKWARD');
            closing(this, 'כדי להוכיח "P אם ורק אם Q" מוכיחים את P → Q ואת Q → P, כל אחת לחוד.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const sides = splitConnective(goal, '↔');
            setPhrase(this, sides ? ['נוכיח את שני הכיוונים של', { formula: goal, end: '.' }] : ['נוכיח את שני הכיוונים של ה"אם ורק אם".']);
            setPartHeading(this, 'FORWARD', sides ? ['הכיוון הראשון:', { formula: `(${sides[0]}) → (${sides[1]})` }] : ['הכיוון הראשון (→):']);
            setPartHeading(this, 'BACKWARD', sides ? ['הכיוון השני:', { formula: `(${sides[1]}) → (${sides[0]})` }] : ['הכיוון השני (←):']);
            setClose(this, sides ? ['הוכחנו את שני הכיוונים, ולכן', { formula: goal, end: '.' }] : ['הוכחנו את שני הכיוונים, ולכן ה"אם ורק אם" נכון.']);
        },
    };

    // Using an "iff": both of its directions follow.
    Blockly.Blocks['iff_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('מ־')
                .appendField(new FieldAssumption(), 'IFF');
            appendPhrase(this);
            move(this, 'מ"P אם ורק אם Q" נקבל את הגרירות P → Q ו־Q → P. שתיהן מצטרפות להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const iff = this.getFieldValue('IFF');
            const sides = filled(iff) && splitConnective(iff, '↔');
            setPhrase(this, sides
                ? ['נקבל', { formula: `(${sides[0]}) → (${sides[1]})` }, 'וגם', { formula: `(${sides[1]}) → (${sides[0]})`, end: '.' }]
                : ['נקבל את שני הכיוונים שלו.']);
        },
    };
    // A statement and its negation, both in hand: a contradiction, which
    // closes the goal ⊥. Either of the two may be chosen; the block names the
    // other (see contradictionPartner).
    Blockly.Blocks['contradiction'] = {
        init() {
            this.appendDummyInput()
                .appendField('קיבלנו')
                .appendField(new FieldAssumption(), 'FACT');
            appendPhrase(this);
            move(this, 'טענה ושלילתה יחד הן סתירה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const fact = this.getFieldValue('FACT');
            setPhrase(this, filled(fact)
                ? ['וגם', { formula: contradictionPartner(fact, this.stateBefore?.assumptions), end: ',' }, 'בסתירה.']
                : ['וגם את השלילה שלה, בסתירה.']);
        },
    };

    // Negation introduction (¬I): to prove ¬A, assume A and reach a contradiction.
    Blockly.Blocks['not_intro'] = {
        init() {
            appendPhrase(this);
            wrap(this, 'כדי להוכיח ¬A מניחים בשלילה את A ומגיעים לסתירה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const denied = negatedStatement(goal);
            setPhrase(this, denied
                ? ['נניח בשלילה', { formula: denied, end: '.' }, 'עלינו להגיע לסתירה.']
                : ['נניח בשלילה את הטענה שהמטרה שוללת. עלינו להגיע לסתירה.']);
            setClose(this, denied ? ['קיבלנו סתירה, ולכן', { formula: goal, end: '.' }] : ['קיבלנו סתירה, ולכן השלילה נכונה.']);
        },
    };

    // Negation elimination (¬E), backward: with ¬A in hand, a contradiction
    // only needs A.
    Blockly.Blocks['not_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי')
                .appendField(new FieldAssumption(), 'NEGATION');
            appendPhrase(this);
            move(this, 'אם בידינו ¬A, כדי להגיע לסתירה די להוכיח את A.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const negation = this.getFieldValue('NEGATION');
            const denied = filled(negation) && negatedStatement(negation);
            setPhrase(this, denied
                ? ['כדי להגיע לסתירה די להוכיח', { formula: denied, end: '.' }]
                : ['כדי להגיע לסתירה די להוכיח את הטענה שהיא שוללת.']);
        },
    };

    // Ex falso: a contradiction implies anything, so any goal follows from ⊥.
    Blockly.Blocks['exfalso'] = {
        init() {
            appendPhrase(this);
            move(this, 'מסתירה נובעת כל טענה: כדי להוכיח כל מטרה, די להגיע לסתירה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            setPhrase(this, goal
                ? ['מסתירה נובע הכול: כדי להוכיח', { formula: goal }, 'די להגיע לסתירה.']
                : ['מסתירה נובע הכול: די להגיע לסתירה.']);
        },
    };

    // Proof by contradiction: assume the goal is false, reach a contradiction.
    Blockly.Blocks['by_contradiction'] = {
        init() {
            appendPhrase(this);
            wrap(this, 'כדי להוכיח P מניחים בשלילה ¬P ומגיעים לסתירה. מתאים לכל מטרה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            setPhrase(this, goal
                ? ['נניח בשלילה', { formula: negation(goal), end: '.' }, 'עלינו להגיע לסתירה.']
                : ['נניח בשלילה שהמטרה לא נכונה. עלינו להגיע לסתירה.']);
            setClose(this, goal ? ['קיבלנו סתירה, ולכן', { formula: goal, end: '.' }] : ['קיבלנו סתירה, ולכן המטרה נכונה.']);
        },
    };

    // ∀ elimination: from "for all x, P(x)", P(a) for an object a.
    Blockly.Blocks['forall_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('ב־')
                .appendField(new FieldAssumption(), 'FORALL')
                .appendField('נציב')
                .appendField(new Blockly.FieldLabel(''), 'VARIABLE')
                .appendField(new FieldAssumption({ objects: true }), 'TERM');
            appendPhrase(this);
            move(this, 'ב"לכל x מתקיים P(x)" מותר להציב כל עצם a במקום x, ונקבל P(a). התוצאה מצטרפת להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const forall = this.getFieldValue('FORALL');
            const term = this.getFieldValue('TERM');
            const quantified = filled(forall) && splitQuantifier(forall, '∀');
            // "נציב x = a", or, for the object of the variable's own name, "נציב את x".
            setLabel(this, 'VARIABLE', !quantified ? '' : term === quantified.variable ? 'את' : isolateFormulas(`${quantified.variable} =`));
            setPhrase(this, quantified && filled(term)
                ? ['ונקבל', { formula: substitute(quantified.body, quantified.variable, term), end: '.' }]
                : ['ונקבל מה שהוא אומר על העצם.']);
        },
    };

    // ∀ introduction: for an arbitrary object x, prove P(x).
    Blockly.Blocks['forall_intro'] = {
        init() {
            appendPhrase(this);
            wrap(this, 'כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם שרירותי, x₀, שלא ידוע עליו דבר, ומוכיחים P(x₀).');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const quantified = splitQuantifier(goal, '∀');
            if (!quantified) {
                setPhrase(this, ['יהי עצם שרירותי. עלינו להראות שהוא מקיים את התכונה.']);
                setClose(this, ['מאחר שהעצם שרירותי, הטענה נכונה לכל עצם.']);
                return;
            }
            const name = arbitraryObjectName(this, quantified.variable);
            setPhrase(this, ['יהי', { formula: name }, 'שרירותי. עלינו להראות', { formula: substitute(quantified.body, quantified.variable, name), end: '.' }]);
            setClose(this, ['מאחר ש־', { formula: name }, 'שרירותי,', { formula: goal, end: '.' }]);
        },
    };

    // ∃ introduction: choose a witness a, and prove P(a).
    Blockly.Blocks['exists_intro'] = {
        init() {
            appendPhrase(this).appendField(new FieldAssumption({ objects: true }), 'TERM');
            appendPhrase(this, this.appendDummyInput('AFTER'), 'AFTER');
            wrap(this, 'כדי להוכיח "קיים x כך ש־P(x)" בוחרים עצם מתאים a (עד), ומוכיחים P(a).');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const quantified = splitQuantifier(goal, '∃');
            const term = this.getFieldValue('TERM');
            setPhrase(this, !quantified ? ['נבחר את העצם'] : term === quantified.variable ? ['נבחר את'] : ['נבחר', { raw: `${quantified.variable} =` }]);
            setPhrase(this, quantified && filled(term)
                ? ['עלינו להראות', { formula: substitute(quantified.body, quantified.variable, term), end: '.' }]
                : ['עלינו להראות שהוא מתאים.'], 'AFTER');
            setClose(this, quantified ? ['לכן קיים', { formula: quantified.variable }, 'כזה:', { formula: goal, end: '.' }] : ['לכן קיים עצם כזה.']);
        },
    };

    // ∃ elimination: from "there exists x with P(x)", a new object x with P(x).
    Blockly.Blocks['exists_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי')
                .appendField(new FieldAssumption(), 'EXISTS');
            appendPhrase(this);
            move(this, 'מ"קיים x כך ש־P(x)" לוקחים עצם כזה ונותנים לו שם, x₀: עליו ידוע רק ש־P(x₀). את הערך שלו לא בוחרים.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const exists = this.getFieldValue('EXISTS');
            const quantified = filled(exists) && splitQuantifier(exists, '∃');
            if (!quantified) {
                setPhrase(this, ['ניתן שם לעצם כזה.']);
                return;
            }
            const name = arbitraryObjectName(this, quantified.variable);
            setPhrase(this, ['נסמן ב־', { formula: name }, 'עצם כזה, כלומר', { formula: substitute(quantified.body, quantified.variable, name), end: '.' }]);
        },
    };

    // Unit 7: the lecture's strategies that are derived rules.
    // Modus tollens: from an implication and the negation of its conclusion,
    // the negation of its condition ("כשיש ¬β, מקבלים ¬α").
    Blockly.Blocks['modus_tollens'] = {
        init() {
            this.appendDummyInput()
                .appendField('מ־')
                .appendField(new FieldAssumption(), 'RULE')
                .appendField('ומ־')
                .appendField(new FieldAssumption(), 'NEGATION');
            appendPhrase(this);
            move(this, 'מגרירה ומהשלילה של המסקנה שלה נקבל את השלילה של התנאי שלה, והיא מצטרפת להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const rule = this.getFieldValue('RULE');
            const parts = filled(rule) && splitImplication(rule);
            setPhrase(this, parts ? ['נקבל', { formula: negation(parts[0]), end: '.' }] : ['נקבל את השלילה של התנאי של הגרירה.']);
        },
    };

    // Proof by contraposition: to prove P → Q, assume ¬Q and prove ¬P.
    Blockly.Blocks['contrapositive'] = {
        init() {
            appendPhrase(this);
            wrap(this, 'כדי להוכיח P → Q מוכיחים את הקונטרפוזיציה שלה, ¬Q → ¬P: מניחים ¬Q ומוכיחים ¬P.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const parts = splitImplication(goal);
            if (parts && parts[1] !== 'False') {
                const [condition, conclusion] = parts;
                setPhrase(this, ['נוכיח את הקונטרפוזיציה: נניח', { formula: negation(conclusion), end: '.' }, 'עלינו להראות', { formula: negation(condition), end: '.' }]);
                setClose(this, ['הוכחנו', { formula: `(${negation(conclusion)}) → (${negation(condition)})`, end: ',' }, 'ולכן', { formula: goal, end: '.' }]);
            } else {
                setPhrase(this, ['נוכיח את הקונטרפוזיציה: נניח את השלילה של המסקנה. עלינו להראות את השלילה של התנאי.']);
                setClose(this, ['הוכחנו את הקונטרפוזיציה, ולכן הגרירה נכונה.']);
            }
        },
    };

    // Proving an "or" as the lecture does: assume the negation of one side,
    // and prove the other (¬α → β ≡ α ∨ β).
    Blockly.Blocks['or_by_negation'] = {
        init() {
            appendPhrase(this);
            wrap(this, 'כדי להוכיח P ∨ Q מניחים ¬P ומוכיחים Q.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const sides = splitConnective(goal, '∨');
            if (sides) {
                setPhrase(this, ['נניח', { formula: negation(sides[0]), end: '.' }, 'עלינו להראות', { formula: sides[1], end: '.' }]);
                setClose(this, ['הוכחנו', { formula: `(${negation(sides[0])}) → (${sides[1]})`, end: ',' }, 'ולכן', { formula: goal, end: '.' }]);
            } else {
                setPhrase(this, ['נניח את השלילה של הצד הראשון של ה"או". עלינו להראות את הצד השני.']);
                setClose(this, ['לכן ה"או" נכון.']);
            }
        },
    };

    // Cases by a statement and its negation: every statement is true or not
    // (α ∨ ¬α). The statement is chosen from the level's (level.claims).
    Blockly.Blocks['em_cases'] = {
        init() {
            const field = new FieldClaim();
            field.prompt = 'כתבו את הטענה שלפיה מחלקים למקרים';
            this.appendDummyInput()
                .appendField('נחלק למקרים:')
                .appendField(field, 'STATEMENT');
            appendPhrase(this);
            appendPart(this, 'LEFT');
            appendPart(this, 'RIGHT');
            closing(this, 'כל טענה נכונה או לא נכונה, ולכן אפשר לחלק למקרים: פעם היא נכונה, ופעם השלילה שלה נכונה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const statement = this.getFieldValue('STATEMENT');
            const goal = this.stateBefore?.goal;
            const chosen = filled(statement);
            setPhrase(this, chosen ? ['או', { formula: negation(statement) }] : ['או השלילה שלה']);
            setPartHeading(this, 'LEFT', chosen ? ['מקרה 1:', { formula: statement }] : ['מקרה 1: הטענה נכונה']);
            setPartHeading(this, 'RIGHT', chosen ? ['מקרה 2:', { formula: negation(statement) }] : ['מקרה 2: השלילה שלה נכונה']);
            setClose(this, goal ? ['המקרים מכסים את כל האפשרויות, ובשניהם', { formula: goal, end: '.' }] : ['המקרים מכסים את כל האפשרויות, ובשניהם המטרה נכונה.']);
        },
    };

    // ⊆ introduction: for an arbitrary element of the smaller set, prove it
    // belongs to the larger one.
    Blockly.Blocks['subset_intro'] = {
        init() {
            appendPhrase(this);
            move(this, 'כדי להוכיח A ⊆ B לוקחים איבר שרירותי x₀ של A, ומוכיחים ש־x₀ ∈ B.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const sets = splitRelation(goal, '⊆');
            if (!sets) {
                setPhrase(this, ['כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה']);
                return;
            }
            const element = elementName(this, sets[0], sets[1]);
            setPhrase(this, ['כדי להוכיח', { formula: goal }, 'יהי', { formula: `${element} ∈ ${sets[0]}` }, 'ונוכיח', { formula: `${element} ∈ ${sets[1]}` }]);
        },
    };

    // ⊆ elimination: from A ⊆ B and t ∈ A, t ∈ B.
    Blockly.Blocks['subset_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי ההכלה')
                .appendField(new FieldAssumption(), 'SUBSET')
                .appendField('ומ־')
                .appendField(new FieldAssumption(), 'MEMBER');
            appendPhrase(this);
            move(this, 'אם A ⊆ B ו־x₀ ∈ A, אז x₀ ∈ B. התוצאה מצטרפת להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const subset = this.getFieldValue('SUBSET');
            const member = this.getFieldValue('MEMBER');
            const sets = filled(subset) && splitRelation(subset, '⊆');
            const element = filled(member) && splitRelation(member, '∈');
            setPhrase(this, sets && element
                ? ['נובע', { formula: `${element[0]} ∈ ${sets[1]}` }]
                : ['נובע שהאיבר שייך לקבוצה המכילה']);
        },
    };

    // Set equality: two inclusions, each in a part of its own.
    Blockly.Blocks['set_eq'] = {
        init() {
            appendPhrase(this);
            appendPart(this, 'FIRST');
            appendPart(this, 'SECOND');
            move(this, 'שתי קבוצות שוות אם כל אחת מוכלת בשנייה: מוכיחים A ⊆ B וגם B ⊆ A.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const sets = splitRelation(goal, '=');
            setPhrase(this, sets ? ['כדי להוכיח', { formula: goal }, 'נוכיח שתי הכלות'] : ['כדי להוכיח שוויון קבוצות, נוכיח שתי הכלות']);
            setPartHeading(this, 'FIRST', sets ? ['נוכיח', { formula: `${sets[0]} ⊆ ${sets[1]}` }] : ['הכלה ראשונה (⊆):']);
            setPartHeading(this, 'SECOND', sets ? ['נוכיח', { formula: `${sets[1]} ⊆ ${sets[0]}` }] : ['הכלה שנייה (⊇):']);
        },
    };

    // A definition: membership in a set built by an operation means a formula.
    // On an assumption, the formula joins what is in hand; on the goal, it is
    // what remains to prove.
    Blockly.Blocks['unfold'] = {
        init() {
            appendPhrase(this, this.appendDummyInput('NAMEROW'), 'NAME')
                .appendField(new FieldAssumption({ withGoal: true, filter: (formula) => Boolean(unfoldMembership(formula)) }), 'STATEMENT');
            appendPhrase(this);
            move(this, 'לפי הגדרת הפעולה על קבוצות: למשל x₀ ∈ (A ∩ B) פירושו x₀ ∈ A ∧ x₀ ∈ B.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const statement = this.getFieldValue('STATEMENT');
            const definition = filled(statement) && unfoldMembership(statement);
            const onGoal = definition && isGoal(this, statement);
            setPhrase(this, [definition ? `לפי הגדרת ${definition.name},` : 'לפי ההגדרה,', ...(onGoal ? ['כדי להוכיח'] : [])], 'NAME');
            if (!definition) setPhrase(this, ['פירושו מה שההגדרה אומרת']);
            else if (onGoal) setPhrase(this, ['די להוכיח', { formula: definition.means }]);
            else setPhrase(this, ['פירושו', { formula: definition.means }]);
        },
    };

    // Unit 9. An equality whose two sides are the same by the definitions.
    Blockly.Blocks['rfl'] = {
        init() {
            this.appendDummyInput().appendField('שני הצדדים שווים לפי ההגדרה.');
            move(this, 'סוגר מטרה a = b כששני הצדדים שווים לפי ההגדרות, בלי חשבון.');
        },
    };

    // Unit 6. Replacing a statement by an equivalent one, by a law proved
    // before, in the goal or in a statement in hand (whose result joins it).
    Blockly.Blocks['replace'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי השקילות')
                .appendField(new FieldLaw(), 'LAW');
            this.appendDummyInput()
                .appendField('נחליף')
                .appendField(new FieldLawDirection(), 'DIRECTION');
            this.appendDummyInput()
                .appendField('בתוך')
                .appendField(new FieldAssumption({ goalOption: true }), 'TARGET');
            appendResult(this);
            move(this, 'מותר להחליף טענה בטענה ששקולה לה, גם בתוך טענה גדולה יותר: במטרה, או בטענה שבידינו, ואז התוצאה מצטרפת להנחות.');
            this.updateText();
        },
        ...followResult,
        updateText() {
            this.getField('DIRECTION')?.refreshText();
            setResult(this, this.getFieldValue('TARGET'));
        },
    };

    // Substituting equals for equals: by an equality in hand, in a chosen
    // direction, in the goal or in a statement in hand (whose result joins it).
    Blockly.Blocks['rewrite'] = {
        init() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldLabel('לפי השוויון'), 'BY')
                .appendField(new FieldAssumption({ filter: (formula) => Boolean(splitRelation(formula, '=')) }), 'EQUATION')
                .appendField('נחליף')
                .appendField(new FieldDirection(), 'DIRECTION');
            this.appendDummyInput()
                .appendField('בתוך')
                .appendField(new FieldAssumption({ goalOption: true }), 'TARGET');
            appendResult(this);
            move(this, 'אם a = b, אפשר להחליף את a ב־b, או את b ב־a, במטרה או בטענה שבידינו. בטענה שבידינו, התוצאה מצטרפת להנחות.');
            this.updateText();
        },
        ...followResult,
        updateText() {
            setLabel(this, 'BY', isInductionHypothesis(this, this.getFieldValue('EQUATION')) ? 'לפי הנחת האינדוקציה' : 'לפי השוויון');
            this.getField('DIRECTION')?.refreshText();
            setResult(this, this.getFieldValue('TARGET'));
        },
    };

    // An intermediate claim, as in a written proof ("נוכיח קודם ש..."): it is
    // proved in a part of its own, and after it, it is in hand.
    Blockly.Blocks['claim'] = {
        init() {
            this.appendDummyInput()
                .appendField('נוכיח קודם את טענת העזר')
                .appendField(new FieldClaim(), 'CLAIM');
            appendPart(this, 'PROOF');
            appendPhrase(this);
            move(this, 'טענת עזר: מוכיחים קודם טענה שתעזור בהמשך, ומעכשיו היא בידינו.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const claim = this.getFieldValue('CLAIM');
            setPartHeading(this, 'PROOF', filled(claim) ? ['נוכיח', { formula: claim }] : ['נוכיח אותה:']);
            setPhrase(this, filled(claim) ? ['ומעכשיו', { formula: claim }, 'בידינו'] : ['ומעכשיו היא בידינו']);
        },
    };

    // Induction (units 11 and 12): a part for each way the level's structure is
    // built, a basis for each one without parts like it, and a step, with an
    // induction hypothesis for each part like it, for each of the others.
    Blockly.Blocks['induction'] = {
        init() {
            this.appendDummyInput()
                .appendField('נוכיח באינדוקציה על')
                .appendField(new FieldAssumption({ objects: true }), 'VARIABLE');
            this.structure = levelStructure;
            STRUCTURES[this.structure].forEach((part) => appendHeadedPart(this, part.input, part.hypotheses('x').length));
            move(this, this.structure === 'Nat'
                ? 'כדי להוכיח טענה לכל מספר טבעי n: מוכיחים אותה עבור 0 (בסיס), ומוכיחים שאם היא נכונה עבור n אז היא נכונה עבור n + 1 (צעד).'
                : 'כדי להוכיח טענה על כל המבנים מסוג מסוים: מוכיחים אותה לכל דרך לבנות מבנה, בהנחה שהיא נכונה לחלקים שהוא בנוי מהם (הנחות האינדוקציה).');
            this.updateText();
        },
        ...followState,
        updateText() {
            const variable = this.getFieldValue('VARIABLE');
            const goal = this.stateBefore?.goal;
            STRUCTURES[this.structure].forEach((part) => {
                const label = part.hypotheses('x').length ? 'צעד:' : 'בסיס:';
                if (!filled(variable) || !goal) {
                    const name = TYPICAL_NAMES[this.structure];
                    const parts = part.hypotheses(name).map((inner) => shown(inner)).join(' ו־');
                    setPartHeadingLines(this, part.input, parts
                        ? [[`${label} נניח שהטענה נכונה עבור ${parts}`], [`ונוכיח אותה עבור ${shown(part.term(name))}`]]
                        : [[`${label} נוכיח את הטענה עבור ${shown(part.term(name))}`]]);
                    return;
                }
                // A line for each hypothesis, then what is proved.
                const hypotheses = part.hypotheses(variable).map((name, index) => [index ? 'ו־' : `${label} נניח`, { formula: substitute(goal, variable, name) }]);
                const proved = { formula: substitute(goal, variable, part.term(variable)) };
                setPartHeadingLines(this, part.input, hypotheses.length ? [...hypotheses, ['ונוכיח', proved]] : [[`${label} נוכיח`, proved]]);
            });
        },
    };

    // Unfolding a definition, in a chosen part of the goal or of a statement in
    // hand (whose result joins it).
    Blockly.Blocks['unfold_function'] = {
        init() {
            this.appendDummyInput()
                .appendField('נשתמש בהגדרת')
                .appendField(new FieldFunction(), 'FUNCTION')
                .appendField('כדי לשכתב את')
                .appendField(new FieldPart(), 'PART');
            this.appendDummyInput()
                .appendField('בתוך')
                .appendField(new FieldAssumption({ goalOption: true }), 'TARGET');
            appendResult(this);
            move(this, 'משכתב לפי ההגדרה של הפונקציה חלק שהיא מופעלת בו, במטרה או בטענה שבידינו: למשל double(n + 1) הופך ל־double(n) + 2, ו־leaves(node(l,r)) הופך ל־leaves(l) + leaves(r).');
            this.updateText();
        },
        ...followResult,
        // The parts the chosen definition applies to in the chosen place.
        unfoldableParts() {
            const value = this.getFieldValue('FUNCTION');
            const target = this.getFieldValue('TARGET');
            const statement = !target || target === GOAL ? this.stateBefore?.goal : target;
            return filled(value) && statement ? unfoldableParts(value, statement) : [];
        },
        updateText() {
            this.getField('PART')?.refreshText();
            setResult(this, this.getFieldValue('TARGET'));
        },
    };

    // Arithmetic and algebra close a goal that follows from them; they do not
    // unfold definitions. Each comes in two moves, so that using what is in
    // hand is never hidden: from the goal alone (after an explicit
    // substitution by an induction hypothesis, say), or, when the block says
    // so, with the assumptions in hand (an inequality cannot be substituted).
    Blockly.Blocks['calc'] = {
        init() {
            this.appendDummyInput().appendField('נכונות המטרה נובעת מחשבון פשוט.');
            move(this, 'סוגר מטרה של חשבון פשוט (חיבור, כפל במספר, אי־שוויונות), מהמטרה לבדה, בלי מה שבידינו. לא פותח הגדרות.');
        },
    };

    Blockly.Blocks['calc_hyps'] = {
        init() {
            appendFromChosen(this, 'נכונות המטרה נובעת מחשבון פשוט');
            move(this, 'סוגר מטרה של חשבון פשוט (חיבור, כפל במספר, אי־שוויונות) בעזרת ההנחות שבוחרים בו, אחת או יותר, למשל אי־שוויון שאי אפשר להחליף לפיו. לא פותח הגדרות.');
        },
        ...followState,
        ...moreFieldsState,
        updateText() {
            keepOneMoreField(this);
            setLabel(this, 'FROM', fromChosen(this));
        },
    };

    Blockly.Blocks['algebra'] = {
        init() {
            this.appendDummyInput().appendField('נכונות המטרה נובעת מאלגברה.');
            move(this, 'סוגר מטרה של אלגברה (פתיחת סוגריים, כינוס איברים), מהמטרה לבדה, בלי מה שבידינו. לא פותח הגדרות.');
        },
    };

    Blockly.Blocks['algebra_hyps'] = {
        init() {
            appendFromChosen(this, 'נכונות המטרה נובעת מאלגברה');
            move(this, 'סוגר מטרה של אלגברה (פתיחת סוגריים, כינוס איברים) בעזרת ההנחות שבוחרים בו, אחת או יותר. לא פותח הגדרות.');
        },
        ...followState,
        ...moreFieldsState,
        updateText() {
            keepOneMoreField(this);
            setLabel(this, 'FROM', fromChosen(this));
        },
    };
};

// Lean finds each assumption by its statement: ‹P› is the assumption saying P,
// and closing finds one saying the goal. Either fails as `assumption` when no
// assumption in hand says it.
leanGenerator.forBlock['exact'] = () => '  assumption\n';

// Refuses a negation, which has its own move (see LEAN_PRELUDE).
leanGenerator.forBlock['assume'] = () => '  easylean_assume\n';

// A negation ¬A is A → ⊥ in Lean, but it is used with its own moves
// (contradiction, not_elim), as in the textbooks; so the moves of an
// implication refuse it, naming it for the explanation (moveExplanations.js).
const refuseNegation = (rule, direction) => `(first | fail_if_success have : ¬ _ := ‹${rule}› | fail "easylean: ${direction} by a negation: ${rule.replace(/["\\]/g, '')}"); `;

leanGenerator.forBlock['apply_rule'] = (block) => {
    const rule = block.getFieldValue('RULE');
    return `  ${refuseNegation(rule, 'backward')}refine easylean_mp ‹${rule}› ?_\n`;
};

leanGenerator.forBlock['forward'] = (block) => {
    const rule = block.getFieldValue('RULE');
    return `  ${refuseNegation(rule, 'forward')}have := easylean_mp ‹${rule}› ‹${block.getFieldValue('PREMISE')}›\n`;
};

// Unit 3. Each move is the specific rule, so that it fails on a goal or an
// assumption of the wrong kind; the parts of a move that splits the proof are
// opened by leanBranches.
leanGenerator.forBlock['and_elim'] = (block) => {
    const and = block.getFieldValue('AND');
    return `  have := And.left ‹${and}›\n  have := And.right ‹${and}›\n`;
};

leanGenerator.forBlock['and_intro'] = () => '  apply And.intro\n';

leanGenerator.forBlock['and_combine'] = (block) =>
    `  have := And.intro ‹${block.getFieldValue('LEFT')}› ‹${block.getFieldValue('RIGHT')}›\n`;

// An unchosen side leaves the goal as it is (the move is reported as incomplete).
leanGenerator.forBlock['or_intro'] = (block) => ({ LEFT: '  apply Or.inl\n', RIGHT: '  apply Or.inr\n' })[block.getFieldValue('SIDE')] || '  skip\n';

leanGenerator.forBlock['or_elim'] = (block) => `  cases ‹${block.getFieldValue('OR')}› with\n`;

leanGenerator.forBlock['iff_intro'] = () => '  apply Iff.intro\n';

leanGenerator.forBlock['iff_elim'] = (block) => {
    const iff = block.getFieldValue('IFF');
    return `  have := Iff.mp ‹${iff}›\n  have := Iff.mpr ‹${iff}›\n`;
};

// Unit 4. A contradiction is stated as False, so that it only closes the
// goal ⊥ (see the explanations in leanErrors.js).
// A negation ¬Q contradicts ¬¬Q or Q: Lean tries both, Q last, so that when
// neither is in hand it explains that Q is not.
leanGenerator.forBlock['contradiction'] = (block) => {
    const fact = block.getFieldValue('FACT');
    const withNegation = `exact (absurd ‹${fact}› ‹¬(${fact})› : False)`;
    const denied = negatedStatement(fact);
    if (!denied) return `  ${withNegation}\n`;
    return `  first\n  | ${withNegation}\n  | exact (absurd ‹${denied}› ‹${fact}› : False)\n`;
};

leanGenerator.forBlock['not_intro'] = () => '  refine Not.intro (fun _ => ?_)\n';

leanGenerator.forBlock['not_elim'] = (block) => `  refine (absurd ?_ ‹${block.getFieldValue('NEGATION')}› : False)\n`;

leanGenerator.forBlock['exfalso'] = () => '  apply False.elim\n';

leanGenerator.forBlock['by_contradiction'] = () => '  apply Classical.byContradiction\n  intro _\n';

// Unit 5. The rules of LEAN_PRELUDE (easylean_forall_…) and Exists.…, which
// the explanations in leanErrors.js know; a new object is named by arbitraryObjectName.
leanGenerator.forBlock['forall_elim'] = (block) =>
    `  have := easylean_forall_elim ‹${block.getFieldValue('FORALL')}› (${block.getFieldValue('TERM')})\n`;

leanGenerator.forBlock['forall_intro'] = (block) => {
    const quantified = splitQuantifier(block.stateBefore?.goal, '∀');
    return `  refine easylean_forall_intro (fun ${quantified ? arbitraryObjectName(block, quantified.variable) : 'x₀'} => ?_)\n`;
};

leanGenerator.forBlock['exists_intro'] = (block) => `  apply Exists.intro (${block.getFieldValue('TERM')})\n`;

leanGenerator.forBlock['exists_elim'] = (block) => {
    const exists = block.getFieldValue('EXISTS');
    const quantified = splitQuantifier(exists, '∃');
    return `  refine Exists.elim ‹${exists}› (fun ${quantified ? arbitraryObjectName(block, quantified.variable) : 'x₀'} _ => ?_)\n`;
};

// Unit 7. The derived rules of STRATEGY_PRELUDE; a negation is refused as
// an implication, as in the forward and backward moves.
leanGenerator.forBlock['modus_tollens'] = (block) => {
    const rule = block.getFieldValue('RULE');
    return `  ${refuseNegation(rule, 'forward')}have := easylean_mt ‹${rule}› ‹${block.getFieldValue('NEGATION')}›\n`;
};

leanGenerator.forBlock['contrapositive'] = () => '  (first | fail_if_success show ¬ _ | fail "easylean: the goal is a negation"); refine easylean_by_contrapositive (fun _ => ?_)\n';

leanGenerator.forBlock['or_by_negation'] = () => '  refine easylean_or_by_negation (fun _ => ?_)\n';

leanGenerator.forBlock['em_cases'] = (block) => `  cases Classical.em (${block.getFieldValue('STATEMENT')}) with\n`;

// Units 8-10. The rules and definitions of SET_PRELUDE.
leanGenerator.forBlock['subset_intro'] = (block) => {
    const sets = splitRelation(block.stateBefore?.goal, '⊆');
    // Before the state is known, the element is named as it will be: x.
    const element = sets ? elementName(block, sets[0], sets[1]) : newObjectName(block, 'x');
    // An element of a relation is a pair, taken apart: (x₀, y₀). Lean tries
    // that first, so that the move is right also before its state is known
    // (when the sets are not relations, it does not apply).
    const x = element.startsWith('(') ? element.slice(1, -1).split(', ')[0] : newObjectName(block, 'x');
    const y = element.startsWith('(') ? element.slice(1, -1).split(', ')[1] : freshName('y', [...thingsInHand(block), x]);
    const single = element.startsWith('(') ? x : element;
    return `  first\n  | refine easylean_subset_intro_pair (fun ${x} ${y} _ => ?_)\n  | refine easylean_subset_intro (fun ${single} _ => ?_)\n`;
};

leanGenerator.forBlock['subset_elim'] = (block) =>
    `  have := easylean_subset_elim ‹${block.getFieldValue('SUBSET')}› ‹${block.getFieldValue('MEMBER')}›\n`;

leanGenerator.forBlock['set_eq'] = () => '  apply easylean_set_eq\n';

// A definition used on the goal is proved from its meaning; on an assumption,
// its meaning follows from it. Lean tries the goal first, if it is written
// exactly as that statement (=ₛ: a statement with the same meaning, such as
// x ∈ A \\ B for the goal x ∈ A ∩ Bᶜ, is not the goal), so the code does not
// wait for the proof state; when neither fits, it explains that no
// assumption says the statement.
leanGenerator.forBlock['unfold'] = (block) => {
    const statement = block.getFieldValue('STATEMENT');
    const definition = unfoldMembership(statement);
    if (!definition) return `  have := ‹${statement}›\n`;
    // A composition of functions (not of relations, unit 9) is written
    // applied, g (f x), as the block writes it (and as `Function.comp` means).
    const applied = statement.includes('∘') && block.stateBefore?.functions?.length ? '; try simp only [Function.comp_apply]' : '';
    return `  first\n  | (guard_target =ₛ ${statement}; apply ${definition.lemma}.mpr${applied})\n  | (have := ${definition.lemma}.mp ‹${statement}›${applied ? `${applied} at this` : ''})\n`;
};

// Unit 6. `rewrite` replaces the first part of the form of the law's side;
// inside a quantifier, which `rewrite` cannot reach, `simp only` does (and it
// replaces all of them; in the levels there is one). A law about a
// quantifier is restated, for this move only, with the formula's bound
// variable, so that the result keeps its names.
leanGenerator.forBlock['replace'] = (block) => {
    const law = lawOf(block.getFieldValue('LAW'));
    if (!law) return '  skip\n';
    const backward = block.getFieldValue('DIRECTION') === 'BACKWARD';
    const target = block.getFieldValue('TARGET');
    const onGoal = target === GOAL;
    const text = onGoal ? block.stateBefore?.goal || '' : target;
    const copy = onGoal ? '' : `have := ‹${target}›; `;
    const at = onGoal ? '' : ' at this';
    let name = law.value;
    let restated = '';
    let cleanup = '';
    if (law.statement) {
        const variable = text.match(law.variable[backward ? 1 : 0])?.[1] || 'x';
        restated = `have easylean_law : ∀ (α : Type) (p : α → Prop), ${law.statement(variable)} := fun _ _ => ${law.value}; `;
        name = 'easylean_law';
        cleanup = '; clear easylean_law';
    }
    const rule = `${backward ? '← ' : ''}${name}`;
    const side = backward ? law.right : law.left;
    return `  ${copy}${restated}(first | rewrite (occs := .pos [1]) [${rule}]${at} | simp only [${rule}]${at} | fail "easylean: no part of the form ${side}")${cleanup}\n`;
};

// Unit 9. `rewrite`, not `rw`, which would also try to close the goal; in a
// statement in hand, a copy of it is rewritten.
leanGenerator.forBlock['rfl'] = () => '  rfl\n';

leanGenerator.forBlock['rewrite'] = (block) => {
    const arrow = block.getFieldValue('DIRECTION') === 'BACKWARD' ? '← ' : '';
    const equation = `${arrow}‹${block.getFieldValue('EQUATION')}›`;
    const target = block.getFieldValue('TARGET');
    return target === GOAL
        ? `  rewrite [${equation}]\n`
        : `  have := ‹${target}›\n  rewrite [${equation}] at this\n`;
};

leanGenerator.forBlock['induction'] = (block) => `  induction ${block.getFieldValue('VARIABLE')} with\n`;

// The claim is proved in its part (see leanBranches), and then it is in hand.
leanGenerator.forBlock['claim'] = (block) => (filled(block.getFieldValue('CLAIM')) ? '' : '  skip\n');

// In a statement in hand, on a copy of it, as `rewrite` (unit 9) does. Lean
// unfolds the chosen part in an equation of its own (easylean_eq), whose right
// side it finds, and replaces the part by it. A part without variables is the
// base case of its definition, which `rewrite` tries first (and the equation
// could not tell its types), so it is unfolded directly; so is the first part,
// until one is chosen (the proof state is not known yet).
leanGenerator.forBlock['unfold_function'] = (block) => {
    const value = block.getFieldValue('FUNCTION');
    const lemmas = functionOf(value)?.[2];
    if (!lemmas) return '  skip\n';
    const target = block.getFieldValue('TARGET');
    const onGoal = !target || target === GOAL;
    const at = onGoal ? '' : ' at this';
    const copy = onGoal ? '' : `  have := ‹${target}›\n`;
    const unfold = (where) => (lemmas.length === 1 ? `rewrite [${lemmas[0]}]${where}` : `first ${lemmas.map((lemma) => `| rewrite [${lemma}]${where}`).join(' ')}`);
    const part = block.getFieldValue('PART');
    if (!filled(part) || hasNoVariables(part)) return `${copy}  ${unfold(at)}\n`;
    return `${copy}  have easylean_eq : ${part} = _ := (by (${unfold('')}); rfl)\n  rewrite [easylean_eq]${at}; clear easylean_eq\n`;
};

// From the goal alone, with its own message when that is not enough (see leanErrors.js).
leanGenerator.forBlock['calc'] = () => '  easylean_goal_only; first | omega | fail "easylean: arithmetic from the goal alone"\n';

// With the chosen assumptions only: copied, moved into the goal while the
// assumptions in hand are dropped (easylean_goal_only), and brought back.
const withChosen = (block) => {
    const names = chosenFacts(block).map((fact, index) => [`easylean_fact${index + 1}`, fact]);
    if (!names.length) return 'easylean_goal_only; ';
    return `${names.map(([name, fact]) => `have ${name} := ‹${fact}›; `).join('')}revert ${names.map(([name]) => name).join(' ')}; easylean_goal_only; intros; `;
};
leanGenerator.forBlock['calc_hyps'] = (block) => `  ${withChosen(block)}first | omega | fail "easylean: arithmetic from the chosen assumptions"\n`;

leanGenerator.forBlock['algebra'] = () => '  easylean_goal_only; first | grind | fail "easylean: algebra from the goal alone"\n';

leanGenerator.forBlock['algebra_hyps'] = (block) => `  ${withChosen(block)}first | grind | fail "easylean: algebra from the chosen assumptions"\n`;

// The new assumption of each case has no name (_), and Lean finds it by its statement.
Object.assign(leanBranches, {
    // A case for each way the structure is built (see STRUCTURES).
    induction: (block) => {
        const variable = block.getFieldValue('VARIABLE');
        return STRUCTURES[block.structure || 'Nat'].map((part) => ({
            input: part.input,
            header: `| ${[part.ctor, ...part.args(variable), ...part.hypotheses(variable).map(() => '_')].join(' ')} =>`,
        }));
    },
    set_eq: () => [{ input: 'FIRST', header: '·' }, { input: 'SECOND', header: '·' }],
    // The moves that open a structure: what is inside them (see wrap).
    ...Object.fromEntries(['assume', 'or_intro', 'not_intro', 'by_contradiction', 'forall_intro', 'exists_intro', 'contrapositive', 'or_by_negation']
        .map((type) => [type, () => [{ input: 'BODY', header: '·' }]])),
    and_intro: () => [{ input: 'LEFT', header: '·' }, { input: 'RIGHT', header: '·' }],
    iff_intro: () => [{ input: 'FORWARD', header: '·' }, { input: 'BACKWARD', header: '·' }],
    or_elim: () => [{ input: 'LEFT', header: '| inl _ =>' }, { input: 'RIGHT', header: '| inr _ =>' }],
    em_cases: () => [{ input: 'LEFT', header: '| inl _ =>' }, { input: 'RIGHT', header: '| inr _ =>' }],
    claim: (block) => {
        const claim = block.getFieldValue('CLAIM');
        return filled(claim) ? [{ input: 'PROOF', header: `have : ${claim} := by` }] : [];
    },
});
