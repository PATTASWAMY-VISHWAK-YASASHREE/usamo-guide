import json
import re
from functools import lru_cache
from tqdm import tqdm

INPUT_JSON = "extraProblems.json"
OUTPUT_JSON = "fixed.json"
DICTIONARY = "words_alpha.txt"      # Download this once

MIN_WORD_LENGTH = 8
MAX_WORD_LENGTH = 30

# ----------------------------------------------------------
# Load dictionary
# ----------------------------------------------------------

with open(DICTIONARY, encoding="utf8") as f:
    WORDS = {w.strip().lower() for w in f if w.strip()}

# Add math words

WORDS |= {
    "pythagorean",
    "vieta",
    "binomial",
    "quartic",
    "quadratic",
    "quadrilateral",
    "isosceles",
    "complementary",
    "counterclockwise",
    "clockwise",
    "bijection",
    "injective",
    "surjective",
    "homeomorphism",
    "eigenvalue",
    "eigenvector",
    "modulo",
    "logarithmic",
    "exponential",
    "denominator",
    "numerator",
    "perpendicular",
    "hypotenuse",
    "centroid",
    "circumcenter",
    "orthocenter",
    "incenter",
    "tetrahedron",
    "icosahedron",
    "parallelogram",
    "combinatorial",
    "polynomial",
    "multinomial",
    "factorization",
    "asymptote",
    "bijections",
    "congruence",
    "coprime",
    "totient",
}

# ----------------------------------------------------------
# Regexes
# ----------------------------------------------------------

PROTECT = re.compile(
    r'(\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|https?://\S+)',
    re.DOTALL
)

WORD_RE = re.compile(r"[A-Za-z]+")


# ----------------------------------------------------------
# Word segmentation
# ----------------------------------------------------------

@lru_cache(None)
def segment(word):

    word_lower = word.lower()

    if word_lower in WORDS:
        return [word]

    n = len(word)

    dp = [None] * (n + 1)
    dp[0] = []

    for i in range(n):

        if dp[i] is None:
            continue

        for j in range(i + 1, min(i + MAX_WORD_LENGTH + 1, n + 1)):

            piece = word_lower[i:j]

            if piece in WORDS:

                candidate = dp[i] + [word[i:j]]

                if dp[j] is None or len(candidate) < len(dp[j]):
                    dp[j] = candidate

    return dp[n]


# ----------------------------------------------------------
# Protect LaTeX
# ----------------------------------------------------------

def protect(text):

    saved = []

    def repl(m):
        saved.append(m.group())
        return f"§§{len(saved)-1}§§"

    return PROTECT.sub(repl, text), saved


def restore(text, saved):

    for i, s in enumerate(saved):
        text = text.replace(f"§§{i}§§", s)

    return text


# ----------------------------------------------------------
# Fix one string
# ----------------------------------------------------------

changes = 0


def fix_string(text):

    global changes

    text, saved = protect(text)

    def repl(m):

        global changes

        token = m.group()

        if len(token) < MIN_WORD_LENGTH:
            return token

        if token.lower() in WORDS:
            return token

        result = segment(token)

        if result is None:
            return token

        fixed = " ".join(result)

        if fixed != token:
            changes += 1

        return fixed

    text = WORD_RE.sub(repl, text)

    return restore(text, saved)


# ----------------------------------------------------------
# Recursive JSON traversal
# ----------------------------------------------------------

def walk(obj):

    if isinstance(obj, dict):
        return {k: walk(v) for k, v in obj.items()}

    if isinstance(obj, list):
        return [walk(x) for x in obj]

    if isinstance(obj, str):
        return fix_string(obj)

    return obj


# ----------------------------------------------------------
# Run
# ----------------------------------------------------------

with open(INPUT_JSON, encoding="utf8") as f:
    data = json.load(f)

fixed = walk(data)

print("Writing...")

with open(OUTPUT_JSON, "w", encoding="utf8") as f:
    json.dump(fixed, f, ensure_ascii=False, indent=2)

print("Done.")
print("Corrections:", changes)