import { describe, expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { unit0Levels } from './unit0World';
import { unit1Levels } from './unit1World';
import { unit2Levels } from './unit2World';
import { unit3Levels } from './unit3World';
import { unit4Levels } from './unit4World';
import { unit5Levels } from './unit5World';
import { unit6Levels } from './unit6World';
import { loadWorkspace } from '../test/blocklyWorkspace';
import { UNITS } from '../../e2e/solutions';

const worlds = { unit0: unit0Levels, unit1: unit1Levels, unit2: unit2Levels, unit3: unit3Levels, unit4: unit4Levels, unit5: unit5Levels, unit6: unit6Levels };

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

// Each toolbox holds only blocks that one of the level's intended solutions
// (e2e/solutions.js) uses, so the student never meets a block that cannot help.
describe('the toolbox', () => {
    const usedBlocks = (steps, found = new Set()) => {
        steps.forEach(([type, , inputs]) => {
            found.add(type);
            Object.values(inputs || {}).forEach(inner => usedBlocks(inner, found));
        });
        return found;
    };
    const cases = UNITS.flatMap(({ unit, levels: solutions }) =>
        worlds[`unit${unit}`].map((level, i) => [level.id, level, usedBlocks(solutions[i].flatMap(s => s.steps))]));
    it.each(cases)('%s offers only blocks that a solution uses', (_, level, used) => {
        expect(level.toolboxBlocks.filter(type => !used.has(type))).toEqual([]);
    });
});
