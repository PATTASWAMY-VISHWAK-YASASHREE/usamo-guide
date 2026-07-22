export const FIGURES_URL_PREFIX: string;
export function normalizeFigureCode(code: string): string;
export function figureHash(type: 'asy' | 'latex', code: string): string;
export function figureFileName(type: 'asy' | 'latex', code: string): string;
export function figureUrl(type: 'asy' | 'latex', code: string): string;
export function extractFigureBlocks(markdown: string): {
  type: 'asy' | 'latex';
  code: string;
  hash: string;
  fileName: string;
}[];
export function transformFigureBlocks(markdown: string): string;
export function normalizeTexDelimiters(markdown: string): string;
