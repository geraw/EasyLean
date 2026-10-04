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

    // Unit 4: quantifiers over a domain of objects.
    const QUANTIFIER_COLOUR = 30;

    Blockly.Blocks['logic_forall_intro'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("כדי להוכיח \"לכל\": יהי")
                .appendField(new Blockly.FieldTextInput("?"), "VARIABLE")
                .appendField("עצם שרירותי");
            move(this, QUANTIFIER_COLOUR, 'כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם שרירותי x ומוכיחים את P(x).');
        }
    };

    Blockly.Blocks['logic_forall_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("נציב את העצם")
                .appendField(new Blockly.FieldTextInput("?"), "TERM")
                .appendField("בהנחה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("מסוג \"לכל\"");
            this.appendDummyInput()
                .appendField("ונקרא לתוצאה")
                .appendField(new Blockly.FieldTextInput("?"), "NAME");
            move(this, QUANTIFIER_COLOUR, 'מ"לכל x מתקיים P(x)" נובע P(a) לכל עצם a.');
        }
    };

    Blockly.Blocks['logic_exists_intro'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("כדי להוכיח \"קיים\": נבחר את העצם")
                .appendField(new Blockly.FieldTextInput("?"), "TERM");
            this.appendDummyInput().appendField("ונוכיח שהוא מתאים");
            move(this, QUANTIFIER_COLOUR, 'כדי להוכיח "קיים x כך ש־P(x)" בוחרים עצם a ומוכיחים את P(a).');
        }
    };

    Blockly.Blocks['logic_exists_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("מההנחה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("מסוג \"קיים\" נקבל עצם")
                .appendField(new Blockly.FieldTextInput("?"), "VARIABLE");
            this.appendDummyInput()
                .appendField("שמקיים אותה, ונקרא לזה")
                .appendField(new Blockly.FieldTextInput("?"), "NAME");
            move(this, QUANTIFIER_COLOUR, 'מ"קיים x כך ש־P(x)" מקבלים עצם x, שעליו ידוע רק ש־P(x).');
        }
    };

    // Unit 5: sets.
    const SET_COLOUR = 60;

    Blockly.Blocks['logic_subset_intro'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("כדי להוכיח הכלה: יהי")
                .appendField(new Blockly.FieldTextInput("?"), "VARIABLE")
                .appendField("איבר של הקבוצה הקטנה");
            this.appendDummyInput()
                .appendField("ונקרא לשייכות שלו")
                .appendField(new Blockly.FieldTextInput("?"), "NAME");
            move(this, SET_COLOUR, 'כדי להוכיח A ⊆ B לוקחים איבר שרירותי של A ומוכיחים שהוא שייך ל־B.');
        }
    };

    Blockly.Blocks['logic_subset_elim'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("מההכלה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS")
                .appendField("ומהשייכות")
                .appendField(new Blockly.FieldTextInput("?"), "MEMBER");
            this.appendDummyInput()
                .appendField("נסיק שייכות לקבוצה הגדולה, ונקרא לזה")
                .appendField(new Blockly.FieldTextInput("?"), "NAME");
            move(this, SET_COLOUR, 'אם A ⊆ B ו־x ∈ A, אז x ∈ B.');
        }
    };

    Blockly.Blocks['logic_set_eq'] = {
        init: function () {
            this.appendDummyInput().appendField("נוכיח שוויון קבוצות בשתי הכלות");
            this.appendStatementInput("FIRST").setCheck("tactic").appendField("הכלה ראשונה (⊆):");
            this.appendStatementInput("SECOND").setCheck("tactic").appendField("הכלה שנייה (⊇):");
            move(this, SET_COLOUR, 'שתי קבוצות שוות אם כל אחת מוכלת בשנייה.');
        }
    };

    // Unfolding the definition of a set operation, in the goal or in an
    // assumption (whose name field shows only then). No comma after the
    // operation: after a Latin name (double) it would move in right-to-left text.
    const unfoldBlock = (type, operation, tooltip) => {
        Blockly.Blocks[type] = {
            init: function () {
                const name = new Blockly.FieldTextInput("?");
                const target = new Blockly.FieldDropdown([["המטרה", "GOAL"], ["ההנחה", "HYPOTHESIS"]], function (value) {
                    name.setVisible(value === "HYPOTHESIS");
                    return value;
                });
                this.appendDummyInput()
                    .appendField(`לפי הגדרת ${operation} נפתח את`)
                    .appendField(target, "TARGET")
                    .appendField(name, "HYPOTHESIS");
                name.setVisible(false);
                move(this, SET_COLOUR, tooltip);
            }
        };
    };
    unfoldBlock('logic_unfold_inter', 'החיתוך', 'x ∈ A ∩ B פירושו x ∈ A ∧ x ∈ B.');
    unfoldBlock('logic_unfold_union', 'האיחוד', 'x ∈ A ∪ B פירושו x ∈ A ∨ x ∈ B.');
    unfoldBlock('logic_unfold_compl', 'המשלים', 'x ∈ Aᶜ פירושו x ∉ A.');
    unfoldBlock('logic_unfold_diff', 'ההפרש', 'x ∈ A \\ B פירושו x ∈ A ∧ x ∉ B.');
    unfoldBlock('logic_unfold_empty', 'הקבוצה הריקה', 'x ∈ ∅ פירושו ⊥: אין איבר בקבוצה הריקה.');
    unfoldBlock('logic_unfold_powerset', 'קבוצת החזקה', 'B ∈ 𝒫(A) פירושו B ⊆ A.');
    unfoldBlock('logic_unfold_sunion', 'איחוד המשפחה', 'x ∈ ⋃₀ F פירושו: קיימת A ∈ F כך ש־x ∈ A.');
    unfoldBlock('logic_unfold_sinter', 'חיתוך המשפחה', 'x ∈ ⋂₀ F פירושו: לכל A ∈ F מתקיים x ∈ A.');

    // Unit 6: equality and induction on the natural numbers.
    const EQUALITY_COLOUR = 250;

    Blockly.Blocks['logic_rfl'] = {
        init: function () {
            this.appendDummyInput().appendField("שני הצדדים שווים לפי ההגדרה");
            move(this, EQUALITY_COLOUR, 'סוגר מטרה a = b כששני הצדדים שווים לפי ההגדרות, בלי חשבון.');
        }
    };

    // Substituting by an equality, in a chosen direction, in the goal or in an
    // assumption (whose name field shows only then).
    Blockly.Blocks['logic_rewrite'] = {
        init: function () {
            const name = new Blockly.FieldTextInput("?");
            const target = new Blockly.FieldDropdown([["המטרה", "GOAL"], ["ההנחה", "HYPOTHESIS"]], function (value) {
                name.setVisible(value === "HYPOTHESIS");
                return value;
            });
            this.appendDummyInput()
                .appendField("נחליף לפי השוויון")
                .appendField(new Blockly.FieldTextInput("?"), "EQUATION")
                .appendField(new Blockly.FieldDropdown([["משמאל לימין", "FORWARD"], ["מימין לשמאל", "BACKWARD"]]), "DIRECTION");
            this.appendDummyInput()
                .appendField("בתוך")
                .appendField(target, "TARGET")
                .appendField(name, "HYPOTHESIS");
            name.setVisible(false);
            move(this, EQUALITY_COLOUR, 'משמאל לימין: כל מופע של הצד השמאלי של השוויון מוחלף בצד הימני. מימין לשמאל: להפך.');
        }
    };

    Blockly.Blocks['logic_induction'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("נוכיח באינדוקציה על")
                .appendField(new Blockly.FieldTextInput("?"), "VARIABLE");
            this.appendStatementInput("BASE").setCheck("tactic").appendField("בסיס: נוכיח את הטענה עבור 0");
            // No formula right after a field: in a right-to-left label "+ 1" would
            // move to the end of the row.
            this.appendStatementInput("STEP").setCheck("tactic")
                .appendField("צעד: נניח שהטענה נכונה עבור")
                .appendField(new Blockly.FieldTextInput("?"), "STEP_VARIABLE")
                .appendField("ונקרא לזה")
                .appendField(new Blockly.FieldTextInput("?"), "HYPOTHESIS");
            move(this, EQUALITY_COLOUR, 'כדי להוכיח טענה לכל n מוכיחים אותה עבור 0, ומוכיחים שאם היא נכונה עבור k, היא נכונה עבור k + 1.');
        }
    };

    unfoldBlock('logic_unfold_double', 'double', 'double(0) = 0, ו־double(k + 1) = double(k) + 2.');
    unfoldBlock('logic_unfold_sumto', 'sumTo', 'sumTo(0) = 0, ו־sumTo(k + 1) = sumTo(k) + (k + 1).');
    unfoldBlock('logic_unfold_oddsum', 'oddSum', 'oddSum(0) = 0, ו־oddSum(k + 1) = oddSum(k) + (2k + 1).');
    unfoldBlock('logic_unfold_add', 'החיבור', 'n + (m + 1) = (n + m) + 1: החיבור מוגדר לפי המחובר השני.');
    unfoldBlock('logic_unfold_pow', 'החזקה', '2^(k + 1) = 2^k · 2.');

    Blockly.Blocks['logic_calc'] = {
        init: function () {
            this.appendDummyInput().appendField("המטרה נובעת לפי חשבון");
            move(this, EQUALITY_COLOUR, 'סוגר מטרה של חשבון לינארי (חיבור, כפל בקבוע, אי־שוויונות), גם בעזרת ההנחות. לא פותח הגדרות.');
        }
    };

    Blockly.Blocks['logic_algebra'] = {
        init: function () {
            this.appendDummyInput().appendField("המטרה נובעת לפי אלגברה");
            move(this, EQUALITY_COLOUR, 'סוגר מטרה של אלגברה (פתיחת סוגריים, כינוס איברים), גם בעזרת ההנחות. לא פותח הגדרות.');
        }
    };
};
