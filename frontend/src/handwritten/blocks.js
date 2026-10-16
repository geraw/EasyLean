import * as Blockly from 'blockly/core';
import { leanBranches, leanGenerator } from '../generator/lean';
import { PLACEHOLDER } from '../blocks/gameBlocks';
import { formatProofGoal, freshName, negatedStatement, splitConnective, splitImplication, splitQuantifier, substitute } from '../game/formatProofGoal';
import { isolateFormulas } from '../game/bidi';

// The handwritten version of the course: moves read like a proof written by
// hand ("נניח P ונוכיח Q"), and assumptions have no names. A move points to
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
// With objects, the same for an object of the domain, by its name.
class FieldAssumption extends Blockly.FieldDropdown {
    constructor({ objects = false } = {}) {
        super(function () {
            const inHand = this.getSourceBlock()?.stateBefore?.[objects ? 'objects' : 'assumptions'] || [];
            const options = inHand.map((formula) => [shown(formula), formula]);
            // A new field starts as the first option: the placeholder.
            const current = this.getValue() || PLACEHOLDER;
            if (!inHand.includes(current)) options.unshift([current === PLACEHOLDER ? PLACEHOLDER : shown(current), current]);
            return [...options, [WRITE_OWN_LABEL, WRITE_OWN]];
        });
        this.prompt = objects ? 'כתבו שם של עצם, למשל a' : 'כתבו את הטענה של ההנחה, למשל P → Q';
    }

    // Any statement is a value: Lean checks that it is an assumption in hand.
    doClassValidation_(value) {
        if (value === WRITE_OWN) {
            // After the menu closes, ask for the statement.
            setTimeout(() => Blockly.dialog.prompt(isolateFormulas(this.prompt), this.getValue() === PLACEHOLDER ? '' : this.getValue(), (typed) => {
                if (typed && normalizeTyped(typed)) this.setValue(normalizeTyped(typed));
            }));
            return null;
        }
        return typeof value === 'string' && value.trim() ? value : null;
    }

    doValueUpdate_(value) {
        super.doValueUpdate_(value);
        this.selectedOption = [value === PLACEHOLDER ? PLACEHOLDER : shown(value), value];
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
// P → ⊥, as in the course (unit 3).
const asImplication = (formula) => {
    const denied = negatedStatement(formula);
    return splitImplication(formula) || (denied ? [denied, 'False'] : null);
};

const negation = (formula) => `¬(${formula})`;

// The name of a new object (∀ introduction, ∃ elimination): the quantified
// variable's with a subscript, x₀ (see freshName).
const newObjectName = (block, variable) => freshName(variable, block.stateBefore?.objects || []);

const sameStatement = (a, b) => formatProofGoal(a) === formatProofGoal(b);

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

export const defineHandwrittenBlocks = () => {
    // Closing the goal: something in hand says exactly the goal. Lean looks
    // for it among everything in hand, so the student does not point to it.
    Blockly.Blocks['hw_exact'] = {
        init() {
            this.appendDummyInput().appendField('יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח.');
            move(this, 'כאשר אחת ההנחות אומרת בדיוק את מה שרוצים להוכיח, ההוכחה הושלמה.');
        },
    };

    // Proving an implication: assume its condition, prove its conclusion.
    Blockly.Blocks['hw_assume'] = {
        init() {
            appendPhrase(this);
            move(this, 'כדי להוכיח גרירה, מניחים את התנאי שלה ומוכיחים את המסקנה שלה. כך מוכיחים גם שלילה ¬P, שהיא הגרירה P → ⊥.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const goal = this.stateBefore?.goal;
            const parts = splitImplication(goal);
            // ¬P is P → ⊥, so a negation is proved the same way.
            const denied = negatedStatement(goal);
            if (parts) setPhrase(this, ['כדי להוכיח את הגרירה, נניח', { formula: parts[0] }, 'ונוכיח', { formula: parts[1] }]);
            else if (denied) setPhrase(this, ['כדי להוכיח', { formula: goal }, 'נניח', { formula: denied }, 'ונגיע לסתירה']);
            else setPhrase(this, ['כדי להוכיח את הגרירה, נניח את התנאי שלה ונוכיח את המסקנה שלה']);
        },
    };

    // Using an implication backward: its conclusion is the goal, so it is
    // enough to prove its condition.
    Blockly.Blocks['hw_apply_rule'] = {
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
    Blockly.Blocks['hw_forward'] = {
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
    Blockly.Blocks['hw_and_elim'] = {
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
    Blockly.Blocks['hw_and_intro'] = {
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
    Blockly.Blocks['hw_and_combine'] = {
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
    Blockly.Blocks['hw_or_intro'] = {
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
    Blockly.Blocks['hw_or_elim'] = {
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
    Blockly.Blocks['hw_iff_intro'] = {
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
    Blockly.Blocks['hw_iff_elim'] = {
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
    Blockly.Blocks['hw_contradiction'] = {
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
    Blockly.Blocks['hw_not_intro'] = {
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
    Blockly.Blocks['hw_not_elim'] = {
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
    Blockly.Blocks['hw_exfalso'] = {
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
    Blockly.Blocks['hw_by_contradiction'] = {
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
    Blockly.Blocks['hw_forall_elim'] = {
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
    Blockly.Blocks['hw_forall_intro'] = {
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
    Blockly.Blocks['hw_exists_intro'] = {
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
    Blockly.Blocks['hw_exists_elim'] = {
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
};

// Lean finds each assumption by its statement: ‹P› is the assumption saying P,
// and closing finds one saying the goal. Either fails as `assumption` when no
// assumption in hand says it.
leanGenerator.forBlock['hw_exact'] = () => '  assumption\n';

leanGenerator.forBlock['hw_assume'] = () => '  refine easylean_imp_intro (fun _ => ?_)\n';

leanGenerator.forBlock['hw_apply_rule'] = (block) => `  refine easylean_mp ‹${block.getFieldValue('RULE')}› ?_\n`;

leanGenerator.forBlock['hw_forward'] = (block) =>
    `  have := easylean_mp ‹${block.getFieldValue('RULE')}› ‹${block.getFieldValue('PREMISE')}›\n`;

// Unit 2. As in the course, each move is the specific rule, so that it fails
// on a goal or an assumption of the wrong kind; the parts of a move that
// splits the proof are opened as in the course (leanBranches).
leanGenerator.forBlock['hw_and_elim'] = (block) => {
    const and = block.getFieldValue('AND');
    return `  have := And.left ‹${and}›\n  have := And.right ‹${and}›\n`;
};

leanGenerator.forBlock['hw_and_intro'] = () => '  apply And.intro\n';

leanGenerator.forBlock['hw_and_combine'] = (block) =>
    `  have := And.intro ‹${block.getFieldValue('LEFT')}› ‹${block.getFieldValue('RIGHT')}›\n`;

// An unchosen side leaves the goal as it is (the move is reported as incomplete).
leanGenerator.forBlock['hw_or_intro'] = (block) => ({ LEFT: '  apply Or.inl\n', RIGHT: '  apply Or.inr\n' })[block.getFieldValue('SIDE')] || '  skip\n';

leanGenerator.forBlock['hw_or_elim'] = (block) => `  cases ‹${block.getFieldValue('OR')}› with\n`;

leanGenerator.forBlock['hw_iff_intro'] = () => '  apply Iff.intro\n';

leanGenerator.forBlock['hw_iff_elim'] = (block) => {
    const iff = block.getFieldValue('IFF');
    return `  have := Iff.mp ‹${iff}›\n  have := Iff.mpr ‹${iff}›\n`;
};

// Unit 3. As in the course, a contradiction is stated as False, so that it
// only closes the goal ⊥; the course's explanations of these rules apply.
// A negation ¬Q contradicts ¬¬Q or Q: Lean tries both, Q last, so that when
// neither is in hand it explains that Q is not.
leanGenerator.forBlock['hw_contradiction'] = (block) => {
    const fact = block.getFieldValue('FACT');
    const withNegation = `exact (absurd ‹${fact}› ‹¬(${fact})› : False)`;
    const denied = negatedStatement(fact);
    if (!denied) return `  ${withNegation}\n`;
    return `  first\n  | ${withNegation}\n  | exact (absurd ‹${denied}› ‹${fact}› : False)\n`;
};

leanGenerator.forBlock['hw_not_intro'] = () => '  refine Not.intro (fun _ => ?_)\n';

leanGenerator.forBlock['hw_not_elim'] = (block) => `  refine (absurd ?_ ‹${block.getFieldValue('NEGATION')}› : False)\n`;

leanGenerator.forBlock['hw_exfalso'] = () => '  apply False.elim\n';

leanGenerator.forBlock['hw_by_contradiction'] = () => '  apply Classical.byContradiction\n  intro _\n';

// Unit 4. The rules are the course's (easylean_forall_…, Exists.…), so that
// its explanations apply; a new object is named by newObjectName.
leanGenerator.forBlock['hw_forall_elim'] = (block) =>
    `  have := easylean_forall_elim ‹${block.getFieldValue('FORALL')}› (${block.getFieldValue('TERM')})\n`;

leanGenerator.forBlock['hw_forall_intro'] = (block) => {
    const quantified = splitQuantifier(block.stateBefore?.goal, '∀');
    return `  refine easylean_forall_intro (fun ${quantified ? newObjectName(block, quantified.variable) : 'x₀'} => ?_)\n`;
};

leanGenerator.forBlock['hw_exists_intro'] = (block) => `  apply Exists.intro (${block.getFieldValue('TERM')})\n`;

leanGenerator.forBlock['hw_exists_elim'] = (block) => {
    const exists = block.getFieldValue('EXISTS');
    const quantified = splitQuantifier(exists, '∃');
    return `  refine Exists.elim ‹${exists}› (fun ${quantified ? newObjectName(block, quantified.variable) : 'x₀'} _ => ?_)\n`;
};

// The new assumption of each case has no name (_), and Lean finds it by its statement.
Object.assign(leanBranches, {
    hw_and_intro: () => [{ input: 'LEFT', header: '·' }, { input: 'RIGHT', header: '·' }],
    hw_iff_intro: () => [{ input: 'FORWARD', header: '·' }, { input: 'BACKWARD', header: '·' }],
    hw_or_elim: () => [{ input: 'LEFT', header: '| inl _ =>' }, { input: 'RIGHT', header: '| inr _ =>' }],
});
