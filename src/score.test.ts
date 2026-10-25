import { expect, test } from 'vitest';
import { scoreGuess } from './score';

const marks = (g: string, s: string) => scoreGuess(g, s).map((t) => t.mark[0]).join('');
const joins = (g: string, s: string) => scoreGuess(g, s).map((t) => (t.joinNext ? '-' : '.')).join('');

test('exact word: all in order, joined, both markers', () => {
  const t = scoreGuess('kasza', 'kasza');
  expect(marks('kasza', 'kasza')).toBe('ooooo');
  expect(joins('kasza', 'kasza')).toBe('----.');
  expect(t[0].start && t[4].end).toBe(true);
});

test('in order but not together, with start and end markers', () => {
  const t = scoreGuess('tlen', 'telefon');
  expect(marks('tlen', 'telefon')).toBe('oooo');
  expect(joins('tlen', 'telefon')).toBe('.-..');
  expect([t[0].start, t[3].end]).toEqual([true, true]);
});

test('joined group plus out-of-order letters', () => {
  expect(marks('fotel', 'telefon')).toBe('mmooo');
  expect(joins('fotel', 'telefon')).toBe('..--.');
});

test('prefers the alignment with more joins', () => {
  expect(joins('ab', 'axab')).toBe('-.');
});

test('duplicates limited by remaining count in secret', () => {
  expect(marks('oko', 'kot')).toBe('aoo');
});

test('absent letters', () => {
  expect(marks('ryż', 'kot')).toBe('aaa');
});
