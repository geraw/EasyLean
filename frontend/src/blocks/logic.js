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
                .appendField("נניח את צד שמאל של הגרירה ונקרא להנחה זאת")
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
                .appendField("מה שאנחנו רוצים להוכיח זה בדיוק")
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
                .appendField("הפעל")
                .appendField(new Blockly.FieldTextInput("h"), "TERM");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(160);
            this.setTooltip("tactic: apply");
            this.setHelpUrl("");
        }
    };

    // Tactic: And Intro (Split)
    Blockly.Blocks['tactic_and_intro'] = {
        init: function () {
            this.appendDummyInput().appendField("פצל (And.intro)");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
            this.setTooltip("Split the goal proof into two sub-goals (P ∧ Q)");
        }
    };

    // Tactic: And Elim (Cases)
    Blockly.Blocks['tactic_and_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("פרק את")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("לגורמים (cases)");
            this.appendStatementInput("DO")
                .setCheck("tactic");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
            this.setTooltip("Destructure an AND hypothesis");
        }
    };

    // Tactic: Or Intro Left
    Blockly.Blocks['tactic_or_intro_left'] = {
        init: function () {
            this.appendDummyInput().appendField("הוכח צד שמאל (Or.inl)");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
        }
    };

    // Tactic: Or Intro Right
    Blockly.Blocks['tactic_or_intro_right'] = {
        init: function () {
            this.appendDummyInput().appendField("הוכח צד ימין (Or.inr)");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
        }
    };

    // Tactic: Or Elim (Cases)
    Blockly.Blocks['tactic_or_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("פצל למקרים את")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("(Or cases)");
            this.appendStatementInput("CASE_LEFT")
                .setCheck("tactic")
                .appendField("מקרה שמאל (inl):");
            this.appendStatementInput("CASE_RIGHT")
                .setCheck("tactic")
                .appendField("מקרה ימין (inr):");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
        }
    };
};
