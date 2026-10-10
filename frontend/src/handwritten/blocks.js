import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { PLACEHOLDER } from '../blocks/gameBlocks';
import { formatProofGoal, splitImplication } from '../game/formatProofGoal';
import { isolateFormulas } from '../game/bidi';

// The handwritten version of the course: moves read like a proof written by
// hand ("נניח P ונוכיח Q"), and assumptions have no names. A move points to
// an assumption by what it says, chosen from the assumptions in hand or typed
// in; Lean finds the assumption by its statement (‹P›).

const WRITE_OWN = '__write_own__';
const WRITE_OWN_LABEL = '✎ כתיבה ידנית...';

// A formula as students see it: fully parenthesized, in left-to-right order.
const shown = (formula) => isolateFormulas(formatProofGoal(formula));

// What a student typed, in the course's notation.
const normalizeTyped = (text) => text.trim().replace(/->/g, '→').replace(/\s+/g, ' ');

// The statement of an assumption: a menu of the assumptions in hand before the
// move (block.stateBefore, from Lean), and a last item for typing one in.
class FieldAssumption extends Blockly.FieldDropdown {
    constructor() {
        super(function () {
            const inHand = this.getSourceBlock()?.stateBefore?.assumptions || [];
            const options = inHand.map((formula) => [shown(formula), formula]);
            // A new field starts as the first option: the placeholder.
            const current = this.getValue() || PLACEHOLDER;
            if (!inHand.includes(current)) options.unshift([current === PLACEHOLDER ? PLACEHOLDER : shown(current), current]);
            return [...options, [WRITE_OWN_LABEL, WRITE_OWN]];
        });
    }

    // Any statement is a value: Lean checks that it is an assumption in hand.
    doClassValidation_(value) {
        if (value === WRITE_OWN) {
            // After the menu closes, ask for the statement.
            setTimeout(() => Blockly.dialog.prompt(isolateFormulas('כתבו את הטענה של ההנחה, למשל P → Q'), this.getValue() === PLACEHOLDER ? '' : this.getValue(), (typed) => {
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

const MOVE_COLOUR = 160;

const move = (block, tooltip) => {
    block.setPreviousStatement(true, 'tactic');
    block.setNextStatement(true, 'tactic');
    block.setColour(MOVE_COLOUR);
    block.setTooltip(tooltip);
};

// A sentence that follows the proof state and the fields, as a row of labels:
// Hebrew and formulas in separate labels, since one label mixing them is
// drawn left to right. Unused labels are hidden.
const PHRASE_LENGTH = 4;

const appendPhrase = (block) => {
    const input = block.appendDummyInput('PHRASE');
    for (let index = 0; index < PHRASE_LENGTH; index += 1) input.appendField(new Blockly.FieldLabel(''), `PHRASE${index}`);
};

// Sets the sentence, given as Hebrew strings and { formula } parts, without
// firing events: it is not a change the student made.
const setPhrase = (block, parts) => {
    Blockly.Events.disable();
    try {
        for (let index = 0; index < PHRASE_LENGTH; index += 1) {
            const field = block.getField(`PHRASE${index}`);
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

// The sentence as students read it (for tests).
export const phraseOf = (block) => Array.from({ length: PHRASE_LENGTH }, (_, index) => block.getFieldValue(`PHRASE${index}`))
    .filter(Boolean).join(' ').replace(/[\u2066\u2069]/g, '');

const filled = (value) => value && value !== PLACEHOLDER;

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
            move(this, 'כדי להוכיח גרירה, מניחים את התנאי שלה ומוכיחים את המסקנה שלה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const parts = splitImplication(this.stateBefore?.goal);
            setPhrase(this, parts
                ? ['כדי להוכיח את הגרירה, נניח', { formula: parts[0] }, 'ונוכיח', { formula: parts[1] }]
                : ['כדי להוכיח את הגרירה, נניח את התנאי שלה ונוכיח את המסקנה שלה']);
        },
    };

    // Using an implication backward: its conclusion is the goal, so it is
    // enough to prove its condition.
    Blockly.Blocks['hw_apply_rule'] = {
        init() {
            this.appendDummyInput()
                .appendField('לפי הגרירה')
                .appendField(new FieldAssumption(), 'RULE')
                .appendField('שהנחנו,');
            appendPhrase(this);
            move(this, 'אם המסקנה של גרירה שבידינו היא מה שצריך להוכיח, די להוכיח את התנאי שלה.');
            this.updateText();
        },
        ...followState,
        updateText() {
            const rule = this.getFieldValue('RULE');
            const parts = filled(rule) && splitImplication(rule);
            setPhrase(this, parts
                ? ['כדי להוכיח', { formula: parts[1] }, 'די להוכיח', { formula: parts[0] }]
                : ['כדי להוכיח את המסקנה שלה, די להוכיח את התנאי שלה']);
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
            const parts = filled(rule) && splitImplication(rule);
            setPhrase(this, parts ? ['נובע', { formula: parts[1] }] : ['נובעת המסקנה של הגרירה']);
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
