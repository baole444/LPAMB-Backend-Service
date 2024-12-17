const https = require('https');
const http = require('http');
const express = require('express');
const parser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const os = require('os');
const term = require('./interface');
const { DBconnect, cfg } = require('./connection');
const { rateLimit } = require('express-rate-limit');
const { 
    checkMusic,
    getMd5Hash
 } = require('./noMeta');
const {
    listTable,
    postQueryMusicSearch,
    musicRsDump,
    searchMusic,
    internalPathLookUp,
    registerUser,
    signinUser,
} = require('./queryFunction');

const fs = require('fs');
const path = require('path');

const certificatePath = path.join(__dirname, cfg.server.config, cfg.server.certificate);

const accountLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: "Too many account related request from this IP, please try again later.",
});

const musicLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 180,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: "Too many music related request from this IP, please try again later.",
});

const port = cfg.server.port;
const platform = os.platform();
let Instant;
let dataBase;
const sslCer = {
    key: fs.readFileSync(path.resolve(certificatePath, 'key.pem')),
    cert: fs.readFileSync(path.resolve(certificatePath, 'cert.pem')),
};

function start(dataBase) {
    // server init
    const server = express();

    server.use(cors({ origin: '*'}));
    server.use(parser.json());

    console.log(`Running on ${platform}`);
    
    server.use('user', accountLimit);
    server.use('music', musicLimit);

    // server get request
    server.get('/', (req, rep) => {
        rep.send('LPAMB back end server.');

    });

    server.trace('/', (req, rep) => {
        rep.json({ success: true })
        console.log(`Server pinged by ${req.ip}`);
        term.prompt();
    });

    server.post('/api/music/search', async (req, rep) => {
        const { data } = req.body;
        console.log(`Request search for "${data}" recieved.`);
        
        try {
            const results = await postQueryMusicSearch(dataBase, data);
            rep.json(results);
        } catch (e) {
            rep.status(404).json({message:e});
        }
        term.prompt();
    })

    server.get('/api/music/test', async (req, rep) => {
        const data = '64687e78-8002-11ef-b7b4-d8bbc1b40ca4';
        console.log(`Stream file with uuid ${data} recieved.`);
        term.prompt();
        let finalPath;

        try {
            // return the file path from the server's database
            const file_path = await internalPathLookUp(dataBase, data);
            
            // parsing path into full path
            finalPath = path.join(__dirname, cfg.server.storage, cfg.server.response, `${file_path}`);
            console.log(finalPath);
            // check file existence
            if (!fs.existsSync(finalPath)) {
                console.warn(`Warning: ${file_path}`);
                term.prompt();
                return rep.status(404).send('Server encountered an error');
            }

            rep.setHeader('Content-Type', 'audio/mpeg');

            const stream = fs.createReadStream(finalPath);

            stream.pipe(rep);

            stream.on('error', (er) => {
                console.error('Stream error: ', er);

                rep.status(500).send('Server encounting an error playing your music');
                term.prompt();
            });
        } catch (e) {
            console.error(e, ': ', finalPath);
            rep.status(404).send('Server encounting an error playing your music');
            term.prompt();
        }
    });

    server.post('/api/music/check', async (req, rep) => {
        const { data } = req.body;
        let finalPath;

        try {
            const file_path = await internalPathLookUp(dataBase, data.trackID);
            
            finalPath = path.join(__dirname, cfg.server.storage, cfg.server.response, `${file_path}`);
            if (!fs.existsSync(finalPath)) {
                console.warn(`Warning: ${file_path}`);
                term.prompt();
                return rep.status(404).json({isMatch: false});
            }

            const md5 = await getMd5Hash(finalPath);
            if (data.md5 === md5) {
                rep.json({isMatch: true});
            } else {
                rep.json({isMatch: false});
            }
        } catch (e) {
            console.error(e, ': ', finalPath);
            rep.status(404).json({isMatch: false});
            term.prompt();
        }
    });

    server.post('/api/music/play', async (req, rep) => {
        const { data } = req.body;
        console.log(`Stream file with uuid ${data} recieved.`);
        term.prompt();
        let finalPath;

        try {
            // return the file path from the server's database
            const file_path = await internalPathLookUp(dataBase, data);
            
            // parsing path into full path
            finalPath = path.join(__dirname, cfg.server.storage, cfg.server.response, `${file_path}`);
            // check file existence
            if (!fs.existsSync(finalPath)) {
                console.warn(`Warning: ${file_path}`);
                term.prompt();
                
                return rep.status(404).send('Server encountered an error.');
            }

            rep.setHeader('Content-Type', 'audio/mpeg');

            const stream = fs.createReadStream(finalPath);
            
            stream.pipe(rep);

            stream.on('error', (er) => {
                console.error('Stream error: ', er);

                rep.status(500).send('Server encounting an error playing your music.');
                term.prompt();
            });
        } catch (e) {
            console.error(e, ': ', finalPath);
            rep.status(404).send('Server encounting an error playing your music.');
            term.prompt();
        }
    });

    server.post('/api/user/register', async (req, rep) => {
        const { data } = req.body;
        try {
            if (data) {
                const email = data.email;
                const username = data.username;
                const password = data.username;
                
                const result = await registerUser(dataBase, email, username, password);
                rep.status(201).json({ message: 'Register account successfully', result});
            } 
        } catch (e) {
            switch (e) {
                case -5:
                    rep.status(500).json({ message: 'Server encountered exceptions.'});
                    break;
                case -4:
                    rep.status(500).json({ message: "Server failed to pass all crucial fields."});
                    break;
                case -3:
                    rep.status(400).json({ message: "Entered information might be empty."});
                    break;
                case -2:
                    rep.status(500).json({ message: "Server failed to create your account, please try again later."});
                    console.error("Server encountered critical error while inserting user data into database");
                    term.prompt();
                    break;
                case -1:
                    rep.status(400).json({ message: "Entered email was not the correct format."});
                    break;
                case 0:
                    rep.status(409).json({ message: "Entered email already exist on this LPAMB server, please use a different email or login instead."});
                    break;
                default:
                    rep.status(500).json({ message: "Server catched an unknow error."});
            }
        }
    });

    server.post('/api/user/login', async (req, rep) => {
        const { data } = req.body;
        try {
            if (data) {
                const email = data.email;
                const password = data.password;

                const result = await signinUser(dataBase, email, password);
                
            }
        } catch (e) {

        }
    });
    
    const httpsServer = https.createServer(sslCer, server);

    Instant = httpsServer.listen(port, ()=> {
        console.log(`Server listening on port ${port}`);
        term.prompt();
    });
}

DBconnect((conn) => {
    checkMusic();
    dataBase = conn;
    start(dataBase);

    term.on('line', (input) => {
        const [cmd, ...args] = input.trim().toLowerCase().split(' ');
    
        switch (cmd) {
            case 'usedb':
                dbInterface(args, dataBase);
                break;
            case 'stop':
                console.log('Stopping server....');
                Instant.close(() => {
                    console.log('Server stopped.');
                    process.exit(0);
                });
                break;
            case 'restart':
                console.log('Stopping server....');
                restart();
                break;
            case 'help':
            case '?':
                console.log(`\n! List of possible command:\n    "help"/"?": Show this list.\n    "stop": Stop the server.\n    "restart": End current server and restart it.\n    "usedb": Switch to database interface.\n`);
                break;
            default:
                console.log(`! Unknow command: ${cmd}.\n! Type "help" or "?" to show list of possible command, as well as their function`);
                break;
                
        };
    
        term.prompt();
    });

    term.on('close', () => {
        console.log('Exiting server...\nHanded back console for OS.');
        Instant.close(() => {
            process.exit(0);
        })
    });
})

// <Server console command function>

// Allow restart server to apply change in logic or code
function restart() {
    let script = '';

    if (platform === 'win32') {
        script = 'restart.bat';
    } else {
        script = 'restart.sh';
    }
    console.log('Executing restart script...');

    Instant.close(() => {
        const newInst = spawn(script, {
            detached: true,
            shell: true,
            stdio: 'ignore'
        });
        
        newInst.unref();

        console.log('New server process started with PID:', newInst.pid);
    
        process.exit(0);
    });
}

function dbInterface(args, dataBase) {
    const subCmd = args[0];
    switch (subCmd) {
        case 'list':
            console.log('Listing tables in DB...');
            listTable(dataBase);
            break;
        case 'music':
            if (args.length < 2) {
                console.log('Please provide a title, spacing in name is acceptable.');
                term.prompt
            } else {
                let trackTitle = args.slice(1).join(' ');
                let modifier = null;
                
                if (trackTitle.includes('/')) {
                    const processArg = trackTitle.split(' ');
                    const modArg = processArg[processArg.length - 1];

                    if(modArg.startsWith('/'))  {
                        modifier = modArg;
                        trackTitle = processArg.slice(0, -1).join(' ');
                    }
                }

                console.log(`Searching for track contain "${trackTitle}" ...`);
                if (modifier === '/raw') {
                    console.log('Dumping raw information...');
                    musicRsDump(dataBase, trackTitle);
                } else {
                    searchMusic(dataBase, trackTitle);
                }
            }
            break;
            case 'help':
            case '?':
                console.log(`\n! List of possible subcommand:\n    "help"/"?": Show this list.\n    "list": List tables in DB.\n    "music <name>": List track(s) that contain the keyword in their title.`);
                break;
        
            default:
            console.log(`! Unknow subcommand: ${subCmd}.\n! Type "help" or "?" to show list of possible command, as well as their function`)
    }
}