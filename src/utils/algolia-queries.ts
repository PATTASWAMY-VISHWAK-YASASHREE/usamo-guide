import { AlgoliaEditorFile, AlgoliaEditorModuleFile } from '../models/algoliaEditorFile';
import { AlgoliaProblemInfo } from '../models/problem';

const extractSearchableText = require('./extract-searchable-text').default;

const pageQuery = `{
  pages: allXdm(filter: {fileAbsolutePath: {regex: "/[\\\\/]content[\\\\/]/"}, fields: {division: {ne: null}}}) {
    edges {
      node {
        frontmatter {
          id
          title
          description
        }
        fields {
          division
        }
        mdast
      }
    }
  }
}`;

function pageToAlgoliaRecord({
  node: { id, frontmatter, fields, mdast, ...rest },
}) {
  return {
    objectID: frontmatter.id,
    ...frontmatter,
    ...fields,
  };
}

const problemsQuery = `{
  data: allProblemInfo {
    edges {
      node {
        uniqueId
        name
        source
        tags
        url
        isStarred
        difficulty
        interaction {
          type
          correct
          choices
          correctIndex
        }
        solution {
          kind
          label
          labelTooltip
          hasHints
          url
        }
        module {
          frontmatter {
            id
            title
          }
          fields {
            division
          }
        }
      }
    }
  }
}`;

export const filesQuery = `{
  data: allXdm(filter: {fileAbsolutePath: {regex: "/[\\\\/]content[\\\\/]/"}}) {
    edges {
      node {
        frontmatter {
          title
          id
        }
        parent {
          ... on File {
            relativePath
            sourceInstanceName
          }
        }
      }
    }
  }
  problems: allProblemInfo {
    edges {
      node {
        uniqueId
        name
        source
        solution {
          kind
          label
          labelTooltip
          hasHints
          url
          sketch
        }
        module {
          frontmatter {
            id
            title
          }
        }
      }
    }
  }
}`;

const queries = [
  {
    query: pageQuery,
    transformer: ({ data }) =>
      data.pages.edges
        .filter(x => x.node.fields?.division)
        .map(pageToAlgoliaRecord),
    indexName: (process.env.GATSBY_ALGOLIA_INDEX_NAME ?? 'dev') + '_modules',
    matchFields: ['title', 'description', 'content', 'id', 'division'],
  },
  {
    query: problemsQuery,
    transformer: ({ data }): any[] => {
      const res: any[] = [];
      data.data.edges.forEach(({ node }) => {
        // some problems appear in multiple modules
        const existingProblem = res.find(x => x.objectID === node.uniqueId);
        // some problems (from extraProblems.json) don't have modules associated with them
        const moduleInfo = node.module
          ? {
              id: node.module.frontmatter.id,
              title: node.module.frontmatter.title,
              section: node.module.fields?.division,
            }
          : null;
        if (existingProblem) {
          existingProblem.tags = [
            ...new Set([...existingProblem.tags, ...(node.tags || [])]),
          ];
          if (
            moduleInfo &&
            !existingProblem.problemModules.find(
              module => module.id === moduleInfo.id
            )
          ) {
            existingProblem.problemModules.push(moduleInfo);
          }
        } else {
          const solution = node.solution
            ? {
                kind: node.solution.kind,
                label: node.solution.label,
                labelTooltip: node.solution.labelTooltip,
                hasHints: node.solution.hasHints,
                url: node.solution.url,
              }
            : null;

          res.push({
            objectID: node.uniqueId,
            name: node.name,
            source: node.source,
            tags: node.tags || [],
            url: node.url,
            difficulty: (node.difficulty ?? 'N/A') as AlgoliaProblemInfo['difficulty'],
            isStarred: node.isStarred,
            interaction: node.interaction,
            solution,
            problemModules: moduleInfo ? [moduleInfo] : [],
          });
        }
      });
      return res;
    },
    indexName: (process.env.GATSBY_ALGOLIA_INDEX_NAME ?? 'dev') + '_problems',
    settings: {
      attributesForFaceting: [
        'searchable(difficulty)',
        'searchable(source)',
        'filterOnly(difficulty)',
        'filterOnly(source)',
        'filterOnly(isStarred)',
        'filterOnly(problemModules.id)',
        'filterOnly(problemModules.title)',
        'searchable(problemModules.title)',
        'searchable(tags)',
      ],
    },
    matchFields: [
      'source',
      'name',
      'tags',
      'url',
      'difficulty',
      'isStarred',
      'tags',
      'problemModules',
      'solution',
    ],
  },
  {
    query: filesQuery,
    transformer: ({ data }): AlgoliaEditorFile[] => {
      const moduleFiles: AlgoliaEditorModuleFile[] = [];
      data.data.edges.forEach(({ node }) => {
        if (node.parent.sourceInstanceName === 'content') {
          moduleFiles.push({
            title: node.frontmatter.title,
            id: node.frontmatter.id,
            path: `${node.parent.sourceInstanceName}/${node.parent.relativePath}`,
          });
        }
      });
      return moduleFiles.map<
        { kind: 'module'; objectID: string } & AlgoliaEditorModuleFile
      >(x => ({
        ...x,
        kind: 'module',
        objectID: x.id,
      }));
    },
    indexName:
      (process.env.GATSBY_ALGOLIA_INDEX_NAME ?? 'dev') + '_editorFiles',
    matchFields: ['kind', 'title', 'id', 'path'],
  },
];

module.exports = queries;
