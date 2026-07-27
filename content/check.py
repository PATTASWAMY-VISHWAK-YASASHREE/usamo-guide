from pathlib import Path
import unicodedata

# Characters that are commonly problematic in source code
SUSPICIOUS = {
    "\u00A0": "NO-BREAK SPACE",
    "\u2000": "EN QUAD",
    "\u2001": "EM QUAD",
    "\u2002": "EN SPACE",
    "\u2003": "EM SPACE",
    "\u2004": "THREE-PER-EM SPACE",
    "\u2005": "FOUR-PER-EM SPACE",
    "\u2006": "SIX-PER-EM SPACE",
    "\u2007": "FIGURE SPACE",
    "\u2008": "PUNCTUATION SPACE",
    "\u2009": "THIN SPACE",
    "\u200A": "HAIR SPACE",
    "\u202F": "NARROW NO-BREAK SPACE",
    "\u205F": "MEDIUM MATHEMATICAL SPACE",
    "\u3000": "IDEOGRAPHIC SPACE",

    "\u200B": "ZERO WIDTH SPACE",
    "\u200C": "ZERO WIDTH NON-JOINER",
    "\u200D": "ZERO WIDTH JOINER",
    "\u2060": "WORD JOINER",
    "\uFEFF": "ZERO WIDTH NO-BREAK SPACE (BOM)",

    "\u2010": "HYPHEN",
    "\u2011": "NON-BREAKING HYPHEN",
    "\u2012": "FIGURE DASH",
    "\u2013": "EN DASH",
    "\u2014": "EM DASH",
    "\u2015": "HORIZONTAL BAR",
    "\u2212": "MINUS SIGN",

    "\u2018": "LEFT SINGLE QUOTE",
    "\u2019": "RIGHT SINGLE QUOTE",
    "\u201C": "LEFT DOUBLE QUOTE",
    "\u201D": "RIGHT DOUBLE QUOTE",

    "\u2026": "HORIZONTAL ELLIPSIS",

    "\u00D7": "MULTIPLICATION SIGN",
    "\u00F7": "DIVISION SIGN",

    "\u2217": "ASTERISK OPERATOR",
    "\u2218": "RING OPERATOR",
    "\u2219": "BULLET OPERATOR",

    "\uFF08": "FULLWIDTH LEFT PARENTHESIS",
    "\uFF09": "FULLWIDTH RIGHT PARENTHESIS",
    "\uFF0C": "FULLWIDTH COMMA",
    "\uFF1A": "FULLWIDTH COLON",
    "\uFF1B": "FULLWIDTH SEMICOLON",
}

filename = r"content\\asy_blocks_copy.txt"

text = Path(filename).read_text(encoding="utf-8")

found = False

for line_no, line in enumerate(text.splitlines(), 1):
    for col_no, ch in enumerate(line, 1):
        if ch in SUSPICIOUS:
            found = True
            print(
                f"Line {line_no:4}, Col {col_no:3}: "
                f"U+{ord(ch):04X} "
                f"{SUSPICIOUS[ch]}"
            )
            print(f"    Context: {repr(line)}")
            print()

if not found:
    print("No suspicious Unicode characters found.")