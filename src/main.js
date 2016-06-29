var FeedParser = require('feedparser'),
    request = require('request'),
    pug = require('pug'),
    fs = require('fs'),
    path = require('path'),
    Promise = require('bluebird'),
    packageJson = require('../package.json');

var CONFIG_FILENAME = 'config.json';

function Molecule(configDir, options) {
    if(!(this instanceof Molecule)) {
        throw new Error('Molecule is a constructor so call it with "new".');
    }

    this.config = JSON.parse(fs.readFileSync(path.join(configDir, CONFIG_FILENAME)));

    this.configDir = configDir;
    this.templateDir = path.join(configDir, './templates/');
    this.buildDir = options.output ? options.output : path.join(configDir, './build/');

    this.locals = {
        pretty: options.pretty,
        molecule: {
            version: packageJson.version,
            name: packageJson.name,
            url: packageJson.homepage
        },
        authors: this.config.site.authors,
        title: this.config.site.title,
        description: this.config.site.description,
        feeds: this.config.site.feeds,
        date: new Date(),
        categories: this.config.site.categories,
        contributors: this.config.sources.map(function(source) {
            return source.author;
        }),
        articles: []
    };
}

Molecule.prototype._parse = function _parse() {
    return this.config.sources.map(function(source) {
        return new Promise(function(resolve, reject) {
            var req = request(source.url),
                feedparser = new FeedParser(),
                articles = [];

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
                    if(source.limit && articles.length >= source.limit) {
                        break;
                    }

                    meta.date = meta.date || new Date();
                    meta.xmlurl = meta.xmlurl || source.url;

                    article.author = article.author || source.author.name;
                    articles.push(article);
                }
            });

            feedparser.on('end', function() {
                resolve(articles);
            });

            req.on('error', rejectOnError);
            feedparser.on('error', rejectOnError);

            function rejectOnError(err) {
                err.source = source;
                reject(err);
            }
        });
    });
};

Molecule.prototype.build = function build() {
    return Promise
        .reduce(this._parse(), function(allArticles, articles) {
            return allArticles.concat(articles);
        })
        .then(function(articles) {
            var pugExt = '.pug';

            articles.sort(function(articleA, articleB) {
                return articleB.date - articleA.date;
            });

            this.locals.articles = articles;

            if(!fs.existsSync(this.buildDir)) {
                fs.mkdirSync(this.buildDir);
            }

            return fs.readdirSync(this.templateDir)
                .filter(function(file) {
                    return path.extname(file) === pugExt;
                })
                .map(function(file) {
                    var outputPath = path.join(this.buildDir, path.basename(file, pugExt));
                    var output = pug.renderFile(path.join(this.templateDir, file), this.locals);

                    return Promise.promisify(fs.writeFile)(outputPath, output)
                        .then(function() {
                            console.log(outputPath + ' built.');
                        });
                }.bind(this));
        }.bind(this));
};

module.exports = Molecule;
