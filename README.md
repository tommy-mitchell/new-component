<p align="center">
  <img src="https://github.com/joshwcomeau/new-component/blob/main/docs/logo@2x.png?raw=true" width="285" height="285" alt="new-component logo">
  <br>
  <a href="https://www.npmjs.org/package/new-component"><img src="https://img.shields.io/npm/v/new-component.svg?style=flat" alt="npm"></a>
</p>

# new-component

### Simple, customizable utility for adding new React components to your project.

<img src="https://github.com/joshwcomeau/new-component/blob/main/docs/divider@2x.png?raw=true" width="888" height="100" role="presentation">

This project is a CLI tool that allows you to quickly scaffold new components. All of the necessary boilerplate will be generated automatically.

This project uses an opinionated file structure discussed in this blog post: [**Delightful React File/Directory Structure**](https://www.joshwcomeau.com/react/file-structure/).

<br />

## Features

- Simple CLI interface for adding React components.
- Uses [Prettier](https://github.com/prettier/prettier) to stylistically match the existing project.
- Offers global config, which can be overridden on a project-by-project basis.
- Colourful terminal output!

<br />

## Quickstart

Install via NPM:

```bash
# Using Yarn:
$ yarn add -D new-component

# or, using NPM
$ npm i -D new-component
```

`cd` into your project's directory, and try creating a new component:

```bash
$ new-component MyNewComponent
```

Your project will now have a new directory at `src/components/MyNewComponent`. This directory has two files:

```jsx
// `MyNewComponent/index.js`
export * from './MyNewComponent';
export { default } from './MyNewComponent';
```

```jsx
// `MyNewComponent/MyNewComponent.js`
import React from 'react';

function MyNewComponent() {
  return <div></div>;
}

export default MyNewComponent;
```

These files will be formatted according to your Prettier configuration. Note that all components created will be functional components. Class components are not supported.

<br />

## Configuration

Configuration can be done through 3 different ways:

- Creating a global `.new-component-config.json` in your home directory (`~/.new-component-config.json`).
- Creating a local `.new-component-config.json` in your project's root directory.
- Command-line arguments.

The resulting values are merged, with command-line values overwriting local values, and local values overwriting global ones.

<br />

## API Reference

### Directory

Controls the desired directory for the created component. Defaults to `src/components`

**Usage:**

Command line: `--dir <value>` or `-d <value>`

JSON config: `{ "dir": <value> }`
<br />

### File Extension

Controls the file extension for the created components. Supports any extension.
If a TypeScript extension is used (`ts`, `tsx`, `mts`, `cts`), will output a TypeScript template. Otherwise,
defaults to a JavaScript template.

**Usage:**

Command line: `--extension <value>` or `-x <value>`

JSON config: `{ "extension": <value> }`
<br />

Alternatively, the extension can be provided in the component's name:

```sh
# Will create e.g. 'Foo.tsx' at 'src/components/Foo'
npx new-component foo.tsx
```

### Pascal Case

By default, this CLI will attempt to convert your component's name to PascalCase. Disable with a flag.

**Usage:**

Command line: `--no-pascal-case`

JSON config: `{ "pascalCase": <true | false> }`
