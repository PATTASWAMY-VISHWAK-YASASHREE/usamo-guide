const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repo = path.resolve(__dirname, '..');
const source = fs
  .readFileSync(path.join(repo, 'gatsby-node.ts'), 'utf8')
  .replace(/\r\n/g, '\n');

const firstStart = source.indexOf(
  'exports.onCreateWebpackConfig = ({ actions }) => {'
);
const firstEnd =
  firstStart >= 0 ? source.indexOf('exports.createPages =', firstStart) : -1;
const secondStart = source.lastIndexOf(
  'exports.onCreateWebpackConfig = ({ actions, stage, loaders, plugins }) => {'
);
const secondEnd = source.indexOf('\nexports.onPostBuild', secondStart);
assert.ok(secondStart >= 0 && secondEnd > secondStart);
const firstBlock =
  firstStart >= 0 && firstEnd > firstStart
    ? source.slice(firstStart, firstEnd)
    : '';

const context = {
  exports: {},
  __dirname: repo,
  path: { resolve: (...parts) => parts.join('/') },
};
vm.runInNewContext(firstBlock + source.slice(secondStart, secondEnd), context);

test('keeps Gatsby build cache disabled after webpack hook registration', () => {
  const configs = [];
  context.exports.onCreateWebpackConfig({
    actions: { setWebpackConfig: config => configs.push(config) },
    loaders: { js: () => ({ loader: 'stub' }) },
    plugins: { provide: value => ({ provide: value }) },
    stage: 'build-javascript',
  });

  assert.ok(
    configs.some(config => config.cache === false),
    `build-javascript must retain the global cache:false configuration: ${JSON.stringify(configs)}`
  );
});
