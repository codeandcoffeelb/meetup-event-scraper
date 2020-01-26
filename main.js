const fetch = require('node-fetch');
const NetlifyAPI = require('netlify');
const fs = require('fs');
const os = require('os');

const NETLIFY_KEY =  process.env.NETLIFY_KEY;
const NETLIFY_SITE_ID =  process.env.NETLIFY_SITE_ID;
const JSON_URL = process.env.JSON_URL;

class Document {
    constructor(name, content) {
        this.name = name;
        this.content = content;
    }
}

const files = [
    new Document('netlify.toml', `[[headers]]
    for = "/*"
    [headers.values]
    Access-Control-Allow-Origin = "*"`),
    new Document('_headers', `/*
    Access-Control-Allow-Origin: *`),
];

exports.meetupEventScraper = async function meetupEventScraper(event, context) {
    const creationTime = new Date().getTime();
    const client = new NetlifyAPI(NETLIFY_KEY);
    const data = await fetch(JSON_URL).then(e => e.json());

    files.push(new Document('index.json', JSON.stringify(data)));
    files.push(new Document('about.json', JSON.stringify({
        creation_time: creationTime,
        author: "Code and Coffee Coffee Machine"
    })));


    var dir = `${os.tmpdir()}/netlify-tmp`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    files.forEach(({ name, content }) => {
        fs.writeFileSync(`${dir}/${name}`, content);
    });

    try {
        await client.deploy(NETLIFY_SITE_ID, dir);
        console.log('Deploy successful.');
    } catch (e) {
        console.log('Unable to deploy.', e);
    } finally {
        console.log('Cleaning up...')
        files.forEach(({ name }) => {
            fs.unlinkSync(`${dir}/${name}`);
        });
        fs.rmdirSync(dir);
        console.log('Clean up successful.')
    }
}