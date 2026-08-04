import { slug } from 'github-slugger';
import * as defaultOrdering from '../../content/ordering';
// source -> [base URL, description, solution instructions]
export const probSources = {
  'AMC 8': [
    'https://artofproblemsolving.com/wiki/index.php/AMC_8',
    'AMC 8 (Mathematical Association of America)',
    'Most official solutions are compiled on the AoPS wiki for the contest year.',
  ],
  'AMC 10': [
    'https://artofproblemsolving.com/wiki/index.php/AMC_10',
    'AMC 10 (Mathematical Association of America)',
    'Most official solutions are compiled on the AoPS wiki for the contest year.',
  ],
  'AMC 12': [
    'https://artofproblemsolving.com/wiki/index.php/AMC_12',
    'AMC 12 (Mathematical Association of America)',
    'Most official solutions are compiled on the AoPS wiki for the contest year.',
  ],
  AIME: [
    'https://artofproblemsolving.com/wiki/index.php/AIME',
    'American Invitational Mathematics Examination',
    'Most official solutions are compiled on the AoPS wiki for the contest year.',
  ],
  USAMO: [
    'https://artofproblemsolving.com/wiki/index.php/USAMO',
    'United States of America Mathematical Olympiad',
    'Official solutions and discussions are archived on the AoPS wiki.',
  ],
  'AoPS Wiki': [
    'https://artofproblemsolving.com/wiki/index.php',
    'Art of Problem Solving Wiki',
    'The AoPS wiki often includes multiple solutions and commentary.',
  ],
  MAA: [
    'https://www.maa.org/math-competitions',
    'Mathematical Association of America',
  ],
  Custom: ['https://usamo.guide/', 'Custom Problem (USAMO Guide)'],
};

/** Raw `interaction` object in `.problems.json` */
export type ProblemInteractionMetadata = {
  type?: 'none' | 'integer' | 'mcq';
  correct?: string | number;
  choices?: string[];
  /** Zero-based index into `choices` */
  correctIndex?: number;
};

/** Raw `solutionReveal` object in `.problems.json` */
export type ProblemSolutionRevealMetadata = {
  mode?: 'external' | 'inline';
  /** Defaults to the problem `url` when mode is external */
  url?: string;
  markdown?: string;
};

export type ProblemInteraction =
  | { type: 'none' }
  | { type: 'integer'; correct: string }
  | { type: 'mcq'; choices: string[]; correctIndex: number };

export type ProblemSolutionReveal =
  | { mode: 'external'; url: string }
  | { mode: 'inline'; markdown: string };

export type ProblemInfo = {
  /**
   * Unique ID of the problem. See Content Documentation.md for more info
   */
  uniqueId: string;
  name: string;
  url: string;
  /**
   * Source of the problem. See probSources for descriptions.
   */
  source: string;
  sourceDescription?: string;
  difficulty: ProblemDifficulty;
  /**
   * In the context of a module, true if the problem is starred. False otherwise.
   */
  isStarred: boolean;
  tags: string[];
  solution: ProblemSolutionInfo;
  /** Markdown + TeX ($...$, $$...$$) statement required for all problems */
  statement: string;
  /** Optional attribution shown next to source */
  author?: string;
  interaction: ProblemInteraction;
  /** Where the “show solution” action goes */
  solutionReveal: ProblemSolutionReveal;
};

export type ProblemSolutionInfo =
  | {
      kind: 'internal';
      // The URL for internal solutions are well defined: /problems/[problem-slug]/solution
      hasHints?: boolean;
    }
  | {
      kind: 'link';
      /**
       * Ex: External Sol or CPH 5.3
       */
      label: string;
      url: string;
    }
  | {
      /*
If the label is just text. Used for certain sources like Codeforces
Ex:
- label = Check CF
- labelTooltip = "Check content materials, located to the right of the problem statement
*/
      kind: 'label';
      label: string;
      labelTooltip: string | null;
    }
  | {
      /*
Not recommended -- use internal solutions instead.
Used if there's a super short solution sketch that's not a full editorial.
Latex *is* allowed with the new implementation of problems.
*/
      kind: 'sketch';
      sketch: string;
    }
  | null; // null if there's no solution for this problem

export type AlgoliaProblemInfo = Omit<ProblemInfo, 'uniqueId'> & {
  objectID: string;
  problemModules: {
    id: string;
    title: string;
    section?: string;
  }[];
};

export type ProblemMetadata = Omit<
  ProblemInfo,
  'solution' | 'interaction' | 'solutionReveal'
> &
  Partial<Pick<ProblemInfo, 'author'>> & {
    solutionMetadata: ProblemSolutionMetadata;
    interaction?: ProblemInteractionMetadata;
    solutionReveal?: ProblemSolutionRevealMetadata;
  };

export type ProblemSolutionMetadata =
  | {
      // auto generate problem solution label based off of the given site
      // For sites like Codeforces: "Check contest materials, located to the right of the problem statement."
      kind: 'autogen-label-from-site';
      // The site to generate it from. Sometimes this may differ from the source; for example, Codeforces could be the site while Baltic OI could be the source if Codeforces was hosting a Baltic OI problem.
      site: string;
    }
  | {
      // internal solution
      kind: 'internal';
      hasHints?: boolean;
    }
  | {
      // URL solution
      // Use this for links to PDF solutions, etc
      kind: 'link';
      url: string;
    }
  | {
      // no solution exists
      kind: 'none';
    }
  | {
      // for focus problems, when the solution is presented in the module of the problem
      kind: 'in-module';
      moduleId: string;
    }
  | {
      /**
       * @deprecated
       */
      kind: 'sketch';
      sketch: string;
    };


export function getProblemURL(
  problem: Pick<ProblemInfo, 'source' | 'name' | 'uniqueId'> & {
    [x: string]: any;
  }
): string {
  const baseSlug = `${slug(problem.source)}-${slug(
    (problem.name || '').replace(' - ', ' ')
  )}`;
  // Include uniqueId to avoid collisions when different problems share source+name.
  const uniqueSuffix = problem.uniqueId ? `-${slug(problem.uniqueId)}` : '';
  return `/problems/${baseSlug}${uniqueSuffix}`;
}

function normalizeProblemInteraction(
  raw: ProblemInteractionMetadata | undefined,
  uniqueId: string
): ProblemInteraction {
  if (!raw || raw.type === 'none' || !raw.type) {
    return { type: 'none' };
  }
  if (raw.type === 'integer') {
    if (raw.correct === undefined || raw.correct === null) {
      console.warn(
        `Problem ${uniqueId}: integer interaction missing "correct"; using none`
      );
      return { type: 'none' };
    }
    return { type: 'integer', correct: String(raw.correct).trim() };
  }
  if (raw.type === 'mcq') {
    const choices = raw.choices;
    const idx = raw.correctIndex;
    if (
      !Array.isArray(choices) ||
      choices.length < 2 ||
      typeof idx !== 'number' ||
      idx < 0 ||
      idx >= choices.length
    ) {
      console.warn(
        `Problem ${uniqueId}: invalid mcq interaction; using none`
      );
      return { type: 'none' };
    }
    return { type: 'mcq', choices, correctIndex: idx };
  }
  return { type: 'none' };
}

function normalizeSolutionReveal(
  raw: ProblemSolutionRevealMetadata | undefined,
  fallbackUrl: string,
  uniqueId: string
): ProblemSolutionReveal {
  if (!raw || !raw.mode || raw.mode === 'external') {
    return { mode: 'external', url: raw?.url ?? fallbackUrl };
  }
  if (raw.mode === 'inline') {
    const md = raw.markdown?.trim();
    if (!md) {
      console.warn(
        `Problem ${uniqueId}: inline solutionReveal missing markdown; using external`
      );
      return { mode: 'external', url: fallbackUrl };
    }
    return { mode: 'inline', markdown: raw.markdown! };
  }
  return { mode: 'external', url: fallbackUrl };
}

export const getProblemInfo = (
  metadata: ProblemMetadata,
  ordering?: any
): ProblemInfo => {
  // don't cache the ordering import, to make sure it gets re-fetched each time
  if (!ordering) {
    ordering = defaultOrdering;
  }
  let { solutionMetadata, interaction: rawInteraction, solutionReveal: rawSolutionReveal, statement, author, ...info } = metadata;

  if (!info.url || typeof info.url !== 'string' || !info.url.startsWith('http')) {
    info.url = 'https://usamoguide.com/';
  }

  if (
    !info.source ||
    !info.uniqueId ||
    info.isStarred === null ||
    info.isStarred === undefined ||
    !info.name
  ) {
    console.error("problem metadata isn't valid", metadata);
    throw new Error('Bad problem metadata');
  }

  let sol: ProblemSolutionInfo;
  if (solutionMetadata.kind === 'none') {
    // for sites such as CF or AtCoder, automatically generate metadata even if solution is set to none
    const autogenerated = autoGenerateSolutionMetadata(
      info.source,
      info.name,
      info.url
    );
    if (autogenerated !== null) solutionMetadata = autogenerated;
  }
  if (solutionMetadata.kind === 'autogen-label-from-site') {
    const site = solutionMetadata.site;
    const key = site as keyof typeof probSources;
    if (!probSources.hasOwnProperty(site) || probSources[key].length !== 3) {
      // https://stackoverflow.com/questions/57086672/element-implicitly-has-an-any-type-because-expression-of-type-string-cant-b
      console.error(metadata);
      throw new Error(
        "Couldn't autogenerate solution label from problem site " + site
      );
    }
    sol = {
      kind: 'label',
      label: 'Check ' + site,
      labelTooltip: probSources[key][2],
    };
  } else if (solutionMetadata.kind === 'internal') {
    sol = {
      kind: 'internal',
      ...(solutionMetadata.hasHints && { hasHints: solutionMetadata.hasHints }),
    };
  } else if (solutionMetadata.kind === 'link') {
    sol = {
      kind: 'link',
      url: solutionMetadata.url,
      label: 'External Sol',
    };
  } else if (solutionMetadata.kind === 'none') {
    sol = null;
  } else if (solutionMetadata.kind === 'in-module') {
    if (!(solutionMetadata.moduleId in ordering.moduleIDToSectionMap)) {
      throw new Error(
        `Problem ${metadata.uniqueId} - solution in nonexistent module: ${solutionMetadata.moduleId}`
      );
    }
    sol = {
      kind: 'link',
      label: 'In Module',
      url: `https://usamo.guide/${
        ordering.moduleIDToSectionMap[solutionMetadata.moduleId]
      }/${solutionMetadata.moduleId}#problem-${info.uniqueId}`,
    };
  } else if (solutionMetadata.kind === 'sketch') {
    sol = {
      kind: 'sketch',
      sketch: solutionMetadata.sketch,
    };
  } else {
    throw new Error(
      'Unknown solution metadata ' + JSON.stringify(solutionMetadata)
    );
  }

  return {
    ...info,
    statement,
    author,
    interaction: normalizeProblemInteraction(rawInteraction, info.uniqueId),
    solutionReveal: normalizeSolutionReveal(
      rawSolutionReveal,
      info.url,
      info.uniqueId
    ),
    solution: sol,
  };
};

/*
 * Warning: not all IDs will follow this convention. You should not assume
 * that the unique ID for a problem will necessarily be what this function
 * outputs; the user can manually change the problem ID.
 */
export function generateProblemUniqueId(
  source: string,
  name: string,
  url: string
): string {
  const normalize = (value: string) => slug(value.replace(' - ', ' '));
  return `${normalize(source)}-${normalize(name)}`;
}

export function autoGenerateSolutionMetadata(
  source: string,
  name: string,
  url: string
): ProblemSolutionMetadata | null {
  if (probSources.hasOwnProperty(source) && probSources[source].length === 3) {
    return {
      kind: 'autogen-label-from-site',
      site: source,
    };
  }
  return null;
}

export type ProblemProgress =
  | 'Not Attempted'
  | 'Solving'
  | 'Solved'
  | 'Reviewing'
  | 'Skipped'
  | 'Ignored';

export const PROBLEM_PROGRESS_OPTIONS: ProblemProgress[] = [
  'Not Attempted',
  'Solving',
  'Solved',
  'Reviewing',
  'Skipped',
  'Ignored',
];

export type ProblemDifficulty =
  | 'N/A'
  | 'Very Easy'
  | 'Easy'
  | 'Normal'
  | 'Hard'
  | 'Very Hard'
  | 'Insane';
export const PROBLEM_DIFFICULTY_OPTIONS: ProblemDifficulty[] = [
  'Very Easy',
  'Easy',
  'Normal',
  'Hard',
  'Very Hard',
  'Insane',
];

export type ProblemFeedback = {
  difficulty: ProblemDifficulty | null;
  tags: string[];
  solutionCode: string;
  isCodePublic: boolean;
  otherFeedback: string;
};
