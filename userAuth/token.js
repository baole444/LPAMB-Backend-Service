const jwt = require('jsonwebtoken');
const fs = require('fs');
const yml = require('js-yaml');

const encrypter = yml.load(fs.readFileSync('./userAuth/encrypter.yml', 'utf8'));

function makeShortAuthToken(userId) {
    return jwt.sign({ id: userId }, encrypter.security.jwt_key_short, { expireIn: '1d' })
}

function makeLongAuthToken(userId) {
    return jwt.sign({ id: userId }, encrypter.security.jwt_key_long)
}

function authTokenVerify(request, response, next) {
    const token =  request.headers['authorization']?.split(' ')[1];
    if (!token) return response.sendStatus(401);

    jwt.verify(token, encrypter.security.jwt_key_short, (error));
}

module.exports = {
    makeLongAuthToken
};