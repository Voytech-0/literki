"""Build word lists into public/.

Usage: python3 scripts/build_words.py <dir with slowa.txt, odm.txt, pl_50k.txt>

Sources:
  slowa.txt  https://sjp.pl/sl/growy/   (CC BY 4.0)
  odm.txt    https://sjp.pl/sl/odmiany/ (CC BY 4.0)
  pl_50k.txt https://github.com/hermitdave/FrequencyWords (CC BY-SA 4.0, ranking only)
"""
import sys
from collections import defaultdict
from pathlib import Path

ALPHABET = "aąbcćdeęfghijklłmnńoóprsśtuwyzźż"
SECRET_COUNT = 4000
BLOCK = ["kurw", "chuj", "huj", "pierd", "jeb", "pizd", "cip", "kutas", "dup", "sra", "szmat",
         "cwel", "pedał", "pedzio", "ciota", "dziwk", "fiut", "zjeb", "suka", "gówn", "szczy",
         "ruch", "rucha", "spust", "nazis", "murzyn", "żyd", "cygan", "debil", "idiot", "kretyn", "porno", "seks"]

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "public" / "words"
out.mkdir(parents=True, exist_ok=True)

ok = lambda w: all(c in ALPHABET for c in w)
guesses = {w for w in (l.strip() for l in open(src / "slowa.txt", encoding="utf-8")) if 2 <= len(w) <= 10 and ok(w)}

by_first = defaultdict(list)
for w in guesses:
    by_first[w[0]].append(w)
for c, ws in by_first.items():
    (out / f"{ord(c)}.txt").write_text("\n".join(sorted(ws)), encoding="utf-8")

freq = {}
for line in open(src / "pl_50k.txt", encoding="utf-8"):
    w, n = line.split()
    freq[w] = int(n)

score = defaultdict(int)
owners = defaultdict(set)  # form -> lemmas listing it as an inflection
for line in open(src / "odm.txt", encoding="utf-8"):
    forms = [f.strip() for f in line.split(",")]
    lemma = forms[0]
    score[lemma] += sum(freq.get(f, 0) for f in set(forms))
    for f in forms[1:]:
        if f != lemma:
            owners[f].add(lemma)

# Some odm lines start with an inflected form (kina, biedna); drop those in favour of the real lemma.
def is_secret(w):
    return (4 <= len(w) <= 10 and ok(w) and w in guesses and not any(b in w for b in BLOCK)
            and freq.get(w, 0) >= 100 and not any(score[o] >= score[w] for o in owners[w]))

secrets = sorted(filter(is_secret, score), key=score.get, reverse=True)[:SECRET_COUNT]
(out.parent / "secrets.txt").write_text("\n".join(sorted(secrets)), encoding="utf-8")
print(f"{len(guesses)} guesses in {len(by_first)} files, {len(secrets)} secrets")
