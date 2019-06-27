let parse = require('csv-parse');
let stringify = require('csv-stringify');
let fs = require('fs');
let jsdom = require('jsdom');
let { JSDOM } = jsdom;

const parser = new parse({
    columns: false
});

var argv = require('minimist')(process.argv.slice(2));

function log(s)
{
    if (argv.verbose) {
        console.log(s);
    }
}

function getUrls(options) {
    log("Loading input");
    return new Promise((resolve) => {
        var stream = fs.createReadStream(options.input);
        var urls = [];
    
        parser.on('readable', () => {
            let record;
            while (record = parser.read()) {
                urls.push(record[0]);
            }
        });
    
        parser.on('error', (err) => {
            log(err);
        });

        parser.on('end', () => {
            options.urls = urls;
            resolve(options);
        });

        stream.pipe(parser);
    });
}

function fetch(url) {
    return new Promise((resolve, reject) => {
        const http      = require('http'),
              https     = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
};

function scrapeClassFromUrl(className, url) {
    log(`Scraping text from ${ className } at ${ url }`);

    let dom;

    return fetch(url).then((content) => {
        dom = new JSDOM(content);
        let nodes = dom.window.document.querySelectorAll(`.${ className }`);
        
        return [...nodes].map(node => {
            return {
                url: url,
                text: node.textContent
            };
        });
    });
}

function scrapeClassFromUrls(options) {
    log(`Scraping text from ${ options.className } from loaded URLs`);

    let scrapePromises = [];

    options.urls.forEach(url => {
        scrapePromises.push(scrapeClassFromUrl(options.className, url));        
    });

    return Promise.all(scrapePromises).then(scrapes => {
        var data = [];

        scrapes.forEach(scrape => {
            data = data.concat(scrape);
        });

        options.data = data;
        return options;
    });
}

function saveData(options) {
    log(`Saving scraped data to ${options.output}`);

    stringify(options.data, {
        header: true,
        quoted: true
    }, (err, output) => {
        if (err)
        {
            log(err);
            console.log('Failed to generate CSV content');
            return;
        }

        log('CSV generation done. Writing to file.')
        fs.writeFile(options.output, output, (err) => {
            if (err) {
                log(err);
                console.log('Failed to write');
                return;
            }
            console.log('Fin');
        });
    });
}

var options = {
    input: argv.input,
    className: argv.classname,
    output: argv.output
}

getUrls(options)
    .then(scrapeClassFromUrls)
    .then(saveData)
    .catch(err => {
        log(err);
    });