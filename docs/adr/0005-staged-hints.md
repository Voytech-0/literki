# 5. Staged hints

Letroso's hint behaviour is unknown; ours is our own design, escalating:

1. Each hint reveals one present letter, without its position, until every present letter is known.
2. The next hint greys out every absent letter on the keyboard.
3. Further hints reveal order — TODO, not in weekend scope.

A letter is *found* once shown present by a guess or revealed by a hint; stage 1 only picks unfound letters, and skips to stage 2 when none remain. Unique letters only — no occurrence counts (kasza → A, K, S, Z). Revealed/present letters are coloured on the keyboard; no separate strip. Keyboard: present colour once any guess marks the letter (in order / joined / out of order) or a hint reveals it; guessed absent letters grey immediately; stage 2 greys the remaining untyped absent letters. Keys carry no order info. After stage 2 the hint button is disabled ("Więcej podpowiedzi wkrótce").

Hints used are counted in stats and share text.
