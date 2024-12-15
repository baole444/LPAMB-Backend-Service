const jwt = require('jsonwebtoken');
const fs = require('fs');
const yml = require('js-yaml');

const encrypter = yml.load(fs.readFileSync('../userAuth/encrypter.yml', 'utf8'));

function makeShortAuthToken(userId) {
    try {
        return jwt.sign({ id: userId }, encrypter.security.jwt_key_short, { expiresIn: '1d' });
    } catch (e) {
        console.error(e.message);
        return `Short token generation failed.`;
    }

}

function makeLongAuthToken(userId) {
    try {
        return jwt.sign({ id: userId }, encrypter.security.jwt_key_long);
    } catch (e) {
        console.error(e.message);
        return `Long token generation failed.`;
    }
}

function authTokenVerify(request, response, next) {
    const token =  request.headers['authorization']?.split(' ')[1];
    if (!token) return response.sendStatus(401);

    jwt.verify(token, encrypter.security.jwt_key_short, (error));
}

function RunTest() {
    const id = "2d39bc92-b47d-11ef-81d5-d8bbc1b40ca4";

    const shortT = makeShortAuthToken(id);
    const longT = makeLongAuthToken(id);

    console.log(`Short term token is:\n >> ${shortT}`);
    console.log(`Long term token is:\n >> ${longT}`);
    console.log(`Short Token length was: ${shortT.length}`);
    console.log(`Long Token length was: ${longT.length}`);

    return;
}

RunTest();