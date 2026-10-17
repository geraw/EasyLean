import * as Blockly from 'blockly/core';
import { leanBranches, leanGenerator } from '../generator/lean';
import { PLACEHOLDER } from '../blocks/gameBlocks';
import { formatProofGoal, freshName, negatedStatement, splitConnective, splitImplication, splitQuantifier, splitRelation, substitute, unfoldMembership } from '../game/formatProofGoal';
import { isolateFormulas, isolateHebrew } from '../game/bidi';

// The moves of the course: they read like a proof written by hand ("נניח P
// ונוכיח Q"), and assumptions have no names. A move points to
// an assumption by what it says, chosen from the assumptions in hand or typed
// in; Lean finds the assumption by its statement (‹P›).

const WRITE_OWN = '__write_own__';
const WRITE_OWN_LABEL = '✎ כתיבה ידנית...';

// A formula as students see it: fully parenthesized, in left-to-right order.
const shown = (formula) => isolateFormulas(formatProofGoal(formula));

// What a student typed, in Lean's notation (the contradiction ⊥ is False).
const normalizeTyped = (text) => text.trim().replace(/->/g, '→').replace(/⊥/g, 'False').replace(/\s+/g, ' ');

// The statement of an assumption: a menu of the assumptions in hand before the
// move (block.stateBefore, from Lean), and a last item for typing one in.
// With objects, the same for an object of the domain or a set, by its name.
// For a statement that may also be the goal (withGoal), the goal is offered
// first; only the statements that pass the filter are offered. A field for
// where something happens (goalOption) offers "the goal" itself, first.
const GOAL = '__goal__';
const GOAL_LABEL = 'המטרה';
const optionLabel = (value) => (value === PLACEHOLDER ? PLACEHOLDER : value === GOAL ? GOAL_LABEL : shown(value));

class FieldAssumption extends Blockly.FieldDropdown {
    constructor({ objects = false, withGoal = false, goalOption = false, filter = () => true } = {}) {
        super(function () {
            const state = this.getSourceBlock()?.stateBefore;
            const inHand = objects
                ? [...(state?.objects || []), ...(state?.sets || [])]
                : [...new Set([...(goalOption ? [GOAL] : []), ...(withGoal && state?.goal ? [state.goal] : []), ...(state?.assumptions || [])])].filter((value) => value === GOAL || filter(value));
            const options = inHand.map((value) => [optionLabel(value), value]);
            // A new field starts as the first option: the placeholder (or the goal).
            const current = this.getValue() || (goalOption ? GOAL : PLACEHOLDER);
            if (!inHand.includes(current)) options.unshift([optionLabel(current), current]);
            return [...options, [WRITE_OWN_LABEL, WRITE_OWN]];
        });
        this.prompt = objects ? 'כתבו עצם, למשל a או n + 1' : 'כתבו את הטענה של ההנחה, למשל P → Q';
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

// Unit 5. The laws of logical equivalence, each proved in both directions in
// earlier levels, as students read them (with schematic letters A, B, as the
// moves of unit 3 do) and as Lean's lemmas (EQUIV_PRELUDE). A law about a
// quantifier is restated with the bound variable of the formula it is used in
// (see variable), so that a substitution keeps the formula's names. Double
// negation is used only to remove one: backward, its side A fits any statement.
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

// Unit 5. The laws of logical equivalence, each proved in both directions in
// earlier levels, as students read them (with schematic letters A, B, as the
// moves of unit 3 do), as Lean's lemmas (EQUIV_PRELUDE), and as the forms of
// their two sides, to show what a replacement replaces. A law about a
// quantifier is restated with the bound variable of the formula it is used in
// (see variable), so that a substitution keeps the formula's names. Double
// negation is used only to remove one: backward, its side A fits any statement.
export const LAWS = [
    { value: 'easylean_not_not', left: '¬¬A', right: 'A', backward: false, sides: [negatedTwice, any] },
    { value: 'easylean_not_or', left: '¬(A ∨ B)', right: '(¬A ∧ ¬B)', sides: [negated('∨'), both('∧', true, true)] },
    { value: 'easylean_not_and', left: '¬(A ∧ B)', right: '(¬A ∨ ¬B)', sides: [negated('∧'), both('∨', true, true)] },
    { value: 'easylean_imp_or', left: '(A → B)', right: '(¬A ∨ B)', sides: [both('→', false, false), both('∨', true, false)] },
    // Replacing every implication by its contrapositive would never end.
    { value: 'easylean_contrapositive', left: '(A → B)', right: '(¬B → ¬A)', sides: [both('→', false, false), contraposed], all: false },
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
            // The first part of that form, or, when there are several, all of them.
            const options = (backward) => {
                const instances = lawInstances(law, backward, formula);
                const [from, to] = instances.length ? instances[0].map(shown) : sides(backward);
                const direction = backward ? 'BACKWARD' : 'FORWARD';
                const first = [isolateHebrew(`את ${from} ב־${to}`), direction];
                if (instances.length < 2 || law.all === false) return [first];
                const [form, replacement] = sides(backward);
                return [first, [isolateHebrew(`את כל הביטויים מהצורה ${form} ב־${replacement}`), `${direction}_ALL`]];
            };
            return law.backward === false ? options(false) : [...options(false), ...options(true)];
        });
    }

    doClassValidation_(value) {
        return ['FORWARD', 'BACKWARD', 'FORWARD_ALL', 'BACKWARD_ALL'].includes(value) ? value : null;
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

// The structures that induction is on, each by the ways it is built (units 8
// and 9): a part of the proof for each, headed by what is proved in it. A
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
const TYPICAL_NAMES = { Nat: 'n', List: 'l', Tree: 't', Formula: 'φ', Formula5: 'φ' };
STRUCTURES.Formula5 = formulaCases(['conj', 'disj', 'imp']);

// The structure the level's induction is on (level.structure), set when the
// level is loaded: the induction move's parts are its cases.
let levelStructure = 'Nat';
export const setLevelStructure = (structure = 'Nat') => { levelStructure = STRUCTURES[structure] ? structure : 'Nat'; };

// The functions defined by recursion, and the definitions of addition and
// power (units 8 and 9): their names, the structure they are defined on, and
// the equations that unfold them (the first that applies).
const FUNCTIONS = [
    ['double', 'double', ['double'], 'Nat'],
    ['sumTo', 'sumTo', ['sumTo'], 'Nat'],
    ['oddSum', 'oddSum', ['oddSum'], 'Nat'],
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
];
const functionOf = (value) => FUNCTIONS.find(([, candidate]) => candidate === value);
const structureFunctions = () => FUNCTIONS.filter(([, , , structure]) => structure === levelStructure.replace(/5$/, ''));

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
// firing events: it is not a change the student made.
const setPhrase = (block, parts, prefix = 'PHRASE') => {
    Blockly.Events.disable();
    try {
        for (let index = 0; index < PHRASE_LENGTH; index += 1) {
            const field = block.getField(`${prefix}${index}`);
            if (!field) return;
            const part = parts[index];
            const text = part === undefined ? '' : typeof part === 'string' ? part : shown(part.formula);
            if (field.getValue() !== text) field.setValue(text);
            if (field.isVisible() !== Boolean(text)) field.setVisible(Boolean(text));
        }
    } finally {
        Blockly.Events.enable();
    }
    if (block.rendered) block.queueRender?.();
};

const setPartHeading = (block, name, parts) => setPhrase(block, parts, `${name}_TEXT`);

// The sentence as students read it, or a part's heading (for tests).
export const phraseOf = (block, prefix = 'PHRASE') => Array.from({ length: PHRASE_LENGTH }, (_, index) => block.getFieldValue(`${prefix}${index}`))
    .filter(Boolean).join(' ').replace(/[\u2066\u2069]/g, '');

const filled = (value) => value && value !== PLACEHOLDER;

const negation = (formula) => `¬(${formula})`;

// The element taken to prove an inclusion: a set when the sets are of sets
// (a power set), otherwise an object.
const elementName = (block, smaller) => newObjectName(block, smaller.startsWith('𝒫') ? 'X' : 'x');

// The name of a new object (∀ introduction, ∃ elimination): the quantified
// variable's with a subscript, x₀ (see freshName).
const newObjectName = (block, variable) => freshName(variable, [...(block.stateBefore?.objects || []), ...(block.stateBefore?.sets || [])]);

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

export const defineMoveBlocks = () => {
    // Closing the goal: something in hand says exactly the goal. Lean looks
    // for it among everything in hand, so the student does not point to it.
    Blockly.Blocks['exact'] = {
        init() {
            this.appendDummyInput().appendField('יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח.');
            move(this, 'כאשר אחת ההנחות אומרת בדיוק את מה שרוצים להוכיח, ההוכחה הושלמה.');
        },
    };

    // Proving an implication: assume its condition, prove its conclusion.
    Blockly.Blocks['assume'] = {
        init() {
            appendPhrase(this);
            move(this, 'כדי להוכיח גרירה, מניחים את התנאי שלה ומוכיחים את המסקנה שלה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const parts = splitImplication(goal);
            if (parts && parts[1] !== 'False') setPhrase(this, ['כדי להוכיח את הגרירה, נניח', { formula: parts[0] }, 'ונוכיח', { formula: parts[1] }]);
            else setPhrase(this, ['כדי להוכיח את הגרירה, נניח את התנאי שלה ונוכיח את המסקנה שלה']);
        },
    };

    // Using an implication backward: its conclusion is the goal, so it is
    // enough to prove its condition.
    Blockly.Blocks['apply_rule'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי הגרירה')
                .appendField(new FieldAssumption(), 'RULE')
                .appendField('שיש לנו ביד,');
            appendPhrase(this);
            move(this, 'אם המסקנה של גרירה שבידינו היא מה שצריך להוכיח, די להוכיח את התנאי שלה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const rule = this.getFieldValue('RULE');
            const parts = filled(rule) && splitImplication(rule);
            if (!parts) setPhrase(this, ['כדי להוכיח את המסקנה שלה, די להוכיח את התנאי שלה']);
            else setPhrase(this, ['כדי להוכיח', { formula: parts[1] }, 'די להוכיח', { formula: parts[0] }]);
        },
    };

    // Using an implication forward: from it and its condition, its conclusion.
    Blockly.Blocks['forward'] = {
        init() {
            this.appendDummyInput()
                .appendField('מהגרירה')
                .appendField(new FieldAssumption(), 'RULE')
                .appendField('ומ־')
                .appendField(new FieldAssumption(), 'PREMISE');
            appendPhrase(this);
            move(this, 'מגרירה ומהתנאי שלה נובעת המסקנה שלה, והיא מצטרפת להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const rule = this.getFieldValue('RULE');
            const parts = filled(rule) && splitImplication(rule);
            setPhrase(this, parts ? ['נובע', { formula: parts[1] }] : ['נובעת המסקנה של הגרירה']);
        },
    };

    // Using an "and": both of its sides follow.
    Blockly.Blocks['and_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('מה"וגם"')
                .appendField(new FieldAssumption(), 'AND');
            appendPhrase(this);
            move(this, 'מ"P וגם Q" נובע P, ונובע גם Q. שניהם מצטרפים להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const and = this.getFieldValue('AND');
            const sides = filled(and) && splitConnective(and, '∧');
            setPhrase(this, sides
                ? ['נובע', { formula: sides[0] }, 'ונובע', { formula: sides[1] }]
                : ['נובעים שני הצדדים שלו']);
        },
    };

    // Proving an "and": each side in a part of its own.
    Blockly.Blocks['and_intro'] = {
        init() {
            appendPhrase(this);
            appendPart(this, 'LEFT');
            appendPart(this, 'RIGHT');
            move(this, 'כדי להוכיח "P וגם Q" מוכיחים את P ומוכיחים את Q, כל אחד לחוד.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const sides = splitConnective(this.stateBefore?.goal, '∧');
            setPhrase(this, sides
                ? ['כדי להוכיח', { formula: this.stateBefore.goal }, 'נוכיח כל צד לחוד']
                : ['כדי להוכיח את ה"וגם", נוכיח כל צד לחוד']);
            setPartHeading(this, 'LEFT', sides ? ['נוכיח', { formula: sides[0] }] : ['צד שמאל:']);
            setPartHeading(this, 'RIGHT', sides ? ['נוכיח', { formula: sides[1] }] : ['צד ימין:']);
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
            move(this, 'מ־P ומ־Q נובע "P וגם Q", והוא מצטרף להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const left = this.getFieldValue('LEFT');
            const right = this.getFieldValue('RIGHT');
            setPhrase(this, filled(left) && filled(right)
                ? ['נובע', { formula: `(${left}) ∧ (${right})` }]
                : ['נובע ה"וגם" של שתיהן']);
        },
    };

    // Proving an "or" by one of its sides, chosen by what it says.
    Blockly.Blocks['or_intro'] = {
        init() {
            appendPhrase(this).appendField(new FieldSide(), 'SIDE');
            move(this, 'כדי להוכיח "P או Q" די להוכיח את אחד הצדדים: את זה שאפשר להוכיח ממה שבידינו.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            setPhrase(this, splitConnective(goal, '∨')
                ? ['כדי להוכיח', { formula: goal }, 'די להוכיח']
                : ['כדי להוכיח את ה"או" די להוכיח את']);
            this.getField('SIDE')?.refreshText();
        },
    };

    // Using an "or": the goal is proved in each of its cases.
    Blockly.Blocks['or_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('נחלק למקרים לפי ה"או"')
                .appendField(new FieldAssumption(), 'OR');
            appendPart(this, 'LEFT');
            appendPart(this, 'RIGHT');
            move(this, 'אם ידוע "P או Q", מוכיחים את המטרה פעם אחת בהנחה P ופעם אחת בהנחה Q.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const or = this.getFieldValue('OR');
            const sides = filled(or) && splitConnective(or, '∨');
            setPartHeading(this, 'LEFT', sides ? ['מקרה ראשון: נניח', { formula: sides[0] }] : ['מקרה ראשון: צד שמאל נכון']);
            setPartHeading(this, 'RIGHT', sides ? ['מקרה שני: נניח', { formula: sides[1] }] : ['מקרה שני: צד ימין נכון']);
        },
    };

    // Proving an "iff": each direction in a part of its own.
    Blockly.Blocks['iff_intro'] = {
        init() {
            appendPhrase(this);
            appendPart(this, 'FORWARD');
            appendPart(this, 'BACKWARD');
            move(this, 'כדי להוכיח "P אם ורק אם Q" מוכיחים את P → Q ואת Q → P, כל אחת לחוד.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const sides = splitConnective(this.stateBefore?.goal, '↔');
            setPhrase(this, sides
                ? ['כדי להוכיח', { formula: this.stateBefore.goal }, 'נוכיח את שני הכיוונים']
                : ['כדי להוכיח את ה"אם ורק אם", נוכיח את שני הכיוונים']);
            setPartHeading(this, 'FORWARD', sides ? ['נוכיח', { formula: `(${sides[0]}) → (${sides[1]})` }] : ['כיוון ראשון (→):']);
            setPartHeading(this, 'BACKWARD', sides ? ['נוכיח', { formula: `(${sides[1]}) → (${sides[0]})` }] : ['כיוון שני (←):']);
        },
    };

    // Using an "iff": both of its directions follow.
    Blockly.Blocks['iff_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('מה"אם ורק אם"')
                .appendField(new FieldAssumption(), 'IFF');
            appendPhrase(this);
            move(this, 'מ"P אם ורק אם Q" נובעות הגרירות P → Q ו־Q → P. שתיהן מצטרפות להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const iff = this.getFieldValue('IFF');
            const sides = filled(iff) && splitConnective(iff, '↔');
            setPhrase(this, sides
                ? ['נובע', { formula: `(${sides[0]}) → (${sides[1]})` }, 'ונובע', { formula: `(${sides[1]}) → (${sides[0]})` }]
                : ['נובעים שני הכיוונים שלו']);
        },
    };
    // A statement and its negation, both in hand: a contradiction, which
    // closes the goal ⊥. Either of the two may be chosen; the block names the
    // other (see contradictionPartner).
    Blockly.Blocks['contradiction'] = {
        init() {
            this.appendDummyInput()
                .appendField('יש לנו ביד את')
                .appendField(new FieldAssumption(), 'FACT');
            appendPhrase(this);
            move(this, 'טענה ושלילתה יחד הן סתירה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const fact = this.getFieldValue('FACT');
            setPhrase(this, filled(fact)
                ? ['ואת', { formula: contradictionPartner(fact, this.stateBefore?.assumptions) }, 'וזו סתירה.']
                : ['ואת השלילה שלה, וזו סתירה.']);
        },
    };

    // Negation introduction (¬I): to prove ¬A, assume A and reach a contradiction.
    Blockly.Blocks['not_intro'] = {
        init() {
            appendPhrase(this);
            move(this, 'כדי להוכיח ¬A מניחים A ומגיעים לסתירה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const denied = negatedStatement(goal);
            setPhrase(this, denied
                ? ['כדי להוכיח', { formula: goal }, 'נניח', { formula: denied }, 'ונגיע לסתירה']
                : ['כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה']);
        },
    };

    // Negation elimination (¬E), backward: with ¬A in hand, a contradiction
    // only needs A.
    Blockly.Blocks['not_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי השלילה')
                .appendField(new FieldAssumption(), 'NEGATION')
                .appendField('שיש לנו ביד,');
            appendPhrase(this);
            move(this, 'אם בידינו ¬A, כדי להגיע לסתירה די להוכיח את A.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const negation = this.getFieldValue('NEGATION');
            const denied = filled(negation) && negatedStatement(negation);
            setPhrase(this, denied
                ? ['כדי להגיע לסתירה די להוכיח', { formula: denied }]
                : ['כדי להגיע לסתירה די להוכיח את הטענה שהיא שוללת']);
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
                ? ['מסתירה נובע הכול, ולכן כדי להוכיח', { formula: goal }, 'די להגיע לסתירה']
                : ['מסתירה נובע הכול, ולכן די להגיע לסתירה']);
        },
    };

    // Proof by contradiction: assume the goal is false, reach a contradiction.
    Blockly.Blocks['by_contradiction'] = {
        init() {
            appendPhrase(this);
            move(this, 'כדי להוכיח P מניחים ¬P ומגיעים לסתירה. מתאים לכל מטרה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            setPhrase(this, goal
                ? ['נוכיח בשלילה: נניח', { formula: negation(goal) }, 'ונגיע לסתירה']
                : ['נוכיח בשלילה: נניח שהמטרה לא נכונה ונגיע לסתירה']);
        },
    };

    // ∀ elimination: from "for all x, P(x)", P(a) for an object a.
    Blockly.Blocks['forall_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי ה"לכל"')
                .appendField(new FieldAssumption(), 'FORALL')
                .appendField('עבור העצם')
                .appendField(new FieldAssumption({ objects: true }), 'TERM');
            appendPhrase(this);
            move(this, 'מ"לכל x מתקיים P(x)" נובע P(a) לכל עצם a: מציבים את a במקום x. התוצאה מצטרפת להנחות.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const forall = this.getFieldValue('FORALL');
            const term = this.getFieldValue('TERM');
            const quantified = filled(forall) && splitQuantifier(forall, '∀');
            setPhrase(this, quantified && filled(term)
                ? ['נובע', { formula: substitute(quantified.body, quantified.variable, term) }]
                : ['נובע מה שהוא אומר על העצם']);
        },
    };

    // ∀ introduction: for an arbitrary object x, prove P(x).
    Blockly.Blocks['forall_intro'] = {
        init() {
            appendPhrase(this);
            move(this, 'כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם שרירותי x, שלא ידוע עליו דבר, ומוכיחים P(x).');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const quantified = splitQuantifier(goal, '∀');
            if (!quantified) {
                setPhrase(this, ['כדי להוכיח "לכל": יהי עצם שרירותי, ונוכיח שהוא מקיים את התכונה']);
                return;
            }
            const name = newObjectName(this, quantified.variable);
            setPhrase(this, ['כדי להוכיח', { formula: goal }, 'יהי', { formula: name }, 'עצם שרירותי, ונוכיח', { formula: substitute(quantified.body, quantified.variable, name) }]);
        },
    };

    // ∃ introduction: choose a witness a, and prove P(a).
    Blockly.Blocks['exists_intro'] = {
        init() {
            appendPhrase(this).appendField(new FieldAssumption({ objects: true }), 'TERM');
            appendPhrase(this, this.appendDummyInput('AFTER'), 'AFTER');
            move(this, 'כדי להוכיח "קיים x כך ש־P(x)" בוחרים עצם מתאים a (עד), ומוכיחים P(a).');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const quantified = splitQuantifier(goal, '∃');
            const term = this.getFieldValue('TERM');
            setPhrase(this, quantified ? ['כדי להוכיח', { formula: goal }, 'נבחר את העצם'] : ['כדי להוכיח "קיים" נבחר את העצם']);
            setPhrase(this, quantified && filled(term)
                ? ['ונוכיח', { formula: substitute(quantified.body, quantified.variable, term) }]
                : ['ונוכיח שהוא מתאים'], 'AFTER');
        },
    };

    // ∃ elimination: from "there exists x with P(x)", a new object x with P(x).
    Blockly.Blocks['exists_elim'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי ה"קיים"')
                .appendField(new FieldAssumption(), 'EXISTS');
            appendPhrase(this);
            move(this, 'מ"קיים x כך ש־P(x)" מקבלים עצם חדש x, שעליו ידוע רק ש־P(x). העצם וההנחה מצטרפים למה שיש בידינו.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const exists = this.getFieldValue('EXISTS');
            const quantified = filled(exists) && splitQuantifier(exists, '∃');
            if (!quantified) {
                setPhrase(this, ['יהי עצם חדש שמקיים אותו']);
                return;
            }
            const name = newObjectName(this, quantified.variable);
            setPhrase(this, ['יהי', { formula: name }, 'עצם כך ש־', { formula: substitute(quantified.body, quantified.variable, name) }]);
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
            const element = elementName(this, sets[0]);
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
            move(this, 'לפי הגדרת הפעולה על קבוצות: למשל x₀ ∈ A ∩ B פירושו x₀ ∈ A ∧ x₀ ∈ B.');
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

    // Unit 8. An equality whose two sides are the same by the definitions.
    Blockly.Blocks['rfl'] = {
        init() {
            this.appendDummyInput().appendField('שני הצדדים שווים לפי ההגדרה.');
            move(this, 'סוגר מטרה a = b כששני הצדדים שווים לפי ההגדרות, בלי חשבון.');
        },
    };

    // Unit 5. Replacing a statement by an equivalent one, by a law proved
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
            move(this, 'מותר להחליף טענה בטענה ששקולה לה, גם בתוך טענה גדולה יותר: במטרה, או בטענה שבידינו, ואז התוצאה מצטרפת להנחות.');
        },
        ...followState,
        updateText() {
            this.getField('DIRECTION')?.refreshText();
        },
    };

    // Substituting equals for equals: by an equality in hand, in a chosen
    // direction, in the goal or in a statement in hand (whose result joins it).
    Blockly.Blocks['rewrite'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי השוויון')
                .appendField(new FieldAssumption({ filter: (formula) => Boolean(splitRelation(formula, '=')) }), 'EQUATION')
                .appendField('נחליף')
                .appendField(new FieldDirection(), 'DIRECTION');
            this.appendDummyInput()
                .appendField('בתוך')
                .appendField(new FieldAssumption({ goalOption: true }), 'TARGET');
            move(this, 'אם a = b, אפשר להחליף את a ב־b, או את b ב־a, במטרה או בטענה שבידינו. בטענה שבידינו, התוצאה מצטרפת להנחות.');
        },
        ...followState,
        updateText() {
            this.getField('DIRECTION')?.refreshText();
        },
    };

    // Induction on a natural number: the base 0, and the step from n to n + 1,
    // each in a part headed by what is proved in it.
    // Induction (units 8 and 9): a part for each way the level's structure is
    // built, a basis for each one without parts like it, and a step, with an
    // induction hypothesis for each part like it, for each of the others.
    Blockly.Blocks['induction'] = {
        init() {
            this.appendDummyInput()
                .appendField('נוכיח באינדוקציה על')
                .appendField(new FieldAssumption({ objects: true }), 'VARIABLE');
            this.structure = levelStructure;
            STRUCTURES[this.structure].forEach(({ input }) => appendPart(this, input));
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
                    setPartHeading(this, part.input, [parts
                        ? `${label} נניח שהטענה נכונה עבור ${parts} ונוכיח אותה עבור ${shown(part.term(name))}`
                        : `${label} נוכיח את הטענה עבור ${shown(part.term(name))}`]);
                    return;
                }
                const hypotheses = part.hypotheses(variable).flatMap((name, index) => [...(index ? ['ו־'] : []), { formula: substitute(goal, variable, name) }]);
                const proved = { formula: substitute(goal, variable, part.term(variable)) };
                setPartHeading(this, part.input, hypotheses.length ? [`${label} נניח`, ...hypotheses, 'ונוכיח', proved] : [`${label} נוכיח`, proved]);
            });
        },
    };

    // Unfolding a definition in the goal.
    Blockly.Blocks['unfold_function'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי הגדרת')
                .appendField(new FieldFunction(), 'FUNCTION')
                .appendField('נפתח את המטרה');
            move(this, 'פותח במטרה את ההגדרה של הפונקציה: למשל double(n + 1) הופך ל־double(n) + 2, ו־leaves(node(l,r)) הופך ל־leaves(l) + leaves(r).');
        },
    };

    // Arithmetic and algebra close a goal that follows from them (and the
    // assumptions); they do not unfold definitions.
    Blockly.Blocks['calc'] = {
        init() {
            this.appendDummyInput().appendField('המטרה נובעת מחשבון פשוט.');
            move(this, 'סוגר מטרה של חשבון פשוט (חיבור, כפל במספר, אי־שוויונות), גם בעזרת מה שבידינו. לא פותח הגדרות.');
        },
    };

    Blockly.Blocks['algebra'] = {
        init() {
            this.appendDummyInput().appendField('המטרה נובעת לפי אלגברה.');
            move(this, 'סוגר מטרה של אלגברה (פתיחת סוגריים, כינוס איברים), גם בעזרת מה שבידינו. לא פותח הגדרות.');
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

// Unit 2. Each move is the specific rule, so that it fails on a goal or an
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

// Unit 3. A contradiction is stated as False, so that it only closes the
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

// Unit 4. The rules of LEAN_PRELUDE (easylean_forall_…) and Exists.…, which
// the explanations in leanErrors.js know; a new object is named by newObjectName.
leanGenerator.forBlock['forall_elim'] = (block) =>
    `  have := easylean_forall_elim ‹${block.getFieldValue('FORALL')}› (${block.getFieldValue('TERM')})\n`;

leanGenerator.forBlock['forall_intro'] = (block) => {
    const quantified = splitQuantifier(block.stateBefore?.goal, '∀');
    return `  refine easylean_forall_intro (fun ${quantified ? newObjectName(block, quantified.variable) : 'x₀'} => ?_)\n`;
};

leanGenerator.forBlock['exists_intro'] = (block) => `  apply Exists.intro (${block.getFieldValue('TERM')})\n`;

leanGenerator.forBlock['exists_elim'] = (block) => {
    const exists = block.getFieldValue('EXISTS');
    const quantified = splitQuantifier(exists, '∃');
    return `  refine Exists.elim ‹${exists}› (fun ${quantified ? newObjectName(block, quantified.variable) : 'x₀'} _ => ?_)\n`;
};

// Units 6 and 7. The rules and definitions of SET_PRELUDE.
leanGenerator.forBlock['subset_intro'] = (block) => {
    const sets = splitRelation(block.stateBefore?.goal, '⊆');
    return `  refine easylean_subset_intro (fun ${sets ? elementName(block, sets[0]) : 'x₀'} _ => ?_)\n`;
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
    return `  first\n  | (guard_target =ₛ ${statement}; apply ${definition.lemma}.mpr)\n  | have := ${definition.lemma}.mp ‹${statement}›\n`;
};

// Unit 5. `rewrite` replaces the first part of the form of the law's side;
// inside a quantifier, which `rewrite` cannot reach, `simp only` does, and it
// replaces all of them, as it does when all are chosen. A law about a
// quantifier is restated, for this move only, with the formula's bound
// variable, so that the result keeps its names.
leanGenerator.forBlock['replace'] = (block) => {
    const law = lawOf(block.getFieldValue('LAW'));
    if (!law) return '  skip\n';
    const direction = block.getFieldValue('DIRECTION');
    const backward = direction.startsWith('BACKWARD');
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
    const first = direction.endsWith('_ALL') ? '' : `rewrite (occs := .pos [1]) [${rule}]${at} | `;
    return `  ${copy}${restated}(first | ${first}simp only [${rule}]${at} | fail "easylean: no part of the form ${side}")${cleanup}\n`;
};

// Unit 8. `rewrite`, not `rw`, which would also try to close the goal; in a
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

leanGenerator.forBlock['unfold_function'] = (block) => {
    const lemmas = functionOf(block.getFieldValue('FUNCTION'))?.[2];
    if (!lemmas) return '  skip\n';
    return lemmas.length === 1 ? `  rewrite [${lemmas[0]}]\n` : `  first ${lemmas.map((lemma) => `| rewrite [${lemma}]`).join(' ')}\n`;
};

leanGenerator.forBlock['calc'] = () => '  omega\n';

leanGenerator.forBlock['algebra'] = () => '  grind\n';

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
    and_intro: () => [{ input: 'LEFT', header: '·' }, { input: 'RIGHT', header: '·' }],
    iff_intro: () => [{ input: 'FORWARD', header: '·' }, { input: 'BACKWARD', header: '·' }],
    or_elim: () => [{ input: 'LEFT', header: '| inl _ =>' }, { input: 'RIGHT', header: '| inr _ =>' }],
});
