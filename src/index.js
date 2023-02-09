#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const program = require('commander');

const {
  componentTypes,
  getConfig,
  buildPrettifier,
  logIntro,
  logItemCompletion,
  logConclusion,
  logError,
} = require('./helpers');
const {
  requireOptional,
  mkDirPromise,
  readFilePromiseRelative,
  writeFilePromise,
  toPascalCase,
} = require('./utils');

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
  .addOption(
    program
      .createOption(
        '-t, --type <componentType>',
        'type of React component to generate'
      )
      .default(config.type)
      .choices(componentTypes)
  )
  .option(
    '-x, --extension <fileExtension>',
    'which file extension to use for the component',
    config.extension
  )
  .option('--no-pascal-case', 'disable converting component name to PascalCase')
  .action(function () {
    // Convert <componentName> at 'this.args[0]' to PascalCase
    if (this.opts().pascalCase) {
      this.args[0] = toPascalCase(this.args[0]);
    }
  })
  .parse();

const [componentName] = [program.args];
const { dir, type, extension } = program.opts();

// Check if using TS template or default to the JS one.
const validTSExtensions = /^(ts|tsx|mts|cts)$/i;
const templateType = validTSExtensions.test(extension) ? 'ts' : 'js';
const templateExtension = `${templateType}x`;

// Find the path to the selected template file.
const templatePath = `./templates/${templateType}/${type}.${templateExtension}`;

// Get all of our file paths worked out, for the user's project.
const componentDir = `${dir}/${componentName}`;
const filePath = `${componentDir}/${componentName}.${extension}`;
const indexPath = `${componentDir}/index.${templateType}`;

// Convenience wrapper around Prettier, so that config doesn't have to be
// passed every time.
const prettify = buildPrettifier({
  prettierConfig: config.prettierConfig,
  extension: templateType,
});

// Our index template is super straightforward, so we'll just inline it for now.
const indexTemplate = prettify(`\
export * from './${componentName}';
export { default } from './${componentName}';
`);

logIntro({
  name: componentName,
  ext: extension,
  dir: componentDir,
  type: type,
});

// Check to see if a directory at the given path exists
const fullPathToParentDir = path.resolve(dir);
if (!fs.existsSync(fullPathToParentDir)) {
  logError(
    `Sorry, you need to create a parent "components" directory.\n(new-component is looking for a directory at ${dir}).`
  );
  process.exit(0);
}

// Check to see if this component has already been created
const fullPathToComponentDir = path.resolve(componentDir);
if (fs.existsSync(fullPathToComponentDir)) {
  logError(
    `Looks like this component already exists! There's already a component at ${componentDir}.\nPlease delete this directory and try again.`
  );
  process.exit(0);
}

// Start by creating the directory that our component lives in.
mkDirPromise(componentDir)
  .then(() => readFilePromiseRelative(templatePath))
  .then((template) => {
    logItemCompletion('Directory created.');
    return template;
  })
  .then((template) =>
    // Replace our placeholders with real data (so far, just the component name)
    template.replace(/COMPONENT_NAME/g, componentName)
  )
  .then((template) =>
    // Format it using prettier, to ensure style consistency, and write to file.
    writeFilePromise(filePath, prettify(template))
  )
  .then((template) => {
    logItemCompletion('Component built and saved to disk.');
    return template;
  })
  .then((template) =>
    // We also need the `index.js` file, which allows easy importing.
    writeFilePromise(indexPath, prettify(indexTemplate))
  )
  .then((template) => {
    logItemCompletion('Index file built and saved to disk.');
    return template;
  })
  .then((template) => {
    logConclusion();
  })
  .catch((err) => {
    console.error(err);
  });
