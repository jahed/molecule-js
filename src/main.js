var FeedParser = require('feedparser'),
    request = require('request'),
    jade = require('jade'),
    fs = require('fs'),
    path = require('path'),
    Promise = require('bluebird'),
    packageJson = require('../package.json'),
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

var configDir = argv._[0],
    templateDir = path.join(configDir, './templates/'),
    buildDir = argv.output ? argv.output : path.join(configDir, './build/');

var config = JSON.parse(fs.readFileSync(path.join(configDir, './config.json')));

if(!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

var locals = {
        pretty: argv.pretty,
        molecule: {
            version: packageJson.version,
            name: packageJson.name,
            url: packageJson.homepage
        },
        authors: config.site.authors,
        title: config.site.title,
        description: config.site.description,
        feeds: config.site.feeds,
        date: new Date(),
        categories: config.site.categories,
        contributors: config.sources.map(function(source) {
            return source.author;
        }),
        articles: []
    };

var promises = config.sources.map(function(source) {
    return new Promise(function(resolve, reject) {
        var req = request(source.url),
            feedparser = new FeedParser(),
            articlesAdded = 0;

        console.log('Getting feed for ' + source.url);

        req.on('response', function (res) {
            var stream = this;

            if (res.statusCode != 200) {
                var err = new Error('Received status code ' + res.statusCode);
                err.res = res;
                return this.emit('error', err);
            }

            console.log('Got feed for ' + source.url);

            stream.pipe(feedparser);
        });

        feedparser.on('readable', function() {
            var stream = this,
                meta = this.meta,
                article;

            while(article = stream.read()) {
                if(source.limit && articlesAdded >= source.limit) {
                    break;
                }

                meta.date = meta.date || new Date();
                meta.xmlurl = meta.xmlurl || source.url;

                article.author = article.author || source.author.name;
                locals.articles.push(article);
                articlesAdded++;
            }
        });

        feedparser.on('end', function() {
            resolve();
        });

        req.on('error', rejectOnError);
        feedparser.on('error', rejectOnError);

        function rejectOnError(err) {
            err.source = source;
            reject(err);
        }
    });
});

Promise.all(promises)
    .then(function () {
        var jadeExt = '.jade';

        locals.articles.sort(function(articleA, articleB) {
            return articleB.date - articleA.date;
        });

        return fs.readdirSync(templateDir)
            .filter(function(file) {
                return path.extname(file) === jadeExt;
            })
            .map(function(file) {
                var outputPath = path.join(buildDir, path.basename(file, jadeExt));
                var output = jade.renderFile(path.join(templateDir, file), locals);

                return Promise.promisify(fs.writeFile)(outputPath, output)
                    .then(function() {
                        console.log(outputPath + ' built.');
                    });
            });
    })
    .catch(function(err) {
        console.error(err);
    });
