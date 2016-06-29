# Molecule

[![Build Status](https://travis-ci.org/jahed/molecule-js.svg?branch=master)](https://travis-ci.org/jahed/molecule-js)

RSS / Atom Feed Blog Aggregator

## Dependencies

- NodeJS
- NPM

## Installation

### Global

```sh
npm install -g molecule-js
```

### Local

You can also install Molecule per-project, just run

```sh
npm install molecule-js
```

and use `./node_modules/.bin/molecule` as the command.

### Programmatic

To use Molecule programmatically, see `./src/cli.js` as an example.

```js
var molecule = new Molecule(pathToConfigDir, options);
//...
molecule.build();
```

## Usage

```sh
$ molecule --help

molecule [options] <config directory>

Options:
  --pretty, -p
    Disables minification
  --output, -o <build directory>
    Default: <config directory>/build/
```

### Config Directory

See `./config/` as an example.

Path          | Description
------------- | -------------
./config.json | Configuration of your aggregator
./templates/  | Templates you want to generate

#### Templates

Currently only [Pug (previous known as Jade)](http://jade-lang.com/) templates are supported.
Support for other engines might be added if they're needed.

Currently directories in the `templates` directory aren't supported.

To know which variables are available, see the example templates under
`./config/templates`. Actual documentation may be added in the future.

Templates have a naming scheme:

./templates/  | ./build/
------------- | -------------
atom.xml.pug  | atom.xml
README.pug    | README

## License

See `LICENSE`
