import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const readProblems = file =>
  JSON.parse(
    fs.readFileSync(
      new URL(`../content/1_Foundations/${file}`, import.meta.url),
      'utf8'
    )
  );

const vennProblems = readProblems('Venn_Diagrams_Sets.problems.json');
const countingProblems = readProblems('Counting_Fundamentals.problems.json');

test('2025 AMC 8 Problem 16 links to its own AoPS page', () => {
  const problem = vennProblems.practice.find(
    ({ uniqueId }) => uniqueId === 'amc8-2025-16'
  );

  assert.ok(problem);
  assert.equal(
    problem.url,
    'https://artofproblemsolving.com/wiki/index.php?title=2025_AMC_8_Problems/Problem_16'
  );
});

test('the duplicate grid-coloring record does not claim Problem 16', () => {
  const problem = countingProblems.practice.find(({ statement }) =>
    statement.startsWith('Kei draws a $6')
  );

  assert.deepEqual(
    {
      uniqueId: problem?.uniqueId,
      name: problem?.name,
      url: problem?.url,
    },
    {
      uniqueId: 'amc8-2025-15',
      name: 'Problem 15 (2025 AMC 8)',
      url: 'https://artofproblemsolving.com/wiki/index.php?title=2025_AMC_8_Problems/Problem_15',
    }
  );
});
