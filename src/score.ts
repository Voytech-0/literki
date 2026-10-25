// Feedback algorithm — see docs/adr/0006-feedback-algorithm.md

export type Mark = 'order' | 'misplaced' | 'absent';

export interface Tile {
  letter: string;
  mark: Mark;
  joinNext: boolean; // joined to the following tile
  start: boolean;
  end: boolean;
}

type Pair = [number, number]; // [guess index, secret index]

export function scoreGuess(guess: string, secret: string): Tile[] {
  const g = [...guess];
  const s = [...secret];

  // lcs[i][j] = LCS length of g[i:] and s[j:]
  const lcs = Array.from({ length: g.length + 1 }, () => new Array<number>(s.length + 1).fill(0));
  for (let i = g.length - 1; i >= 0; i--)
    for (let j = s.length - 1; j >= 0; j--)
      lcs[i][j] = g[i] === s[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const joins = (a: Pair[]) => a.filter((p, k) => k > 0 && p[0] === a[k - 1][0] + 1 && p[1] === a[k - 1][1] + 1).length;
  const edges = (a: Pair[]) =>
    a.filter(([gi, si]) => (gi === 0 && si === 0) || (gi === g.length - 1 && si === s.length - 1)).length;

  // Enumerate every maximum-length alignment (≤10×10, so brute force is fine); keep the best by tie-breaks.
  let best: Pair[] = [];
  let bestKey = [-1, -1];
  const walk = (i: number, j: number, acc: Pair[]) => {
    if (lcs[i][j] === 0) {
      const key = [joins(acc), edges(acc)];
      if (key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) [best, bestKey] = [acc, key];
      return;
    }
    for (let a = i; a < g.length; a++)
      for (let b = j; b < s.length; b++)
        if (g[a] === s[b] && lcs[a + 1][b + 1] + 1 === lcs[i][j]) walk(a + 1, b + 1, [...acc, [a, b]]);
  };
  walk(0, 0, []);

  const matched = new Map(best);
  const left = new Map<string, number>();
  s.forEach((c, j) => {
    if (![...matched.values()].includes(j)) left.set(c, (left.get(c) ?? 0) + 1);
  });

  return g.map((letter, i) => {
    const si = matched.get(i);
    let mark: Mark = 'absent';
    if (si !== undefined) mark = 'order';
    else if ((left.get(letter) ?? 0) > 0) {
      mark = 'misplaced';
      left.set(letter, left.get(letter)! - 1);
    }
    return {
      letter,
      mark,
      joinNext: si !== undefined && matched.get(i + 1) === si + 1,
      start: si === 0 && i === 0,
      end: si === s.length - 1 && i === g.length - 1,
    };
  });
}
