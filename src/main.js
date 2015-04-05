var FeedParser = require('feedparser'),
    request = require('request'),
    jade = require('jade'),
    fs = require('fs'),
    packageJson = require('../package.json');

var req = request('http://blog.jahed.io/rss'),
    feedparser = new FeedParser(),
    config = {
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
                url: 'http://blog.jahed.io/devlog/rss'
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

req.on('error', function (error) {
    console.log(error);
});

req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) {
        return this.emit('error', new Error('Bad status code'));
    }

    console.log('Got feed for ' + res.request.href);

    stream.pipe(feedparser);
});


feedparser.on('error', function(error) {
    console.log(error);
});

feedparser.on('readable', function() {
    var stream = this,
        meta = this.meta,
        article;

    if(!meta.date) {
        meta.date = new Date()
    }

    if(locals.sources.filter(function(source) {
        return source.id === meta.id;
    }).length === 0) {
        locals.sources.push(meta);
    }

    while(article = stream.read()) {
        locals.articles.push(article);
    }
});

feedparser.on('end', function() {
    var html = jade.renderFile('./src/atom.xml.jade', locals);

    fs.writeFile("./build/atom.xml", html, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
});