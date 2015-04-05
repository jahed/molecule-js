var FeedParser = require('feedparser'),
    request = require('request'),
    jade = require('jade'),
    fs = require('fs'),
    Promise = require('bluebird'),
    packageJson = require('../package.json');

var config = {
        site: {
            title: 'An Aggregated Blog',
            description: 'A test site for checking this project.',
            url: 'http://example.com',
            authors: [
                {
                    name: 'Jahed'
                }
            ],
            feeds: {
                atom: {
                    url: 'http://example.com/atom.xml'
                }
            },
            categories: [
                'tech'
            ]
        },
        sources: [
            {
                author: {
                    name: 'Jahed',
                    url: 'http://jahed.io/'
                },
                url: 'http://blog.jahed.io/tagged/devlog/rss'
            },
            {
                author: {
                    name: 'GitHub',
                    url: 'http://github.com/'
                },
                url: 'http://github.com/jahed.atom'
            }
        ]
    },
    locals = {
        pretty: true,
        filename: 'atom.xml.jade',
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
        sources: [],
        articles: []
    };

var promises = config.sources.map(function(source) {
    return new Promise(function(resolve, reject) {
        var req = request(source.url),
            feedparser = new FeedParser();

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

            if(!meta.date) {
                meta.date = new Date();
            }

            if(!meta.xmlurl) {
                meta.xmlurl = source.url;
            }

            if(locals.sources.filter(function(source) {
                    return source.id === meta.id;
                }).length === 0) {
                locals.sources.push(meta);
            }

            while(article = stream.read()) {
                if(!article.author) {
                    article.author = source.author.name;
                }
                locals.articles.push(article);
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

        locals.articles.sort(function(articleA, articleB) {
            return articleB.date - articleA.date;
        });

        var html = jade.renderFile('./src/atom.xml.jade', locals);

        return Promise.promisify(fs.writeFile)("./build/atom.xml", html)
            .then(function() {
                console.log("The file was saved!");
            });
    })
    .catch(function(err) {
        console.error(err);
    });
