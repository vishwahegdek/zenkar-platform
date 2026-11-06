import { describe, it, expect } from 'vitest';
import {
  isDoorsAndFramesCategory,
  isFurnitureCategory,
  getCategoryPriority,
  sortCategoriesWithPriority
} from './productEstimateHelpers';

describe('productEstimateHelpers - category prioritization', () => {
  it('identifies doors and frames categories in various formats', () => {
    expect(isDoorsAndFramesCategory({ name: 'Doors & Frames' })).toBe(true);
    expect(isDoorsAndFramesCategory({ name: 'Door Frames' })).toBe(true);
    expect(isDoorsAndFramesCategory({ name: 'Doors' })).toBe(true);
    expect(isDoorsAndFramesCategory({ name: 'Door - Door Frames' })).toBe(true);
    expect(isDoorsAndFramesCategory({ category: { name: 'Doors & Frames' } })).toBe(true);
    expect(isDoorsAndFramesCategory('Doors & Frames')).toBe(true);
    expect(isDoorsAndFramesCategory({ name: 'Bee boxes' })).toBe(false);
  });

  it('identifies furniture category in various formats', () => {
    expect(isFurnitureCategory({ name: 'Furniture' })).toBe(true);
    expect(isFurnitureCategory({ name: 'Furnitures' })).toBe(true);
    expect(isFurnitureCategory({ category: { name: 'Furniture' } })).toBe(true);
    expect(isFurnitureCategory('Furniture')).toBe(true);
    expect(isFurnitureCategory({ name: 'Honey' })).toBe(false);
  });

  it('assigns correct priorities: Doors & Frames (1), Furniture (2), Other (3)', () => {
    expect(getCategoryPriority({ name: 'Doors & Frames' })).toBe(1);
    expect(getCategoryPriority({ name: 'Door Frames' })).toBe(1);
    expect(getCategoryPriority({ name: 'Furniture' })).toBe(2);
    expect(getCategoryPriority({ name: 'Bee boxes' })).toBe(3);
    expect(getCategoryPriority({ name: 'Honey' })).toBe(3);
    expect(getCategoryPriority({ name: 'General' })).toBe(3);
  });

  it('sorts categories prioritizing doors & frames, then furniture, then alphabetical', () => {
    const rawCategories = [
      { id: 1, name: 'Bee boxes' },
      { id: 2, name: 'General' },
      { id: 3, name: 'Furniture' },
      { id: 4, name: 'Doors & Frames' },
      { id: 5, name: 'Beekeeping' },
      { id: 6, name: 'Honey' },
      { id: 7, name: 'Sawmill' },
    ];

    const sorted = sortCategoriesWithPriority(rawCategories);

    expect(sorted.map(c => c.name)).toEqual([
      'Doors & Frames',
      'Furniture',
      'Bee boxes',
      'Beekeeping',
      'General',
      'Honey',
      'Sawmill',
    ]);
  });

  it('handles empty or invalid inputs gracefully', () => {
    expect(sortCategoriesWithPriority([])).toEqual([]);
    expect(sortCategoriesWithPriority(null)).toEqual([]);
    expect(sortCategoriesWithPriority(undefined)).toEqual([]);
  });
});
