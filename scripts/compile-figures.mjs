#!/usr/bin/env node
/**
 * Compile AoPS-style [asy]...[/asy] and [latex]...[/latex] figure blocks
 * found in content/**\/*.problems.json and in module content
 * (content/**\/*.mdx, *.md) into SVGs under static/generated/figures/,
 * named by content hash (see src/utils/problemFigures.js).
 * Already-compiled figures are skipped, so this is cheap to re-run after
 * adding problems or modules.
 *
 * Requirements (local only — compiled SVGs are committed, so CI/Vercel
 * never needs TeX):
 *   - Asymptote (`asy`) for [asy] blocks
 *   - `latex` + `dvisvgm` for [latex] blocks
 *   Both ship with MacTeX / TeX Live.
 *
 * Usage:
 *   node scripts/compile-figures.mjs [--force] [--prune] [--strict]
 *     --force   recompile everything, ignoring the cache
 *     --prune   delete SVGs no longer referenced by any problem
 *     --strict  exit non-zero if any figure fails to compile
 */
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { extractFigureBlocks } = require('../src/utils/problemFigures.js');

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_DIR = path.join(ROOT, 'static', 'generated', 'figures');
const ASY_MODULES_DIR = path.join(ROOT, 'asy');
const COMPILE_TIMEOUT_MS = 90_000;

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const PRUNE = args.has('--prune');
const STRICT = args.has('--strict');

const LATEX_TEMPLATE = (body) => `\\documentclass[preview,border=4pt]{standalone}
\\usepackage{amsmath,amssymb,amsfonts,mathtools}
\\usepackage{array,tabularx,multirow,booktabs}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,calc,angles,quotes,intersections,patterns,decorations.markings}
\\begin{document}
${body}
\\end{document}
`;

function findFiles(dir, matches) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findFiles(full, matches));
    else if (matches(entry.name)) out.push(full);
  }
  return out;
}

const isProblemsJson = (name) => name.endsWith('.problems.json');
const isMarkdown = (name) => name.endsWith('.mdx') || name.endsWith('.md');

/** Every markdown-bearing field of a problem object. */
function markdownFieldsOf(problem) {
  const fields = [problem.statement];
  if (problem.solutionReveal?.markdown) fields.push(problem.solutionReveal.markdown);
  if (problem.solutionMetadata?.sketch) fields.push(problem.solutionMetadata.sketch);
  if (Array.isArray(problem.interaction?.choices)) fields.push(...problem.interaction.choices);
  return fields.filter((f) => typeof f === 'string');
}

function collectFigures() {
  /** @type {Map<string, {type: string, code: string, fileName: string, refs: string[]}>} */
  const figures = new Map();

  const add = (markdown, ref) => {
    for (const fig of extractFigureBlocks(markdown)) {
      const existing = figures.get(fig.fileName);
      if (existing) existing.refs.push(ref);
      else figures.set(fig.fileName, { ...fig, refs: [ref] });
    }
  };

  // Problem bank: figures live inside markdown-bearing fields of each problem.
  for (const file of findFiles(CONTENT_DIR, isProblemsJson)) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.warn(`! Skipping unparseable ${path.relative(ROOT, file)}: ${e.message}`);
      continue;
    }
    for (const [key, value] of Object.entries(data)) {
      if (!Array.isArray(value)) continue;
      for (const problem of value) {
        if (!problem || typeof problem !== 'object') continue;
        const ref = `${path.relative(ROOT, file)}#${problem.uniqueId ?? key}`;
        for (const md of markdownFieldsOf(problem)) add(md, ref);
      }
    }
  }

  // Module content: figures are written inline in the MDX body.
  for (const file of findFiles(CONTENT_DIR, isMarkdown)) {
    add(fs.readFileSync(file, 'utf8'), path.relative(ROOT, file));
  }

  return figures;
}

async function hasBinary(name) {
  try {
    await execFileAsync('which', [name]);
    return true;
  } catch {
    return false;
  }
}

/**
 * dvisvgm (used directly for [latex] blocks and internally by asy for SVG
 * output) renders PostScript specials through the Ghostscript *library*,
 * not the gs binary. Locate libgs so figures with drawing commands work.
 */
function findLibgs() {
  if (process.env.LIBGS) return process.env.LIBGS;
  const candidates = [
    '/opt/homebrew/opt/ghostscript/lib/libgs.dylib',
    '/usr/local/opt/ghostscript/lib/libgs.dylib',
    '/usr/local/lib/libgs.dylib',
    '/usr/lib/x86_64-linux-gnu/libgs.so.10',
    '/usr/lib/x86_64-linux-gnu/libgs.so.9',
    '/usr/lib/libgs.so',
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? '';
}

const LIBGS = findLibgs();

function compileEnv() {
  return {
    ...process.env,
    ...(LIBGS && { LIBGS }),
    // Allow repo-local Asymptote modules (olympiad.asy, cse5.asy, ...) in asy/
    ...(fs.existsSync(ASY_MODULES_DIR) && { ASYMPTOTE_DIR: ASY_MODULES_DIR }),
  };
}

/**
 * AoPS implicitly imports olympiad/cse5 into every [asy] block, so pasted
 * sources use `origin`, `anglemark`, `MP`, ... with no import line and fail
 * to compile standalone. We try preludes in order rather than always
 * prepending one, because each import also shadows names: `geometry`
 * recovers figures using `circle`/`triangle` types, but makes `origin`
 * ambiguous and clashes with `graph`'s xaxis/yaxis overloads. First prelude
 * that yields an SVG wins; the empty one keeps sources that already compile
 * standalone byte-identical to what they produced before.
 */
const ASY_PRELUDES = [
  '',
  'import olympiad;\nimport cse5;\n',
  'import olympiad;\nimport cse5;\nimport geometry;\n',
];

async function runAsy(workDir) {
  // Note: asy appends the format extension itself, so -o must be "fig".
  await execFileAsync('asy', ['-f', 'svg', '-noView', '-o', 'fig', 'fig.asy'], {
    cwd: workDir,
    timeout: COMPILE_TIMEOUT_MS,
    env: compileEnv(),
  });
}

async function compileAsy(fig, workDir) {
  const src = path.join(workDir, 'fig.asy');
  const svg = path.join(workDir, 'fig.svg');
  let firstError;

  for (const prelude of ASY_PRELUDES) {
    // asy can exit non-zero having already written a truncated SVG, and can
    // exit zero writing none at all (a picture with nothing drawn). Clear it
    // so each attempt is judged only on what it produces.
    fs.rmSync(svg, { force: true });
    fs.writeFileSync(src, prelude + fig.code + '\n');
    try {
      await runAsy(workDir);
      if (fs.existsSync(svg)) return svg;
    } catch (e) {
      // Report the bare attempt's error: it names the actual missing symbol,
      // whereas a prelude's error is usually a knock-on from the imports.
      firstError ??= e;
    }
  }
  throw firstError ?? new Error('compiler produced no SVG');
}

async function compileLatex(fig, workDir) {
  fs.writeFileSync(path.join(workDir, 'fig.tex'), LATEX_TEMPLATE(fig.code));
  await execFileAsync('latex', ['-interaction=nonstopmode', '-halt-on-error', 'fig.tex'], {
    cwd: workDir,
    timeout: COMPILE_TIMEOUT_MS,
    env: compileEnv(),
  });
  await execFileAsync('dvisvgm', ['--no-fonts', '-o', 'fig.svg', 'fig.dvi'], {
    cwd: workDir,
    timeout: COMPILE_TIMEOUT_MS,
    env: compileEnv(),
  });
  return path.join(workDir, 'fig.svg');
}

async function compileOne(fig) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'usamo-fig-'));
  try {
    const svg = fig.type === 'asy' ? await compileAsy(fig, workDir) : await compileLatex(fig, workDir);
    if (!fs.existsSync(svg)) throw new Error('compiler produced no SVG');
    fs.copyFileSync(svg, path.join(OUT_DIR, fig.fileName));
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function runPool(tasks, concurrency) {
  const failures = [];
  let done = 0;
  const queue = [...tasks];
  async function worker() {
    while (queue.length) {
      const fig = queue.shift();
      try {
        await compileOne(fig);
        done++;
        console.log(`  ✓ ${fig.fileName} (${done}/${tasks.length})`);
      } catch (e) {
        const stderr = (e.stderr || e.stdout || e.message || '').toString();
        failures.push({ fig, error: stderr });
        console.error(`  ✗ ${fig.fileName} — used by ${fig.refs[0]}`);
        console.error(
          stderr
            .split('\n')
            .filter((l) => l.trim())
            .slice(-8)
            .map((l) => `      ${l}`)
            .join('\n')
        );
      }
    }
  }
  const n = Math.max(1, Math.min(concurrency, tasks.length));
  await Promise.all(Array.from({ length: n }, worker));
  return failures;
}

async function main() {
  const figures = collectFigures();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const existing = new Set(fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.svg')));
  const pending = [...figures.values()].filter((f) => FORCE || !existing.has(f.fileName));

  console.log(
    `Found ${figures.size} figure block(s) across the problem bank and modules; ` +
      `${pending.length} need compiling.`
  );

  if (PRUNE) {
    for (const f of existing) {
      if (!figures.has(f)) {
        fs.rmSync(path.join(OUT_DIR, f));
        console.log(`  pruned orphan ${f}`);
      }
    }
  }

  let failures = [];
  if (pending.length > 0) {
    const needAsy = pending.some((f) => f.type === 'asy');
    const needLatex = pending.some((f) => f.type === 'latex');
    const missing = [];
    if (needAsy && !(await hasBinary('asy'))) missing.push('asy');
    if (needLatex && !(await hasBinary('latex'))) missing.push('latex');
    if (needLatex && !(await hasBinary('dvisvgm'))) missing.push('dvisvgm');
    if (missing.length) {
      console.warn(
        `! Missing ${missing.join(', ')} — skipping compilation of ${pending.length} figure(s).\n` +
          '! Install a TeX distribution (e.g. MacTeX) and re-run `yarn compile:figures`.'
      );
      process.exit(0); // never fail CI environments without TeX
    }

    if (!LIBGS) {
      console.warn(
        '! Ghostscript library (libgs) not found — figures with PostScript/drawing\n' +
          '! content may render incompletely. Install it with `brew install ghostscript`.'
      );
    }
    const concurrency = Math.min(8, Math.max(1, os.cpus().length - 1));
    failures = await runPool(pending, concurrency);
  }

  // Manifest maps each SVG back to its source + referencing problems (debugging aid).
  const manifest = Object.fromEntries(
    [...figures.entries()].map(([fileName, f]) => [
      fileName,
      { type: f.type, refs: f.refs, compiled: fs.existsSync(path.join(OUT_DIR, fileName)) },
    ])
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );

  if (failures.length) {
    console.error(`\n${failures.length} figure(s) failed to compile (see errors above).`);
    if (STRICT) process.exit(1);
  } else if (pending.length) {
    console.log('All figures compiled successfully.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
