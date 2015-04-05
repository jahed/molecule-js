#!/bin/node

var packageJson = require('../package.json'),
    Molecule = require('./main'),
    argv = require('minimist')(process.argv.slice(2), {
        string: ['output'],
        boolean: ['pretty', 'help', 'version'],
        alias: {
            'pretty': ['p'],
            'output': ['o'],
            'help': ['h'],
            'version': ['v']
        }
    });

if(argv.version) {
    console.log(packageJson.name + ' ' + packageJson.version);
    return;
}

if(argv.help) {
    console.log();
    console.log('molecule [options] <config directory>');
    console.log();
    console.log('Options:');
    console.log('  --pretty, -p');
    console.log('    Disables minification');
    console.log('  --output, -o <build directory>');
    console.log('    Changes ./build location.');
    console.log('    Default: config directory');
    console.log();
    return;
}

var molecule = new Molecule(argv._[0], {
    output: argv.output,
    pretty: argv.pretty
});

molecule.build();