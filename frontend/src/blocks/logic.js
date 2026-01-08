import * as Blockly from 'blockly/core';
import 'blockly/javascript';

// Define the custom blocks
export const defineBlocks = () => {

    // Example Block: Theorem (Top level)
    Blockly.Blocks['theorem'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("משפט:")
                .appendField(new Blockly.FieldTextInput("thm_name"), "NAME");
            this.appendDummyInput()
                .appendField("הוכחה עבור:")
                .appendField(new Blockly.FieldTextInput("P -> P"), "PROPOSITION");
            this.appendStatementInput("PROOF")
                .setCheck("tactic")
                .appendField("הוכחה:");
            this.setColour(230);
            this.setTooltip("הגדרת המשפט וההוכחה");
            this.setHelpUrl("");
        }
    };

    // Tactic: Intro (Assume)
    Blockly.Blocks['tactic_intro'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("הנח")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(160);
            this.setTooltip("tactic: intro");
            this.setHelpUrl("");
        }
    };

    // Tactic: Exact
    Blockly.Blocks['tactic_exact'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("מדויק")
                .appendField(new Blockly.FieldTextInput("h"), "TERM");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(160);
            this.setTooltip("tactic: exact");
            this.setHelpUrl("");
        }
    };

    // Tactic: Apply
    Blockly.Blocks['tactic_apply'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("החל")
                .appendField(new Blockly.FieldTextInput("h"), "TERM");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(160);
            this.setTooltip("tactic: apply");
            this.setHelpUrl("");
        }
    };
};
