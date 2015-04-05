# Molecule
RSS / Atom Feed Blog Aggregator

## Dependencies

- NodeJS
- NPM

## Installation

```sh
sudo npm install -g molecule-js
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

Currently only [Jade](http://jade-lang.com/) templates are supported.
Support for other engines might be added if they're needed.

Currently directories in the `templates` directory aren't supported.

To know which variables are available, see the example templates under
`./config/templates`. Actual documentation may be added in the future.

Templates have a naming scheme:

./templates/  | ./build/
------------- | -------------
atom.xml.jade | atom.xml
README.jade   | README

