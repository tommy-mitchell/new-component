#!/usr/bin/env node
const { program } = require('commander');

const {
  getConfig,
  checkComponentName,
  checkForComponentsDir,
} = require('./helpers');
const { createComponent } = require('./createComponent');

// Load our package.json, so that we can pass the version onto `commander`.
const { version } = require('../package.json');

// Get the default config for this component (looks for local/global overrides,
// falls back to sensible defaults).
const config = getConfig();

// Set up CLI
program
  .name('new-component')
  .description('Creates a new React component directory.')
  .showHelpAfterError('(add --help for usage information)');

// Add CLI flags
program
  .version(version)
  .argument('<componentName>', 'name of the new component')
  .option(
    '-d, --dir <pathToDirectory>',
    'path to the "components" directory',
    config.dir
  )
  .option('--no-pascal-case', 'disable converting component name to PascalCase')
  .action(async function () {
    checkComponentName(this);
    await checkForComponentsDir(this.opts().dir);
  })
  .hook('postAction', () => createComponent(program, config))
  .parseAsync();
