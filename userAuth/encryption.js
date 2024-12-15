const bcrypt = require('bcrypt');
const fs = require('fs');
const yml = require('js-yaml');
const term = require('../interface');
const encrypter = yml.load(fs.readFileSync('./userAuth/encrypter.yml', 'utf8'));

/**
 * A hasher used to encrypt password.
 * Use to obscurse user's password with bcrypt.
 *
 * @param {string} password - The source of password that need to be hashed.
 * @returns {Promise<string>} The hash string that represent user's password.
 */
function hasher(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, encrypter.security.salt, function(error, result) {
            if (error) {
                console.warn(`There was an error during password hasing:\n >> ${error.message}`);
                term.prompt();
                reject(error.message);
                return;
            }
    
            resolve(result);
        });
    });
}

/**
 * A hash verifier use to compare user's password.
 * Use to  compare hash with paswword.
 *
 * @param {string} password - The source of password for comparison.
 * @param {string} hash - The source of hash for comparison.
 * @returns {Promise<boolean>} `true` if comparison match, `false` if comparison did not match.
 */
function hashVerifier(password, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, function(error, result) {
            if (error) {
                console.warn(`There was an error during password verification:\n! >> ${error.message}`);
                term.prompt();
                reject(error.message);
                return;
            }
    
            resolve(result);
        });
    });
}

module.exports = {
    hasher,
    hashVerifier
}