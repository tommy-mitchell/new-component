#!/usr/bin/env node
const { program } = require('commander');

const {
  getConfig,
  processComponentNameAndExtension,
  createComponentsDirIfNeeded,
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
    processComponentNameAndExtension(this);
    await createComponentsDirIfNeeded(this.opts().dir);
  })
  .hook('postAction', () => {
    const [componentName] = [program.args];
    const options = program.opts();

    createComponent({ componentName, options });
  })
  .parseAsync();
