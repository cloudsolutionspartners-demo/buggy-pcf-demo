import { formatPhoneNumber, formatDate, truncateText } from '../BuggyContactCard/utils/formatters';

// ── formatPhoneNumber ────────────────────────────────────────────────────────

describe('formatPhoneNumber', () => {
    // CATCHES BUG #2: undefined variable `phoneNum` causes ReferenceError at runtime
    it('formats a 10-digit number as (NXX) NXX-XXXX', () => {
        expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('returns the original string when it is not 10 digits', () => {
        expect(formatPhoneNumber('123')).toBe('123');
    });

    it('strips non-numeric characters before formatting', () => {
        expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });
});

// ── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
    it('formats a date string in long format', () => {
        const result = formatDate('2024-01-15');
        expect(result).toMatch(/January/i);
        expect(result).toMatch(/15/);
        expect(result).toMatch(/2024/);
    });

    it('accepts a Date object', () => {
        const result = formatDate(new Date('2024-06-01'));
        expect(result).toMatch(/2024/);
    });
});

// ── truncateText ─────────────────────────────────────────────────────────────

describe('truncateText', () => {
    it('returns the original string when shorter than maxLength', () => {
        expect(truncateText('hello', 10)).toBe('hello');
    });

    it('returns the original string when equal to maxLength', () => {
        expect(truncateText('hello', 5)).toBe('hello');
    });

    it('truncates and appends ellipsis when longer than maxLength', () => {
        expect(truncateText('hello world', 5)).toBe('hello...');
    });

    it('truncates to exactly maxLength characters before the ellipsis', () => {
        const result = truncateText('abcdefghij', 4);
        expect(result).toBe('abcd...');
    });
});
