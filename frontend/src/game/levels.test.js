import { describe, expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { unit1Levels } from './unit1World';
import { subsetLevels } from './subsetWorld';
import { loadWorkspace } from '../test/blocklyWorkspace';

const worlds = { unit1: unit1Levels, subset: subsetLevels };

describe.each(Object.entries(worlds))('%s world levels', (_, levels) => {
    it.each(levels.map(level => [level.id, level]))('%s loads a single fixed goal block', (_, level) => {
        const goals = loadWorkspace(level.startXml).getTopBlocks(false).filter(b => b.type === 'game_goal');
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
