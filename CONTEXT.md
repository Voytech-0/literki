# Literki

Polish clone of [Letroso](https://letroso.com/en/). Static site on GitHub Pages. UI in Polish only.

## Glossary

- **Secret word** — word to find; 4–10 letters, base form (lemma).
- **Guess** — any word on the valid guess list, 2–10 letters. Unlimited guesses; counted.
- **Valid guess list** — SJP.pl game list (inflected forms included).
- **Secret list** — SJP base forms, 4–10 letters, top ~3–5k by frequency, manually skimmed.
- **Letter** — Polish alphabet; ą ć ę ł ń ó ś ź ż are distinct letters, never folded.
- **In order** — letter is in the secret word, consistent with order of other marked letters.
- **Joined** — adjacent guess letters that are also adjacent in the secret word; rendered as one connected shape.
- **Out of order** — letter is in the secret word but breaks the order.
- **Start / end marker** — shows the secret word begins / ends with the marked letters.
- **Daily** — one secret word per day, rollover at midnight Europe/Warsaw.
- **Unlimited** — random secret word, play again freely.
- **Hint** — staged help, counted. Stage 1: reveal one present letter (no position). Stage 2: grey out every absent letter on the keyboard. Stage 3: reveal order (TODO).
- **Share text** — `Literki #N — X prób, Y podpowiedzi` + URL. No emoji grid.
- **Day number (#N)** — days since first deploy, starting at 1.

- **Feedback algorithm** — how a guess maps to in order / joined / out of order / markers. See docs/adr/0006.

Game state (Daily and Unlimited) persists in localStorage across reloads; Unlimited never draws today's Daily word. "Jak grać" modal on first visit, reopenable via ?.

Hosted at https://voytech-0.github.io/literki (repo `Voytech-0/literki`).
