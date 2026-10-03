import { describe, expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { unit0Levels } from './unit0World';
import { unit1Levels } from './unit1World';
import { unit2Levels } from './unit2World';
import { unit3Levels } from './unit3World';
import { loadWorkspace } from '../test/blocklyWorkspace';

const worlds = { unit0: unit0Levels, unit1: unit1Levels, unit2: unit2Levels, unit3: unit3Levels };

describe.each(Object.entries(worlds))('%s world levels', (_, levels) => {
    it.each(levels.map(level => [level.id, level]))('%s loads a single fixed goal block', (_, level) => {
        const goals = loadWorkspace(level.startXml).getTopBlocks(true).filter(b => b.type === 'game_goal');
        expect(goals).toHaveLength(1);
        expect(goals[0].isDeletable()).toBe(false);
    });

    it.each(levels.map(level => [level.id, level]))('%s only offers blocks that exist and generate Lean', (_, level) => {
        const types = [...(level.toolboxBlocks || []), ...level.newTacticsBlocks];
        types.forEach(type => {
            expect(Blockly.Blocks[type], type).toBeDefined();
            expect(leanGenerator.forBlock[type], type).toBeTypeOf('function');
        });
    });

    it('numbers its levels consecutively', () => {
        expect(levels.map(l => l.levelNumber)).toEqual(levels.map((_, i) => i + 1));
    });
});

// The forward use of an implication (modus ponens), introduced in unit 1
// level 3, stays available in every later level that can use it: an
// assumption it derives is used through "זה בדיוק", so each comes with the other.
describe('the forward step', () => {
    const later = [...unit1Levels.slice(2), ...unit2Levels, ...unit3Levels];
    it.each(later.map((level) => [level.id, level]))('%s offers it together with "זה בדיוק"', (_, level) => {
        expect(level.toolboxBlocks.includes('logic_modus_ponens')).toBe(level.toolboxBlocks.includes('tactic_exact'));
    });
});
