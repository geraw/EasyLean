import * as Blockly from 'blockly/core';

// Blocks used only by the game-mode levels (as opposed to the free sandbox).
export const defineGameBlocks = () => {

    // The level's goal. Fixed/immutable (players cannot edit or delete it) -
    // players build their proof by dropping tactic blocks into the PROOF slot.
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
            this.setTooltip("זהו בלוק המטרה של השלב. גררו לתוכו את הטקטיקות הדרושות כדי להוכיח אותה.");
        }
    };

    // Unit 2: one block per rule for "and", "or" and "iff". A rule that splits
    // the proof has a slot per part, so each sub-proof sits inside its own slot.
    const move = (block, colour, tooltip) => {
        block.setPreviousStatement(true, "tactic");
        block.setNextStatement(true, "tactic");
        block.setColour(colour);
        block.setTooltip(tooltip);
    };
    const RULE_COLOUR = 200;

    Blockly.Blocks['logic_and_intro'] = {
        init: function () {
            this.appendDummyInput().appendField("נוכיח כל אחד משני הצדדים של ה\"וגם\" לחוד");
            this.appendStatementInput("LEFT").setCheck("tactic").appendField("צד שמאל:");
            this.appendStatementInput("RIGHT").setCheck("tactic").appendField("צד ימין:");
            move(this, RULE_COLOUR, 'כדי להוכיח "P וגם Q" מוכיחים את P ומוכיחים את Q.');
        }
    };

    Blockly.Blocks['logic_and_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("מההנחה")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("מסוג \"וגם\" נסיק את שני הצדדים שלה:");
            this.appendDummyInput()
                .appendField("צד שמאל, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("h1"), "LEFT_NAME")
                .appendField("וצד ימין, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("h2"), "RIGHT_NAME");
            move(this, RULE_COLOUR, 'מההנחה "P וגם Q" נובע P, ונובע גם Q.');
        }
    };

    Blockly.Blocks['logic_or_intro_left'] = {
        init: function () {
            this.appendDummyInput().appendField("כדי להוכיח את ה\"או\", נוכיח את צד שמאל שלו");
            move(this, RULE_COLOUR, 'כדי להוכיח "P או Q" מספיק להוכיח את P.');
        }
    };

    Blockly.Blocks['logic_or_intro_right'] = {
        init: function () {
            this.appendDummyInput().appendField("כדי להוכיח את ה\"או\", נוכיח את צד ימין שלו");
            move(this, RULE_COLOUR, 'כדי להוכיח "P או Q" מספיק להוכיח את Q.');
        }
    };

    Blockly.Blocks['logic_or_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("נחלק למקרים לפי ההנחה")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("מסוג \"או\":");
            this.appendStatementInput("LEFT").setCheck("tactic")
                .appendField("מקרה ראשון: צד שמאל נכון, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("h1"), "LEFT_NAME");
            this.appendStatementInput("RIGHT").setCheck("tactic")
                .appendField("מקרה שני: צד ימין נכון, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("h2"), "RIGHT_NAME");
            move(this, RULE_COLOUR, 'אם ידוע "P או Q", מוכיחים את המטרה פעם אחת בהנחה P ופעם אחת בהנחה Q.');
        }
    };

    Blockly.Blocks['logic_iff_intro'] = {
        init: function () {
            this.appendDummyInput().appendField("נוכיח את שני הכיוונים של ה\"אם ורק אם\" לחוד");
            this.appendStatementInput("FORWARD").setCheck("tactic").appendField("כיוון ראשון, משמאל לימין (→):");
            this.appendStatementInput("BACKWARD").setCheck("tactic").appendField("כיוון שני, מימין לשמאל (←):");
            move(this, RULE_COLOUR, 'כדי להוכיח "P אם ורק אם Q" מוכיחים את P → Q ואת Q → P.');
        }
    };

    Blockly.Blocks['logic_iff_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("מההנחה")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("מסוג \"אם ורק אם\" נסיק את שני הכיוונים שלה:");
            this.appendDummyInput()
                .appendField("משמאל לימין (→), ונקרא לו")
                .appendField(new Blockly.FieldTextInput("h1"), "FORWARD_NAME")
                .appendField("ומימין לשמאל (←), ונקרא לו")
                .appendField(new Blockly.FieldTextInput("h2"), "BACKWARD_NAME");
            move(this, RULE_COLOUR, 'מההנחה "P אם ורק אם Q" נובעות הגרירות P → Q ו־Q → P.');
        }
    };
};
