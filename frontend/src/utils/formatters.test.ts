import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatters';

describe('formatCurrency', () => {
  it('should format numbers to INR currency', () => {
    expect(formatCurrency(100)).toBe('₹100.00');
    expect(formatCurrency(1234.56)).toBe('₹1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('₹0.00');
  });
});
