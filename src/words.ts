const BASE = import.meta.env.BASE_URL;
const LAUNCH = Date.UTC(2026, 9, 25); // day #1

export const ALPHABET = 'aąbcćdeęfghijklłmnńoóprsśtuwyzźż';

const chunks = new Map<string, Promise<Set<string>>>();

// Guess list is split by first letter (public/words/<codepoint>.txt) and fetched lazily.
export function isValid(word: string): Promise<boolean> {
  const c = word[0];
  if (!chunks.has(c))
    chunks.set(
      c,
      fetch(`${BASE}words/${c.codePointAt(0)}.txt`)
        .then((r) => (r.ok ? r.text() : ''))
        .then((t) => new Set(t.split('\n'))),
    );
  return chunks.get(c)!.then((set) => set.has(word));
}

let secrets: Promise<string[]> | undefined;
function loadSecrets() {
  return (secrets ??= fetch(`${BASE}secrets.txt`)
    .then((r) => r.text())
    .then((t) => shuffle(t.split('\n').filter(Boolean), 20261025)));
}

function shuffle<T>(a: T[], seed: number): T[] {
  // mulberry32
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function today(): number {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' })
    .format(new Date())
    .split('-')
    .map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - LAUNCH) / 864e5) + 1;
}

export async function dailySecret(day: number): Promise<string> {
  const list = await loadSecrets();
  return list[(((day - 1) % list.length) + list.length) % list.length];
}

export async function randomSecret(): Promise<string> {
  const list = await loadSecrets();
  const daily = await dailySecret(today());
  let w;
  do w = list[Math.floor(Math.random() * list.length)];
  while (w === daily);
  return w;
}
