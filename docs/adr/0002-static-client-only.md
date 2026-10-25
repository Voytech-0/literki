# 2. Static, client-only app on GitHub Pages

Vite + TypeScript, vanilla DOM, deployed by GitHub Actions. No server, so the daily word is chosen in the browser: seeded shuffle of the secret list indexed by days since launch (day #1 = 2026-10-25) (Europe/Warsaw). Anyone reading the source can spoil it — accepted.

The ~1.16M-word guess list (11 MB) is split per first letter into `public/words/<codepoint>.txt` and fetched on demand.
