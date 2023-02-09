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

const { requireOptional, arrayToObject, toPascalCase } = require('./utils');

const componentTypesArr = ['class', 'pure-class', 'functional'];
const componentTypesObj = arrayToObject(componentTypesArr);
module.exports.componentTypes = componentTypesArr;

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
    type: componentTypesObj.functional,
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

module.exports.buildPrettifier = ({ prettierConfig, extension }) => {
  // If they haven't supplied a prettier config,
  // use prettier to try to find one

  let config = prettierConfig;

  if (!config) {
    config = prettier.resolveConfig.sync(process.cwd());
  }

  // Suppress Prettier parser warnings
  config.filepath = `foo.${extension}`;

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

const logComponentType = (selected) =>
  componentTypesArr
    .sort((a, b) => (a === selected ? -1 : 1))
    .map((option) =>
      option === selected
        ? `${blueHighlight(option)}`
        : `${chalk.rgb(...colors.darkGray)(option)}`
    )
    .join('  ');

module.exports.logIntro = ({ name, ext, dir, type }) => {
  const styledName = chalk.bold.rgb(...colors.gold)(name);

  console.info('\n');
  console.info(`✨  Creating the ${styledName} component ✨`);
  console.info('\n');

  const pathString = blueHighlight(dir);
  const extString = blueHighlight(`.${ext}`);
  const typeString = logComponentType(type);

  console.info(`Directory:  ${pathString}`);
  console.info(`Extension:  ${extString}`);
  console.info(`Type:       ${typeString}`);
  console.info(
    chalk.rgb(...colors.darkGray)('=========================================')
  );

  console.info('\n');
};

module.exports.logItemCompletion = (successText) => {
  const checkmark = chalk.rgb(...colors.green)('✓');
  console.info(`${checkmark} ${successText}`);
};

module.exports.logConclusion = () => {
  console.info('\n');
  console.info(chalk.bold.rgb(...colors.green)('Component created! 🚀 '));
  console.info(
    chalk.rgb(...colors.mediumGray)('Thanks for using new-component.')
  );
  console.info('\n');
};

module.exports.logError = (error) => {
  console.info('\n');
  console.info(chalk.bold.rgb(...colors.red)('Error creating component.'));
  console.info(chalk.rgb(...colors.red)(error));
  console.info('\n');
};

module.exports.logWarning = (warning) => {
  console.info('\n');
  console.info(chalk.bold.rgb(...colors.gold)(`⚠️  Warning: ${warning}`));
  console.info('\n');
};

module.exports.checkComponentName = (thisArg) => {
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

module.exports.checkForComponentsDir = async (dir) => {
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
