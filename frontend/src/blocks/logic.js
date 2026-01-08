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
                .appendField("נניח את צד שמאל של הגרירה שאנחנו רוצים להוכיח ונקרא להנחה זאת")
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
            this.appendDummyInput().appendField("נוכיח כל אחד מהצדדים של טענה מסוג \"וגם\" לחוד");

            this.appendDummyInput()
                .appendField("הוכחת צד שמאל:");
            this.appendStatementInput("PROOF_LEFT")
                .setCheck("tactic");

            this.appendDummyInput()
                .appendField("הוכחת צד ימין:");
            this.appendStatementInput("PROOF_RIGHT")
                .setCheck("tactic");

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
                .appendField("נפרק את")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("לגורמים, וקרא להם")
                .appendField(new Blockly.FieldTextInput("left"), "HYPOTHESIS_LEFT")
                .appendField(",")
                .appendField(new Blockly.FieldTextInput("right"), "HYPOTHESIS_RIGHT");
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
            this.appendDummyInput().appendField("נוכיח את טענת ה \"או\" באמצעות הוכחת צד שמאל");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
        }
    };

    // Tactic: Or Intro Right
    Blockly.Blocks['tactic_or_intro_right'] = {
        init: function () {
            this.appendDummyInput().appendField("נוכיח את טענת ה \"או\" באמצעות הוכחת צד ימין");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
        }
    };

    // Tactic: Or Elim (Cases)
    Blockly.Blocks['tactic_or_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("פצל את הנחה")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("מסוג \"או\" לשני מקרים");

            this.appendDummyInput()
                .appendField("במקרה שצד שמאל נכון");
            this.appendStatementInput("CASE_LEFT")
                .setCheck("tactic")
                .appendField("נקרא לו")
                .appendField(new Blockly.FieldTextInput("h_left"), "HYPOTHESIS_LEFT")
                .appendField(":");

            this.appendDummyInput()
                .appendField("במקרה שצד ימין נכון");
            this.appendStatementInput("CASE_RIGHT")
                .setCheck("tactic")
                .appendField("נקרא לו")
                .appendField(new Blockly.FieldTextInput("h_right"), "HYPOTHESIS_RIGHT")
                .appendField(":");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(200);
        }
    };

    // Tactic: Show (Verify Goal)
    Blockly.Blocks['tactic_show'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("מה שצריך להוכיח זה")
                .appendField(new Blockly.FieldTextInput("P"), "PROPOSITION");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(180);
            this.setTooltip("Verify the current goal state (show tactic)");
        }
    };

    // Tactic: Check Hypothesis (Have)
    Blockly.Blocks['tactic_check_hyp'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("עכשיו")
                .appendField(new Blockly.FieldTextInput("h"), "HYPOTHESIS")
                .appendField("הוא")
                .appendField(new Blockly.FieldTextInput("P"), "PROPOSITION");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(180);
            this.setTooltip("Verify the type of a hypothesis");
        }
    };
};
