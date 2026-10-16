import * as Blockly from 'blockly/core';

// The goal block of a level, into which the proof's moves go (the moves are in
// moves.js). Every field of a move starts as this placeholder: choosing the
// assumption, statement or object it uses is left to the student.
export const PLACEHOLDER = '?';

export const defineGameBlocks = () => {

    // The level's goal. Fixed/immutable (players cannot edit or delete it) -
    // players build their proof by dropping moves into the PROOF slot.
    Blockly.Blocks['game_goal'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("🎯 המטרה:")
                .appendField(new Blockly.FieldLabelSerializable(""), "GOAL_LABEL");
            this.appendDummyInput()
                .appendField("הנחות פתיחה:")
                .appendField(new Blockly.FieldLabelSerializable("אין הנחות פתיחה"), "CONTEXT_LABEL");
            this.appendStatementInput("PROOF")
                .setCheck("tactic")
                .appendField("בנו כאן את ההוכחה:");
            this.setColour(290);
            this.setDeletable(false);
            this.setMovable(false);
            this.setTooltip("זהו בלוק המטרה של השלב. גררו לתוכו את מהלכי ההוכחה.");
        }
    };
};
