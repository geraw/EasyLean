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
            this.appendStatementInput("PROOF")
                .setCheck("tactic")
                .appendField("בנו כאן את ההוכחה:");
            this.setColour(290);
            this.setDeletable(false);
            this.setMovable(false);
            this.setTooltip("זהו בלוק המטרה של השלב. גררו לתוכו את הטקטיקות הדרושות כדי להוכיח אותה.");
        }
    };

    // Theorem blocks: These are helper propositions that can be used in proofs
    Blockly.Blocks['theorem_subset_transitive'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("טרנזיטיביות ההכלה");
            this.appendDummyInput()
                .appendField("הקבוצה")
                .appendField(new Blockly.FieldTextInput("A"), "SET_A")
                .appendField("מוכלת בקבוצה")
                .appendField(new Blockly.FieldTextInput("B"), "SET_B")
                .appendField("על פי ההנחה")
                .appendField(new Blockly.FieldTextInput("h1"), "H1");
            this.appendDummyInput()
                .appendField("והקבוצה")
                .appendField(new Blockly.FieldLabelSerializable("B"), "MIDDLE_SET")
                .appendField("מוכלת בקבוצה")
                .appendField(new Blockly.FieldTextInput("C"), "SET_C")
                .appendField("על פי ההנחה")
                .appendField(new Blockly.FieldTextInput("h2"), "H2");
            this.appendDummyInput()
                .appendField("מכך נסיק")
                .appendField(new Blockly.FieldLabelSerializable("A ⊆ C"), "CONCLUSION")
                .appendField("ונקרא לטענה זו")
                .appendField(new Blockly.FieldTextInput("h"), "RESULT");
            this.setOnChange(() => {
                const setA = this.getFieldValue("SET_A");
                const setB = this.getFieldValue("SET_B");
                const setC = this.getFieldValue("SET_C");
                this.setFieldValue(`${setB}`, "MIDDLE_SET");
                this.setFieldValue(`${setA} ⊆ ${setC}`, "CONCLUSION");
            });
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(120);
            this.setTooltip("שרשרת הכלה: אם אתם יודעים ש A ⊆ B וגם B ⊆ C, ניתן להסיק את הטענה A ⊆ C.");
        }
    };

    Blockly.Blocks['theorem_modus_ponens_sets'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("הוכחת שייכות על ידי הכלה");
            this.appendDummyInput()
                .appendField("האיבר")
                .appendField(new Blockly.FieldTextInput("x"), "ELEMENT")
                .appendField("שייך לקבוצה")
                .appendField(new Blockly.FieldTextInput("A"), "SET_A")
                .appendField("על פי ההנחה")
                .appendField(new Blockly.FieldTextInput("h1"), "H1");
            this.appendDummyInput()
                .appendField("והקבוצה")
                .appendField(new Blockly.FieldLabelSerializable("A"), "SMALL_SET")
                .appendField("מוכלת ב")
                .appendField(new Blockly.FieldTextInput("B"), "SET_B")
                .appendField("על פי ההנחה")
                .appendField(new Blockly.FieldTextInput("h2"), "H2");
            this.appendDummyInput()
                .appendField("מכך נסיק")
                .appendField(new Blockly.FieldLabelSerializable("x ∈ B"), "CONCLUSION")
                .appendField("ונקרא לטענה זו")
                .appendField(new Blockly.FieldTextInput("h"), "RESULT");
            this.setOnChange(() => {
                const setA = this.getFieldValue("SET_A");
                const setB = this.getFieldValue("SET_B");
                const element = this.getFieldValue("ELEMENT");
                this.setFieldValue(`${setA}`, "SMALL_SET");
                this.setFieldValue(`${element} ∈ ${setB}`, "CONCLUSION");
            });
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(120);
            this.setTooltip("הוכחת שייכות על ידי הכלה: אם x שייך ל-A ו-A מוכלת ב-B, נסיק את הטענה ש-x שייך ל-B.");
        }
    };

};
