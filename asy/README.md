# Asymptote modules

Repo-local Asymptote modules made available to `[asy]...[/asy]` figure blocks
in `*.problems.json` (the compile script points `ASYMPTOTE_DIR` here).

- `olympiad.asy` — Olympiad Asymptote Package by Maria Monks and the AoPS
  community. Widely used in AoPS wiki diagrams (`import olympiad;`).
- `cse5.asy` — AoPS CSE5 package (`import cse5;`), used by many AoPS
  community diagrams.

Both vendored from https://github.com/vEnhance/dotfiles (`dot/asy/`), which
mirrors the packages distributed by AoPS
(https://artofproblemsolving.com/wiki/index.php/Asymptote:_Macros_and_Packages).

Drop additional `.asy` modules here if imported problems need them.
