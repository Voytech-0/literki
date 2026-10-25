import { scoreGuess, type Tile } from './score';
import { ALPHABET, dailySecret, isValid, randomSecret, today } from './words';

type Mode = 'daily' | 'unlimited';

interface Game {
  secret: string;
  day?: number;
  guesses: string[];
  hints: { used: number; revealed: string[]; greyed: boolean };
  solved: boolean;
}

interface Stats {
  daily: { played: number; wins: number; streak: number; best: number; guesses: number; lastWin: number };
  unlimited: { played: number; guesses: number };
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const store = {
  get<T>(key: string): T | undefined {
    try {
      const v = localStorage.getItem(`literki:${key}`);
      return v ? JSON.parse(v) : undefined;
    } catch {
      return undefined;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`literki:${key}`, JSON.stringify(value));
    } catch {}
  },
};

const newGame = (secret: string, day?: number): Game => ({
  secret,
  day,
  guesses: [],
  hints: { used: 0, revealed: [], greyed: false },
  solved: false,
});

let mode: Mode = store.get<Mode>('mode') ?? 'daily';
let game: Game;
let input = '';
let busy = false;
const stats: Stats = store.get<Stats>('stats') ?? {
  daily: { played: 0, wins: 0, streak: 0, best: 0, guesses: 0, lastWin: 0 },
  unlimited: { played: 0, guesses: 0 },
};

async function loadGame() {
  if (mode === 'daily') {
    const day = today();
    const saved = store.get<Game>('daily');
    game = saved?.day === day ? saved : newGame(await dailySecret(day), day);
  } else {
    game = store.get<Game>('unlimited') ?? newGame(await randomSecret());
  }
  input = '';
  save();
  render();
  $(game.solved ? 'win' : 'input').scrollIntoView({ block: 'nearest' });
}

const save = () => store.set(mode, game);

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10, h = n % 100;
  return d >= 2 && d <= 4 && !(h >= 12 && h <= 14) ? few : many;
}
const triesText = (n: number) => `${n} ${plural(n, 'próba', 'próby', 'prób')}`;
const hintsText = (n: number) => `${n} ${plural(n, 'podpowiedź', 'podpowiedzi', 'podpowiedzi')}`;

// --- rendering ---

function tilesEl(tiles: Tile[]) {
  const row = document.createElement('div');
  row.className = 'row';
  for (const t of tiles) {
    const el = document.createElement('span');
    el.className = ['tile', t.mark, t.joinNext && 'join', t.start && 'start', t.end && 'end'].filter(Boolean).join(' ');
    el.textContent = t.letter;
    row.append(el);
  }
  return row;
}

function keyStates() {
  const present = new Set(game.hints.revealed);
  const absent = new Set<string>();
  for (const g of game.guesses)
    for (const t of scoreGuess(g, game.secret)) if (t.mark !== 'absent') present.add(t.letter);
  for (const c of new Set(game.guesses.join(''))) if (!game.secret.includes(c)) absent.add(c);
  if (game.hints.greyed) for (const c of ALPHABET) if (!game.secret.includes(c)) absent.add(c);
  return { present, absent };
}

function unfoundLetters() {
  const { present } = keyStates();
  return [...new Set(game.secret)].filter((c) => !present.has(c));
}

function render() {
  document.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((b) =>
    b.setAttribute('aria-selected', String(b.dataset.mode === mode)),
  );
  $('count-guesses').textContent = `Próby: ${game.guesses.length}`;
  $('count-hints').textContent = `Podpowiedzi: ${game.hints.used}`;

  const hintBtn = $<HTMLButtonElement>('hint-btn');
  hintBtn.disabled = game.solved || (game.hints.greyed && unfoundLetters().length === 0);
  hintBtn.title = hintBtn.disabled && !game.solved ? 'Więcej podpowiedzi wkrótce' : '';

  const inputEl = $('input');
  inputEl.replaceChildren(
    ...[...input.padEnd(Math.max(input.length, 4), ' ')].map((c) => {
      const el = document.createElement('span');
      el.className = 'tile' + (c === ' ' ? ' empty' : '');
      el.textContent = c;
      return el;
    }),
  );
  inputEl.hidden = game.solved;

  $('guesses').replaceChildren(...game.guesses.map((g) => tilesEl(scoreGuess(g, game.secret))));

  $('win').hidden = !game.solved;
  $('again-btn').hidden = mode === 'daily';
  if (game.solved)
    $('win-text').textContent = `Brawo! ${game.secret.toUpperCase()} — ${triesText(game.guesses.length)}, ${hintsText(game.hints.used)}.`;

  const { present, absent } = keyStates();
  document.querySelectorAll<HTMLButtonElement>('#keyboard [data-key]').forEach((k) => {
    const c = k.dataset.key!;
    k.classList.toggle('present', present.has(c));
    k.classList.toggle('absent', absent.has(c));
  });
}

let toastTimer = 0;
function toast(msg: string) {
  $('toast').textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ($('toast').textContent = ''), 2000);
}

// --- actions ---

function type(c: string) {
  if (game.solved || input.length >= 10) return;
  input += c;
  render();
}

function backspace() {
  input = input.slice(0, -1);
  render();
}

async function submit() {
  if (game.solved || busy) return;
  const word = input;
  if (word.length < 2) return toast('Za krótkie');
  if (game.guesses.includes(word)) return toast('To słowo już było');
  busy = true;
  const ok = await isValid(word).catch(() => false);
  busy = false;
  if (!ok) return toast('Nie ma takiego słowa');

  if (mode === 'daily' && game.guesses.length === 0) {
    stats.daily.played++;
    store.set('stats', stats);
  }
  game.guesses.push(word);
  input = '';
  if (word === game.secret) win();
  save();
  render();
  $(game.solved ? 'win' : 'input').scrollIntoView({ block: 'nearest' });
}

function win() {
  game.solved = true;
  const n = game.guesses.length;
  if (mode === 'daily') {
    const s = stats.daily;
    s.wins++;
    s.guesses += n;
    s.streak = s.lastWin === game.day! - 1 ? s.streak + 1 : 1;
    s.best = Math.max(s.best, s.streak);
    s.lastWin = game.day!;
  } else {
    stats.unlimited.played++;
    stats.unlimited.guesses += n;
  }
  store.set('stats', stats);
}

function hint() {
  if (game.solved) return;
  const unfound = unfoundLetters();
  if (unfound.length) {
    game.hints.revealed.push(unfound[Math.floor(Math.random() * unfound.length)]);
  } else if (!game.hints.greyed) {
    game.hints.greyed = true;
  } else return; // stage 3 (reveal order): TODO, see docs/adr/0005
  game.hints.used++;
  save();
  render();
}

async function share() {
  const title = mode === 'daily' ? `Literki #${game.day}` : 'Literki (bez limitu)';
  const text = `${title} — ${triesText(game.guesses.length)}, ${hintsText(game.hints.used)}\n${location.origin}${import.meta.env.BASE_URL}`;
  try {
    await navigator.clipboard.writeText(text);
    toast('Skopiowano!');
  } catch {
    toast('Nie udało się skopiować');
  }
}

function showStats() {
  const d = stats.daily, u = stats.unlimited;
  const avg = (g: number, n: number) => (n ? (g / n).toFixed(1) : '–');
  const streak = d.lastWin >= today() - 1 ? d.streak : 0;
  $('stats-body').innerHTML = `
    <h3>Dziennie</h3>
    <dl>
      <dt>Rozegrane</dt><dd>${d.played}</dd>
      <dt>Odgadnięte</dt><dd>${d.wins}</dd>
      <dt>Seria</dt><dd>${streak}</dd>
      <dt>Najdłuższa seria</dt><dd>${d.best}</dd>
      <dt>Średnio prób</dt><dd>${avg(d.guesses, d.wins)}</dd>
    </dl>
    <h3>Bez limitu</h3>
    <dl>
      <dt>Odgadnięte</dt><dd>${u.played}</dd>
      <dt>Średnio prób</dt><dd>${avg(u.guesses, u.played)}</dd>
    </dl>`;
  $<HTMLDialogElement>('stats').showModal();
}

// --- setup ---

function buildKeyboard() {
  const rows = ['ąćęłńóśźż', 'qwertyuiop', 'asdfghjkl', '⏎zxcvbnm⌫'];
  $('keyboard').replaceChildren(
    ...rows.map((r) => {
      const row = document.createElement('div');
      for (const c of r) {
        const b = document.createElement('button');
        b.textContent = c;
        if (c === '⏎' || c === '⌫') {
          b.className = 'wide';
          b.ariaLabel = c === '⏎' ? 'Zatwierdź' : 'Usuń';
          b.onclick = c === '⏎' ? submit : backspace;
        } else if (!ALPHABET.includes(c)) {
          b.disabled = true; // q/v/x: kept for a standard layout, no word uses them
          b.className = 'absent';
        } else {
          b.dataset.key = c;
          b.onclick = () => type(c);
        }
        row.append(b);
      }
      return row;
    }),
  );
}

function applyTheme(t?: string) {
  if (t) document.documentElement.dataset.theme = t;
}

buildKeyboard();
applyTheme(store.get<string>('theme'));

document.querySelectorAll<HTMLElement>('.example').forEach((el) =>
  el.replaceWith(tilesEl(scoreGuess(el.dataset.guess!, el.dataset.secret!))),
);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if (k === 'enter') submit();
  else if (k === 'backspace') backspace();
  else if (k.length === 1 && ALPHABET.includes(k)) type(k);
  else return;
  e.preventDefault();
});

document.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((b) =>
  (b.onclick = () => {
    mode = b.dataset.mode as Mode;
    store.set('mode', mode);
    loadGame();
  }),
);
$('hint-btn').onclick = hint;
$('share-btn').onclick = share;
$('again-btn').onclick = async () => {
  mode = 'unlimited';
  game = newGame(await randomSecret());
  input = '';
  save();
  render();
};
$('help-btn').onclick = () => $<HTMLDialogElement>('help').showModal();
$('stats-btn').onclick = showStats;
$('theme-btn').onclick = () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const t = dark ? 'light' : 'dark';
  applyTheme(t);
  store.set('theme', t);
};

if (!store.get('seenHelp')) {
  $<HTMLDialogElement>('help').showModal();
  store.set('seenHelp', true);
}
loadGame();
