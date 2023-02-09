/*
Helpers are application-specific functions.

They're useful for abstracting away plumbing and other important-but-
uninteresting parts of the code, specific to this codebase.

NOTE: For generalized concerns that aren't specific to this project,
use `utils.js` instead.
*/
const os = require('os');
const fs = require('fs');
const path = require('path');

const prettier = require('prettier');
const chalk = require('chalk');
const promptly = require('promptly');
const { toPascalCase } = require('js-convert-case');

const { requireOptional, sample } = require('./utils');
const AFFIRMATIONS = require('./affirmations');

// Get the configuration for this component.
// Overrides are as follows:
//  - default values
//  - globally-set overrides
//  - project-specific overrides
//  - command-line arguments.
//
// The CLI args aren't processed here; this config is used when no CLI argument
// is provided.
module.exports.getConfig = () => {
  const home = os.homedir();
  const currentPath = process.cwd();

  const defaults = {
    dir: 'src/components',
    extension: 'jsx',
    pascalCase: true,
  };

  const globalOverrides = requireOptional(
    `/${home}/.new-component-config.json`
  );

  const localOverrides = requireOptional(
    `/${currentPath}/.new-component-config.json`
  );

  return Object.assign({}, defaults, globalOverrides, localOverrides);
};

module.exports.buildPrettifier = (extension) => {
  // Use Prettier to parse config
  let config = prettier.resolveConfig.sync(process.cwd());

  // default config:
  config = config || {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
  };

  // Suppress Prettier warnings about parser/filepath
  config = { ...config, filepath: `foo.${extension}` };

  return (text) => prettier.format(text, config);
};

// Emit a message confirming the creation of the component
const colors = {
  red: [216, 16, 16],
  green: [142, 215, 0],
  blue: [0, 186, 255],
  gold: [255, 204, 0],
  mediumGray: [128, 128, 128],
  darkGray: [90, 90, 90],
};

const blueHighlight = (text) => chalk.bold.rgb(...colors.blue)(text);

module.exports.logIntro = ({ name, dir, ext }) => {
  const styledName = chalk.bold.rgb(...colors.gold)(name);

  console.info('');
  console.info(`✨  Creating the ${styledName} component ✨`);
  console.info('');

  const pathString = blueHighlight(dir);
  const extString = blueHighlight(`.${ext}`);

  console.info(`Directory:  ${pathString}`);
  console.info(`Extension:  ${extString}`);
  console.info(
    chalk.rgb(...colors.darkGray)('=========================================')
  );

  console.info('');
};

module.exports.logItemCompletion = (successText) => {
  const checkmark = chalk.rgb(...colors.green)('✓');
  console.info(`${checkmark} ${successText}`);
};

module.exports.logConclusion = () => {
  console.info('');
  console.info(chalk.bold.rgb(...colors.green)('Component created!'));
  console.info(chalk.rgb(...colors.mediumGray)(sample(AFFIRMATIONS)));
};

module.exports.logError = (error) => {
  console.info('');
  console.info(chalk.bold.rgb(...colors.red)('Error creating component.'));
  console.info(chalk.rgb(...colors.red)(error));
  console.info('');
};

module.exports.logWarning = (warning) => {
  console.info('');
  console.info(chalk.bold.rgb(...colors.gold)(`⚠️  Warning: ${warning}`));
  console.info('');
};

// Processes the <componentName> argument to check for a provided extension,
// and to optionally convert the provided name to PascalCase.
//   could be in the form <componentName>[.componentExtension] (ex: 'foo.js')
module.exports.processComponentNameAndExtension = (thisArg) => {
  let componentName = thisArg.args[0];
  const maybeExtension = path.extname(componentName);

  // If extension provided in <componentName>, separate and set option
  if (maybeExtension) {
    componentName = path.basename(componentName, maybeExtension);
    thisArg.opts().extension = maybeExtension.substring(1);
  }

  // Convert <componentName> to PascalCase
  if (thisArg.opts().pascalCase) {
    componentName = toPascalCase(componentName);
  }

  thisArg.args[0] = componentName;
};

module.exports.createComponentsDirIfNeeded = async (dir) => {
  const fullPathToParentDir = path.resolve(dir);

  if (!fs.existsSync(fullPathToParentDir)) {
    module.exports.logWarning(
      `No parent "components" directory found at '${dir}'.`
    );

    const createComponentsDir = await promptly.confirm(
      'Create "components" directory? (Y/N): '
    );

    if (createComponentsDir) {
      module.exports.logWarning('Creating...');
      fs.mkdirSync(dir);
      module.exports.logItemCompletion(
        `Created "components" directory at '${dir}'.`
      );
    } else {
      module.exports.logError(
        `Cannot proceed without a "components" directory. Did you mean to set one with '--dir <pathToDirectory>'?`
      );
      process.exit(0);
    }
  }
};
