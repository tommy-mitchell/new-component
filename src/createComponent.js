const fs = require('fs');
const path = require('path');

const { toCamelCase } = require('js-convert-case');

const {
  buildPrettifier,
  logIntro,
  logItemCompletion,
  logConclusion,
  logError,
} = require('./helpers');
const {
  mkDirPromise,
  readFilePromiseRelative,
  writeFilePromise,
} = require('./utils');

module.exports.createComponent = ({ componentName, options }) => {
  // Check if using TS template or default to the JS one.
  const validTSExtensions = /^(ts|tsx|mts|cts)$/i;
  const templateType = validTSExtensions.test(options.extension) ? 'ts' : 'js';
  const templateExtension = `${templateType}x`;

  // Find the path to the selected template file.
  const templatePath = `./templates/template.${templateExtension}`;

  // Get all of our file paths worked out, for the user's project.
  const componentDir = `${options.dir}/${componentName}`;
  const filePath = `${componentDir}/${componentName}.${options.extension}`;
  const indexPath = `${componentDir}/index.${templateType}`;

  const styleTemplate = `./templates/template.module.scss`;
  const stylePath = `${componentDir}/${componentName}.module.scss`;

  // Convenience wrapper around Prettier, so that config doesn't have to be
  // passed every time.
  const prettify = {
    code: buildPrettifier(templateType),
    styles: buildPrettifier('.scss'),
  };

  // Our index template is super straightforward, so we'll just inline it for now.
  const indexTemplate = prettify.code(`\
    export * from './${componentName}';
    export { default } from './${componentName}';
  `);

  logIntro({
    name: componentName,
    dir: componentDir,
    ext: options.extension,
  });

  // Check to see if this component has already been created
  const fullPathToComponentDir = path.resolve(componentDir);
  if (fs.existsSync(fullPathToComponentDir)) {
    logError(
      `Looks like this component already exists! There's already a component at '${componentDir}'.\nPlease delete this directory and try again.`
    );
    process.exit(0);
  }

  // Start by creating the directory that our component lives in.
  mkDirPromise(componentDir)
    .then(() => readFilePromiseRelative(templatePath))
    .then((template) => {
      logItemCompletion('Component directory created.');
      return template;
    })
    .then((template) => {
      // Replace our placeholders with real data (so far, just the component name)
      return template
        .replace(/COMPONENT_NAME/g, componentName)
        .replace(/COMPONENT_CLASS/g, toCamelCase(componentName));
    })
    .then((template) =>
      // Format it using prettier, to ensure style consistency, and write to file.
      writeFilePromise(filePath, prettify.code(template))
    )
    .then(() => {
      logItemCompletion('Component built and saved to disk.');
    })
    .then(() => readFilePromiseRelative(styleTemplate))
    .then((template) =>
      template.replace(/COMPONENT_CLASS/g, toCamelCase(componentName))
    )
    .then((template) => writeFilePromise(stylePath, prettify.styles(template)))
    .then(() =>
      logItemCompletion('Styles module file built and saved to disk.')
    )
    .then(() =>
      // We also need the `index.js` file, which allows easy importing.
      writeFilePromise(indexPath, prettify.code(indexTemplate))
    )
    .then(() => {
      logItemCompletion('Index file built and saved to disk.');
    })
    .then(() => {
      logConclusion();
    })
    .catch((err) => {
      console.error(err);
    });
};
