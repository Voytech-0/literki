# 6. Feedback algorithm

Letroso's scoring is unpublished; we define our own, aiming to match its observable behaviour:

1. Align guess and secret by longest common subsequence → matched letters are *in order*. Ties: most joined pairs, then start/end matches.
2. Matched letters adjacent in both guess and secret are *joined* (one connected shape).
3. *Start marker*: guess's first letter matched to secret's first letter. *End marker*: same for last letters.
4. Unmatched guess letters still in the secret, up to the remaining count of that letter, are *out of order*; the rest are absent.
5. Solved ⇔ guess = secret.

Lives behind `scoreGuess(guess, secret)`; unit-tested with Vitest against Letroso's help examples (adapted).
