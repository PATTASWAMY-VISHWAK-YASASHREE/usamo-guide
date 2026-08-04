# Problem LaTeX & Figures (Asymptote) Guide

How to put math, diagrams, and LaTeX-only constructs (TikZ, tables, …) into
problems in `content/**/*.problems.json`.

**TL;DR:** paste AoPS `[asy]...[/asy]` / `[latex]...[/latex]` blocks straight
into a problem's markdown, run `yarn compile:figures`, commit the JSON plus the
SVGs it generates under `static/generated/figures/`. Done.

---

## 1. Plain math (no compiling needed)

Regular math renders client-side with KaTeX — nothing to compile or commit:

- Inline: `$x^2 + y^2$` or `\(x^2 + y^2\)`
- Display: `$$\sum_{k=1}^n k$$` or `\[\sum_{k=1}^n k\]`

KaTeX runs with `strict: false` plus aliases for common AoPS macros
(`\overarc`, `\arc`, `\degree`) — see `KATEX_OPTIONS` in
`src/components/ProblemPage/ProblemStatementMarkdown.tsx`. If a statement uses
a macro KaTeX doesn't know, either add an alias there or rewrite the macro in
the JSON.

Use figure blocks (below) only for things KaTeX **can't** do: diagrams,
TikZ pictures, real `tabular` tables, and other full-LaTeX constructs.

## 2. Where figure blocks can go

Any markdown-bearing field of a problem:

- `statement`
- `solutionReveal.markdown`
- `solutionMetadata.sketch`
- each entry of `interaction.choices[]`

## 3. Writing the blocks

Two block types, written inline in the markdown exactly as they appear on AoPS.
Fenced code blocks (` ```asy ` / ` ```latex `) work identically.

### `[asy]` — Asymptote diagrams

```
[asy]
import olympiad;
size(150);
pair A = (0,0), B = (4,0), C = (1,3);
draw(A--B--C--cycle);
draw(circumcircle(A,B,C));
label("$A$", A, SW);
label("$B$", B, SE);
label("$C$", C, N);
[/asy]
```

The repo-root `asy/` directory is on the Asymptote search path and vendors the
AoPS packages `olympiad.asy` and `cse5.asy`, so diagrams pasted from AoPS that
use `import olympiad;` or `import cse5;` compile as-is. Drop additional `.asy`
modules into that directory if a pasted diagram needs one.

### `[latex]` — anything beyond KaTeX

```
[latex]
\begin{tikzpicture}
  \draw[->] (0,0) -- (3,0) node[right] {$x$};
  \draw[->] (0,0) -- (0,3) node[above] {$y$};
  \draw[thick, domain=0:2.5] plot (\x, {\x*\x/2.5});
\end{tikzpicture}
[/latex]
```

The block body is dropped into a `standalone` document with these preloaded —
don't write `\documentclass` or `\begin{document}` yourself:

- `amsmath`, `amssymb`, `amsfonts`, `mathtools`
- `array`, `tabularx`, `multirow`, `booktabs`
- `tikz` with libraries `arrows.meta`, `calc`, `angles`, `quotes`,
  `intersections`, `patterns`, `decorations.markings`

If a figure needs another package or TikZ library, add it to `LATEX_TEMPLATE`
in `scripts/compile-figures.mjs` (it applies to every `[latex]` block, so keep
it general).

**Escaping note:** these blocks live inside JSON strings, so every backslash
must be doubled (`\\draw`, `\\begin{tikzpicture}`) and newlines written as
`\n`, like any other string in the file.

## 4. Compiling

```bash
yarn compile:figures            # compile anything new (cheap, run any time)
yarn compile:figures --force    # recompile everything, ignoring the cache
yarn compile:figures --prune    # also delete SVGs no longer referenced
yarn compile:figures --strict   # exit non-zero if any figure fails (for checks)
```

The script scans every `content/**/*.problems.json`, extracts figure blocks,
and compiles each **unique** block once (deduplicated by content hash, in
parallel) to `static/generated/figures/<type>-<contenthash>.svg`. Already-
compiled figures are skipped, so re-runs only build what's new.

On failure it prints the offending figure's file name, the last few lines of
compiler output, and which problem uses it (as `file#uniqueId`). The site shows
a neutral placeholder card for any uncompiled figure — never a broken image —
so shipping first and fixing figures later is safe.

`manifest.json` in the output directory maps each SVG back to its type,
referencing problems, and compile status. It's a debugging aid; the client
never reads it.

### Commit the SVGs

**Commit `static/generated/figures/` along with the JSON.** Vercel/CI have no
TeX install — deploys just serve the committed SVGs, and the compile script
exits cleanly (success) when TeX is absent so it never breaks CI.

## 5. Local requirements (figure authors/importers only)

Only people compiling figures need these; everyone else just consumes the
committed SVGs.

- A TeX distribution providing `asy`, `latex`, and `dvisvgm`
  (MacTeX or TeX Live)
- The Ghostscript **library**: `brew install ghostscript`. dvisvgm needs
  `libgs.dylib`, not just the `gs` binary; the script auto-detects common
  Homebrew/Linux paths, or set `LIBGS=/path/to/libgs.dylib` explicitly.

## 6. Typical workflows

### Adding or editing one problem

1. Write the problem in its `.problems.json`, leaving `[asy]`/`[latex]` blocks
   inline in the markdown.
2. `yarn compile:figures`
3. Check the figure renders (`yarn start`, open the problem).
4. Commit the JSON **and** the new SVG(s).

Editing a figure's code changes its content hash, so it compiles to a *new*
SVG file. Run with `--prune` occasionally to clear out orphaned old ones.

### Bulk imports (3000+ problems)

1. Import problems with their figure blocks left inline — no preprocessing.
2. Run `yarn compile:figures` once; unique figures compile in parallel and are
   cached by hash, so re-runs only build new ones.
3. Fix any reported failures (the log names the problem via `file#uniqueId`),
   or ship with placeholders and fix later.
4. Commit the JSON and `static/generated/figures/`.

## 7. How it works (for the curious)

Both the compile script and the client hash `type + '\0' + normalized code`
with FNV-1a 64-bit (`src/utils/problemFigures.js`) to get the SVG filename. At
render time the client rewrites each block to
`![figure](/generated/figures/<type>-<hash>.svg)` — same hash, so no manifest
lookup or network round-trip is needed to resolve figures. Normalization
(CRLF → LF, trim) means whitespace-only edits don't change the hash, but any
real edit to the code produces a new filename.

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `! Missing asy, latex, dvisvgm — skipping compilation` | Install MacTeX/TeX Live, re-run. (This is a warning, not an error — intentional so CI passes.) |
| `! Ghostscript library (libgs) not found` / figures render with missing strokes | `brew install ghostscript`, or set `LIBGS=/path/to/libgs.dylib`. |
| Figure shows the placeholder card on the site | It hasn't been compiled yet — run `yarn compile:figures` and commit the SVG. |
| Asymptote error about a missing module | Vendor the `.asy` file into `asy/` at the repo root. |
| LaTeX error about a missing package/library | Add it to `LATEX_TEMPLATE` in `scripts/compile-figures.mjs`. |
| Compile fails and you can't tell which problem | The error line reads `✗ <file>.svg — used by <path>.problems.json#<uniqueId>`; `manifest.json` lists all refs. |
| Edited a figure but the site shows the old one | The edit created a new hash/SVG — recompile; if the *site* still shows stale, hard-refresh (SVGs are content-addressed, so caching is safe). |
| A figure hangs forever | Compiles are killed after 90 s; look for an infinite loop in the Asymptote code. |
