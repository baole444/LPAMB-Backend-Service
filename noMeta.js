const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const term = require('./interface');
const { cfg } = require('./connection');
const crypto = require('crypto');

const musicDir = path.join(__dirname, cfg.server.storage, cfg.server.track);
const responseDir = path.join(__dirname, cfg.server.storage, cfg.server.response);
const logList = path.join(__dirname, cfg.server.storage, cfg.server.response, 'process.json');


async function getMd5Hash(path) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const file = fs.createReadStream(path);

        file.on('error', reject);
        file.on('data', chunk => hash.update(chunk));
        file.on('end', () => resolve(hash.digest('hex')));
    })
}

function removeMeta(music, response) {
    return new Promise((resolve, reject) => {
        ffmpeg(music)
        .outputOptions(
            '-map', '0:a', 
            '-c:a', 'copy',
            '-map_metadata', '-1',
        )
        .toFormat('mp3').
        on('end', () => {
            console.log(`Stripped: ${path.basename(music)}`);
            term.prompt();
            resolve();
        }).
        on('error', (e) => {
            console.log(`Failed to strip ${path.basename(music)} with Error: ${e.message}`);
            term.prompt();
            reject();
        }).
        save(response);
    })
}

async function checkMusic() {
    if (!fs.existsSync(responseDir)) {
        fs.mkdirSync(responseDir, {recursive: true});
    }

    if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir, {recursive: true});
    }

    let processed = [];
    if (fs.existsSync(logList)) {
        processed = JSON.parse(fs.readFileSync(logList), 'utf-8');
    } else {
        fs.writeFileSync(logList, JSON.stringify([]));
    }

    const list = fs.readdirSync(musicDir);

    for (const file of list ) {
        const musicPath = path.join(musicDir, file);
        const responsePath = path.join(responseDir, file);

        if (path.extname(file) !== '.mp3' || processed.includes(file)) {
            continue;
        }

        try {
            await removeMeta(musicPath, responsePath);

            processed.push(file);

            fs.writeFileSync(logList, JSON.stringify(processed, null, 2));
        } catch (e) {
            console.error(`Cannot process ${file} with error: ${e}`);
            term.prompt();
        }


    }
    console.log(`Music files preprocess done.`);
    term.prompt();    
}

module.exports = {
    checkMusic,
    getMd5Hash
}