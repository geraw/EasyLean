import * as Blockly from 'blockly/core';

// Blocks used only by the game-mode levels (as opposed to the free sandbox).
// Every field starts as this placeholder: choosing the assumption (or formula)
// a move uses, and naming the assumptions it adds, is left to the student.
// (Generic default names also collided with the names a level gives.)
export const PLACEHOLDER = '?';

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

    // Unit 1: the forward use of an implication (modus ponens): from P → Q and
    // P, the conclusion Q becomes a new assumption. (tactic_apply_rule, in
    // logic.js, is the backward use: it turns the goal Q into P.)
    Blockly.Blocks['logic_modus_ponens'] = {
        init: function () {
            // Two rows, so nested proofs stay narrow enough for the workspace.
            this.appendDummyInput()
                .appendField("מהגרירה")
                .appendField(new Blockly.FieldTextInput("?"), "RULE")
                .appendField("ומההנחה")
                .appendField(new Blockly.FieldTextInput("?"), "PREMISE")
                .appendField("שהיא התנאי שלה");
            this.appendDummyInput()
                .appendField("נסיק את המסקנה שלה ונקרא לה")
                .appendField(new Blockly.FieldTextInput("?"), "NAME");
            this.setPreviousStatement(true, "tactic");
            this.setNextStatement(true, "tactic");
            this.setColour(160);
            this.setTooltip('אם בידינו P → Q וגם P, אפשר להסיק את Q ולהוסיף אותה להנחות.');
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
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("מסוג \"וגם\" נסיק את שני הצדדים שלה:");
            this.appendDummyInput()
                .appendField("צד שמאל, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("?"), "LEFT_NAME")
                .appendField("וצד ימין, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("?"), "RIGHT_NAME");
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
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("מסוג \"או\":");
            this.appendStatementInput("LEFT").setCheck("tactic")
                .appendField("מקרה ראשון: צד שמאל נכון, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("?"), "LEFT_NAME");
            this.appendStatementInput("RIGHT").setCheck("tactic")
                .appendField("מקרה שני: צד ימין נכון, ונקרא לו")
                .appendField(new Blockly.FieldTextInput("?"), "RIGHT_NAME");
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
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("מסוג \"אם ורק אם\" נסיק את שני הכיוונים שלה:");
            this.appendDummyInput()
                .appendField("משמאל לימין (→), ונקרא לו")
                .appendField(new Blockly.FieldTextInput("?"), "FORWARD_NAME")
                .appendField("ומימין לשמאל (←), ונקרא לו")
                .appendField(new Blockly.FieldTextInput("?"), "BACKWARD_NAME");
            move(this, RULE_COLOUR, 'מההנחה "P אם ורק אם Q" נובעות הגרירות P → Q ו־Q → P.');
        }
    };

    // Unit 3: negation. ¬P means "P leads to a contradiction"; the
    // contradiction itself (Lean's False) is shown as ⊥.
    const NEGATION_COLOUR = 330;

    Blockly.Blocks['logic_contradiction'] = {
        init: function () {
            // Two rows, so nested proofs stay narrow enough for the workspace.
            this.appendDummyInput()
                .appendField("ההנחה")
                .appendField(new Blockly.FieldTextInput("?"), "NEGATION")
                .appendField("היא השלילה של ההנחה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS");
            this.appendDummyInput().appendField("ולכן הגענו לסתירה");
            move(this, NEGATION_COLOUR, 'טענה ושלילתה יחד הן סתירה.');
        }
    };

    // Ex falso as a fact: the implication ⊥ → Q, which the move from unit 1
    // ("pass to the condition of an implication") then uses.
    Blockly.Blocks['logic_false_implies'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("נשתמש בגרירה: סתירה גוררת")
                .appendField(new Blockly.FieldTextInput("?"), "FORMULA");
            this.appendDummyInput()
                .appendField("ונקרא לה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS");
            move(this, NEGATION_COLOUR, 'מסתירה נובעת כל טענה: הגרירה ⊥ → Q נכונה תמיד.');
        }
    };

    // The principle of non-contradiction as a fact: (P ∧ ¬P) → ⊥, used like
    // any implication (backward to its condition, or forward).
    Blockly.Blocks['logic_non_contradiction'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("נשתמש בעיקרון הסתירה: הטענה")
                .appendField(new Blockly.FieldTextInput("?"), "FORMULA")
                .appendField("ושלילתה גוררות סתירה");
            this.appendDummyInput()
                .appendField("ונקרא לגרירה הזאת")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS");
            move(this, NEGATION_COLOUR, 'עיקרון הסתירה: (P ∧ ¬P) → ⊥ נכונה לכל טענה P.');
        }
    };

    // Two assumptions combined into one "and" (∧-introduction, forward).
    Blockly.Blocks['logic_and_combine'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("מההנחה")
                .appendField(new Blockly.FieldTextInput("?"), "LEFT")
                .appendField("ומההנחה")
                .appendField(new Blockly.FieldTextInput("?"), "RIGHT");
            this.appendDummyInput()
                .appendField("נסיק את שתיהן יחד (\"וגם\") ונקרא לזה")
                .appendField(new Blockly.FieldTextInput("?"), "NAME");
            move(this, RULE_COLOUR, 'מ־P ומ־Q נובע "P וגם Q".');
        }
    };

    Blockly.Blocks['logic_not_intro'] = {
        init: function () {
            this.appendDummyInput().appendField("נוכיח את השלילה: נניח את הטענה שהיא שוללת");
            this.appendDummyInput()
                .appendField("ונקרא לה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("ונגיע לסתירה");
            move(this, NEGATION_COLOUR, 'כדי להוכיח ¬P מניחים P ומגיעים לסתירה.');
        }
    };

    Blockly.Blocks['logic_not_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("נגיע לסתירה בעזרת השלילה")
                .appendField(new Blockly.FieldTextInput("?"), "NEGATION");
            this.appendDummyInput().appendField("ולכן נוכיח את הטענה שהיא שוללת");
            move(this, NEGATION_COLOUR, 'אם בידינו ¬P, כדי להגיע לסתירה מספיק להוכיח את P.');
        }
    };

    Blockly.Blocks['logic_by_contradiction'] = {
        init: function () {
            this.appendDummyInput().appendField("נוכיח בשלילה: נניח שהמטרה לא נכונה");
            this.appendDummyInput()
                .appendField("ונקרא לזה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("ונגיע לסתירה");
            move(this, NEGATION_COLOUR, 'כדי להוכיח P מניחים ¬P ומגיעים לסתירה (עיקרון של הלוגיקה הקלאסית).');
        }
    };

    Blockly.Blocks['logic_by_cases'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("נבדוק את שתי האפשרויות: הטענה")
                .appendField(new Blockly.FieldTextInput("?"), "FORMULA")
                .appendField("נכונה או לא נכונה");
            this.appendStatementInput("LEFT").setCheck("tactic")
                .appendField("אם היא נכונה, נקרא לזה")
                .appendField(new Blockly.FieldTextInput("?"), "LEFT_NAME");
            this.appendStatementInput("RIGHT").setCheck("tactic")
                .appendField("אם היא לא נכונה, נקרא לזה")
                .appendField(new Blockly.FieldTextInput("?"), "RIGHT_NAME");
            move(this, NEGATION_COLOUR, 'כל טענה נכונה או לא נכונה; מוכיחים את המטרה בשני המקרים (עיקרון של הלוגיקה הקלאסית).');
        }
    };
};
