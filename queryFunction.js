const term = require('./interface');
const { cfg } = require('./connection');
const { hasher, hashVerifier } = require('./userAuth/encryption');
const { makeLongAuthToken } = require('./userAuth/token');
const { query } = require('express');

function listTable(dataBase) {
    const query = 'show tables';
    dataBase.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query: ', error);
            term.prompt();
            return;
        }
        if (results.length > 0) {
            console.log('Tables in the database:');
            results.forEach((row) => {
                console.log('-> ', row[`Tables_in_${cfg.mysql.database}`]);
            });
            term.prompt();
        } else {
            console.log(`No tables found in the database ${cfg.mysql.database}`);
            term.prompt();
        }
    });
    term.prompt();
};

async function postQueryMusicSearch(dataBase, title) {
    const keyword = '%' + title.trim() + '%';
    const query = `select * from music where title like ?`;

    return new Promise((resolve, reject) => {
        dataBase.query(query, [keyword], async (error, results) => {
            if (error) {
                console.error('Error executing query: ', error);
                term.prompt();
                reject('Server encounter an error.\n Please try again later');
                return;
            }
            if (results.length > 0) {
                const response = [];

                for (const row of results) {
                    const artistName = await getArtistTitle(dataBase, row.artist_id);
                    const albumName = await getAlbumTitle(dataBase, row.album_id);
                    
                    response.push({
                        trackId: row.track_id,
                        artistId: row.artist_id,
                        albumId: row.album_id,
                        title: row.title,
                        artist: artistName,
                        album: albumName,
                        genre: row.genre,
                        create_at: new Date(row.created_at).toLocaleString(),
                    });
                }

                resolve(response);
            } else {
                resolve(`There were no result for "${title}".`);
            }
        });
    });
}

async function internalPathLookUp(dataBase, track_id) {
    const query = `select file_path from music where track_id = ?;`;

    return new Promise((resolve, reject) => {
        dataBase.query(query, [track_id], async (error, results) => {
            if (error) {
                console.error('Error executing query: ', error);
                term.prompt();
                reject('Server encounter an error.\n Please try again later');
                return;
            }
            if (results && results.length > 0) {
                const file_name = results[0].file_path;
                console.log(`Query for ${file_name} successfully.`)
                term.prompt();
                resolve(file_name);
            } else {
                resolve(`Query encounter error which was not catched\n    Error: ${error}\n    Track_id: ${track_id}\n    Result: ${results}`);
            }
        });
    });
}

function musicRsDump(dataBase, title) {
    const keyword = '%' + title.trim() + '%';
    const query = `select * from music where title like ?`;
    dataBase.query(query, [keyword], (error, results) => {
        if (error) {
            console.error('Error executing query: ', error);
            term.prompt();
            return;
        }
        if (results.length > 0) {
            console.log(`List of track with name contain "${title}":`);
            console.log(results);
            term.prompt();
        } else {
            console.log(`No track with matching name "${title}" in LPAMB DB.`);
            term.prompt();
        }
    });
}

async function searchMusic(dataBase, title) {
    const keyword = '%' + title.trim() + '%';
    const query = `select * from music where title like ?`;
    dataBase.query(query, [keyword], async (error, results) => {
        if (error) {
            console.error('Error executing query: ', error);
            term.prompt();
            return;
        }
        if (results.length > 0) {
            console.log(`List of track with name contain "${title}":`);
            for (const row of results) {
                const artistName = await getArtistTitle(dataBase, row.artist_id);
                const albumName = await getAlbumTitle(dataBase, row.album_id);
                console.log(`Title: ${row.title}`);
                console.log(`Artist: ${artistName}`);
                console.log(`Album: ${albumName}`);
                console.log(`File Path: ${row.file_path}`);
                console.log(`Created At: ${new Date(row.created_at).toLocaleString()}`);
                console.log('<==============>');

            }
            term.prompt();
        } else {
            console.log(`No track with matching name "${title}" in LPAMB DB.`);
            term.prompt();
        }
    });
}

// Backend method, only use for extracting title from UUID
async function getArtistTitle(dataBase, artist_id) {
    const query = `select \`name\` from artist where artist_id = ?`;
    return new Promise((resolve, reject) => {
        dataBase.query(query, [artist_id], (error, results) => {
            if (error) {
                reject('Unknow artist');
                return;
            }
            if (results.length > 0) {
                resolve(results[0].name);
                return;
            } else {
                resolve('Unknow artist');
            }
        });
    });
}

async function getAlbumTitle(dataBase, album_id) {
    const query = `select \`name\` from album where album_id = ?`;
    return new Promise((resolve, reject) => {
        dataBase.query(query, [album_id], (error, results) => {
            if (error) {
                reject('Unknow album');
                return;
            }
            if (results.length > 0) {
                resolve(results[0].name);
                return;
            } else {
                resolve('Unknow album');
            }
        });
    });
}

const emailFormatCheck = (email) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

async function registerUser(dataBase, email, username, password) {
    if (email == null|| username == null || password == null) {
        console.log('One of curicial field is missing, returning');
        term.prompt();
        return Promise.reject(-4); // code -4 for missing field, internal passing issue. this error code mean I messed up.
    } else {
        email = email.trim();
        username = username.trim();
        password = password.trim();

        if (email.length === 0 || username.length === 0 || password.length === 0) {
            return Promise.reject(-3); // code -3 for empty string contain only blank space.
        }

        if (!emailFormatCheck(email)) {
            return Promise.reject(-1); // code -1 for malformed email.
        }

        try {
            const query = `insert into users (email, username, password_hash) values (?, ?, ?)`;
        
            return new Promise(async (resolve, reject) => {
                const hash = await hasher(password);
                dataBase.query(query, [email, username, hash], (error) => {
                    if (error) {
                        if (error.code === 'ER_DUP_ENTRY') {
                            console.log(`Email "${email}" is taken, returning.`);
                            term.prompt();
                            reject(0); // code 0 for email taken.
                        }
                        console.error(`There was a database related error during registration.\n!   MySQL Error code: ${error.code}`);
                        term.prompt();
                        return reject(-2); // code -2 for database issue.
                    }
                    
                    resolve({ success: true });
                });
            });
        } catch (e) {
            console.error(`Registration failed with critical error. Error:\n ${e.message}`);
            term.prompt();
            return Promise.reject(-5); // code -5 mean that something seriously gone wrong.
        }
    }
}

async function updateAccountToken(dataBase, jwtToken, userId) {
    if (!jwtToken || !userId) {
       return Promise.reject(-2); // passing value error
    }

    const query = `update users set token = ? where user_id = ?`;
    return new Promise((resolve, reject) => {
        dataBase.query(query, [jwtToken, userId], (error) => {
            if (error) {
                return reject(-1);
            }

            resolve()
        });
    });
}

// For headerless request (assume login into new device).
async function signinUser(dataBase, email, password) {
    if (email == null || password == null) {
        console.log('One of curicial field is missing, returning');
        term.prompt();
        return Promise.reject(-4); // code -4 for missing field.
    } else {
        email = email.trim();
        password = password.trim();

        if (email.length === 0 || password.length === 0) {
            return Promise.reject(-3); // code -3 for empty string contain only blank space.
        }

        if (!emailFormatCheck(email)) {
            return Promise.reject(-1); // code -1 for malformed email.
        }

        try {
            const query = `select (user_id, email, password_hash, token) from users where email = ?`;

            return new Promise(async (resolve, reject) => {
                dataBase.query(query, [email], async (error, results) => {
                    if (error) {
                        console.error(`There was a database related error during sign in process.\n!   << MySQL Error code: ${error.code}`);
                        term.prompt();
                        return reject(-2); // code -2 for database issue.
                    }

                    if (results.length < 1) {
                        return reject(0); // code 0 no matching account (masked as email or password incorrect).
                    } else {
                        const verify = await hashVerifier(password, results[0].password_hash);

                        if (!verify) {
                            return reject(0);
                        } else {
                            // TODO: db store account token now, will figure out session token later.
                            let jwtToken = results[0].token.trim();
                            const userId = results[0].user_id;

                            // is token existed, if not make new.
                            if (!jwtToken || jwtToken.length < 1) {
                                jwtToken = makeLongAuthToken(userId);
                                // update database with new  token
                                try {
                                    await updateAccountToken(dataBase, jwtToken, userId);
                                } catch (e) {
                                    switch (e) {
                                        case -2:
                                            return reject(-4); // missing field passed to updateAccountToken.
                                        case -1:
                                            return reject(-2); // database cannot update user's token.
                                        default:
                                            return reject(-5); 
                                    }
                                }  
                            }
                            return resolve ({ userId: userId, jwtToken: jwtToken });
                        }
                    }
                });
            });
        } catch (e) {
            console.error(`Sign in failed with critical error. Error:\n ${e.message}`);
            term.prompt();
            return Promise.reject(-5);
        }
    }
}

// user header contain jwt token.
async function validateUserJWT(dataBase, jwt) {
    
}

module.exports = {
    listTable,
    postQueryMusicSearch,
    internalPathLookUp,
    musicRsDump,
    searchMusic,
    getArtistTitle,
    getAlbumTitle,
    registerUser,
    signinUser,
};