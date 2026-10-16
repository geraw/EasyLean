import * as Blockly from 'blockly/core';
import { leanBranches, leanGenerator } from '../generator/lean';
import { PLACEHOLDER } from '../blocks/gameBlocks';
import { formatProofGoal, freshName, negatedStatement, splitConnective, splitImplication, splitQuantifier, splitRelation, substitute, unfoldMembership } from '../game/formatProofGoal';
import { isolateFormulas } from '../game/bidi';

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
                ? [[`את ${shown(sides[0])} ב־${shown(sides[1])}`, 'FORWARD'], [`את ${shown(sides[1])} ב־${shown(sides[0])}`, 'BACKWARD']]
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

// The functions of unit 7 defined by recursion, and the definitions of
// addition and power: their names, and the equation that unfolds them.
const FUNCTIONS = [
    ['double', 'double', 'double'],
    ['sumTo', 'sumTo', 'sumTo'],
    ['oddSum', 'oddSum', 'oddSum'],
    ['החיבור', 'add', 'easylean_add_succ'],
    ['החזקה', 'pow', 'Nat.pow_succ'],
];

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

// An implication's condition and conclusion; a negation ¬P is the implication
// P → ⊥ (as Lean defines it).
const asImplication = (formula) => {
    const denied = negatedStatement(formula);
    return splitImplication(formula) || (denied ? [denied, 'False'] : null);
};

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
            const parts = filled(rule) && asImplication(rule);
            if (!parts) setPhrase(this, ['כדי להוכיח את המסקנה שלה, די להוכיח את התנאי שלה']);
            else if (parts[1] === 'False') setPhrase(this, ['כדי להגיע לסתירה די להוכיח', { formula: parts[0] }]);
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
            const parts = filled(rule) && asImplication(rule);
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

    // Unit 7. An equality whose two sides are the same by the definitions.
    Blockly.Blocks['rfl'] = {
        init() {
            this.appendDummyInput().appendField('שני הצדדים שווים לפי ההגדרה.');
            move(this, 'סוגר מטרה a = b כששני הצדדים שווים לפי ההגדרות, בלי חשבון.');
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
    Blockly.Blocks['induction'] = {
        init() {
            this.appendDummyInput()
                .appendField('נוכיח באינדוקציה על')
                .appendField(new FieldAssumption({ objects: true }), 'VARIABLE');
            appendPart(this, 'BASE');
            appendPart(this, 'STEP');
            move(this, 'כדי להוכיח טענה לכל מספר טבעי n: מוכיחים אותה עבור 0 (בסיס), ומוכיחים שאם היא נכונה עבור n אז היא נכונה עבור n + 1 (צעד).');
            this.updateText();
        },
        ...followState,
        updateText() {
            const variable = this.getFieldValue('VARIABLE');
            const goal = this.stateBefore?.goal;
            if (!filled(variable) || !goal) {
                setPartHeading(this, 'BASE', ['בסיס: נוכיח את הטענה עבור 0']);
                setPartHeading(this, 'STEP', ['צעד: נניח שהטענה נכונה עבור n ונוכיח אותה עבור n + 1']);
                return;
            }
            setPartHeading(this, 'BASE', ['בסיס: נוכיח', { formula: substitute(goal, variable, '0') }]);
            setPartHeading(this, 'STEP', ['צעד: נניח', { formula: goal }, 'ונוכיח', { formula: substitute(goal, variable, `${variable} + 1`) }]);
        },
    };

    // Unfolding a definition in the goal.
    Blockly.Blocks['unfold_function'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי הגדרת')
                .appendField(new Blockly.FieldDropdown([[PLACEHOLDER, PLACEHOLDER], ...FUNCTIONS.map(([name, value]) => [name, value])]), 'FUNCTION')
                .appendField('נפתח את המטרה');
            move(this, 'פותח במטרה את ההגדרה של הפונקציה: למשל double(n + 1) הופך ל־double(n) + 2.');
        },
    };

    // Arithmetic and algebra close a goal that follows from them (and the
    // assumptions); they do not unfold definitions.
    Blockly.Blocks['calc'] = {
        init() {
            this.appendDummyInput().appendField('המטרה נובעת לפי חשבון.');
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

leanGenerator.forBlock['apply_rule'] = (block) => `  refine easylean_mp ‹${block.getFieldValue('RULE')}› ?_\n`;

leanGenerator.forBlock['forward'] = (block) =>
    `  have := easylean_mp ‹${block.getFieldValue('RULE')}› ‹${block.getFieldValue('PREMISE')}›\n`;

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

// Units 5 and 6. The rules and definitions of SET_PRELUDE.
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

// Unit 7. `rewrite`, not `rw`, which would also try to close the goal; in a
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
    const lemma = FUNCTIONS.find(([, value]) => value === block.getFieldValue('FUNCTION'))?.[2];
    return lemma ? `  rewrite [${lemma}]\n` : '  skip\n';
};

leanGenerator.forBlock['calc'] = () => '  omega\n';

leanGenerator.forBlock['algebra'] = () => '  grind\n';

// The new assumption of each case has no name (_), and Lean finds it by its statement.
Object.assign(leanBranches, {
    // The step keeps the variable's name: "assume it for n, prove it for n + 1".
    induction: (block) => [
        { input: 'BASE', header: '| zero =>' },
        { input: 'STEP', header: `| succ ${block.getFieldValue('VARIABLE')} _ =>` },
    ],
    set_eq: () => [{ input: 'FIRST', header: '·' }, { input: 'SECOND', header: '·' }],
    and_intro: () => [{ input: 'LEFT', header: '·' }, { input: 'RIGHT', header: '·' }],
    iff_intro: () => [{ input: 'FORWARD', header: '·' }, { input: 'BACKWARD', header: '·' }],
    or_elim: () => [{ input: 'LEFT', header: '| inl _ =>' }, { input: 'RIGHT', header: '| inr _ =>' }],
});
