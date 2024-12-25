const crypto = require('crypto');
const {
    addPadding,
    removePadding,
    string2Chunk,
} = require('./oaep');
const { modExpo } = require('./rsaGen');

function encrypter(txt, publicKey, keyLength) {
    const chunkSize = keyLength - 2 * crypto.createHash('sha256').digest().length - 2;
    const chunk = string2Chunk(txt, chunkSize);
    //console.log('Encryption chunks: \n', chunk);
    const encrypted = chunk.map(c => {
        const padding = addPadding(c, keyLength);
        console.log(`Padded data (hex): ${padding.toString('hex')}`);
        const toInt = BigInt('0x' + padding.toString('hex'));
        console.log(`Before encryption (BigInt): ${toInt}`);
        const encryptedChunk = modExpo(toInt, publicKey.e, publicKey.n);
        const hexStr = encryptedChunk.toString(16).padStart(keyLength * 2, '0');
        //console.log(`Encrypted chunk hex: ${hexStr}`);
        return Buffer.from(hexStr, 'hex');
    });

    return Buffer.concat(encrypted);
}

function decrypter(txt, privateKey, keyLength) {
    const chunkSize = keyLength;
    const hexStr = txt.toString('hex');

    if (hexStr.length % (chunkSize * 2) !== 0) {
        throw new Error('Invalid encrypted data length.');
    }

    const chunk = string2Chunk(hexStr, chunkSize * 2);
    //console.log('Decryption chunks: \n', chunk);
    const decrypted = chunk.map(c => {
        try {
            const toInt = BigInt('0x' + c);
            const decryptedChunk = modExpo(toInt, privateKey.d, privateKey.n);
            const hex = decryptedChunk.toString(16).padStart(keyLength * 2, '0');
            console.log(`Decrypted padded data (hex): ${hex}`);
            const buffer = Buffer.from(hex, 'hex');
            console.log(`After decryption (Buffer): ${buffer.toString('hex')}`);
            return removePadding(buffer, keyLength);
        } catch (e) {
            console.log(`Decryption failed: ${e.message}`);
        }
    });

    return decrypted.join('');
}

module.exports = {
    encrypter,
    decrypter,
}