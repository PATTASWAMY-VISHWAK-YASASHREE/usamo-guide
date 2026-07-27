/**
 * Shared logic for AoPS-style figure blocks embedded in problem markdown.
 *
 * Problem statements/solutions may contain:
 *   [asy] ...Asymptote code... [/asy]
 *   [latex] ...full LaTeX (tikz, tabular, etc.)... [/latex]
 * plus fenced variants (```asy / ```latex).
 *
 * These blocks are compiled offline to SVG by `scripts/compile-figures.mjs`
 * (run `yarn compile:figures`; requires a TeX distribution with `asy`,
 * `latex`, and `dvisvgm`). The compiled SVGs are committed under
 * `static/generated/figures/` and named by a content hash, so the client can
 * rewrite a block to its image URL without any manifest lookup.
 *
 * This file is plain CommonJS so it can be consumed both by webpack (via the
 * sibling .d.ts) and by the Node compile script.
 */

const FIGURES_URL_PREFIX = '/generated/figures/';

const BLOCK_PATTERNS = [
  { type: 'asy', regex: /\[asy\]([\s\S]*?)\[\/asy\]/g },
  { type: 'latex', regex: /\[latex\]([\s\S]*?)\[\/latex\]/g },
  { type: 'asy', regex: /```asy\n([\s\S]*?)```/g },
  { type: 'latex', regex: /```latex\n([\s\S]*?)```/g },
];

/** Normalize figure source so JSON round-trips hash identically. */
function normalizeFigureCode(code) {
  return code.replace(/\r\n/g, '\n').trim();
}

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const FNV_MASK = 0xffffffffffffffffn;

/**
 * FNV-1a 64-bit over `type + '\0' + normalized code`. Chosen over a crypto
 * hash because it is synchronous in the browser (crypto.subtle is async);
 * 64 bits is ample for the size of the problem bank.
 */
function figureHash(type, code) {
  const s = type + '\u0000' + normalizeFigureCode(code);
  let h = FNV_OFFSET;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * FNV_PRIME) & FNV_MASK;
  }
  return h.toString(16).padStart(16, '0');
}

function figureFileName(type, code) {
  return `${type}-${figureHash(type, code)}.svg`;
}

function figureUrl(type, code) {
  return FIGURES_URL_PREFIX + figureFileName(type, code);
}

/**
 * Extract every figure block from a markdown string.
 * @returns {{type: 'asy'|'latex', code: string, hash: string, fileName: string}[]}
 */
function extractFigureBlocks(markdown) {
  if (!markdown) return [];
  const out = [];
  for (const { type, regex } of BLOCK_PATTERNS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(markdown)) !== null) {
      const code = normalizeFigureCode(m[1]);
      if (!code) continue;
      out.push({ type, code, hash: figureHash(type, code), fileName: figureFileName(type, code) });
    }
  }
  return out;
}

/**
 * Replace every figure block with a block-level markdown image pointing at
 * its compiled SVG. Safe to run on strings without figure blocks.
 */
function transformFigureBlocks(markdown) {
  if (!markdown) return markdown;
  let result = markdown;
  for (const { type, regex } of BLOCK_PATTERNS) {
    result = result.replace(regex, (match, code) => {
      if (!normalizeFigureCode(code)) return '';
      return `\n\n![figure](${figureUrl(type, code)})\n\n`;
    });
  }
  return result;
}

/**
 * Convert LaTeX \( ... \) and \[ ... \] delimiters into the $ / $$ forms
 * remark-math understands. Lookbehinds skip `\\[2pt]`-style spacing args
 * (the bracket there is preceded by a second backslash).
 */
function normalizeTexDelimiters(markdown) {
  if (!markdown) return markdown;
  return markdown
    .replace(/(?<!\\)\\\[([\s\S]*?)(?<!\\)\\\]/g, (_m, tex) => `$$${tex}$$`)
    .replace(/(?<!\\)\\\(([\s\S]*?)(?<!\\)\\\)/g, (_m, tex) => `$${tex}$`);
}

module.exports = {
  FIGURES_URL_PREFIX,
  normalizeFigureCode,
  figureHash,
  figureFileName,
  figureUrl,
  extractFigureBlocks,
  transformFigureBlocks,
  normalizeTexDelimiters,
};
