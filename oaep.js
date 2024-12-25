const crypto = require('crypto');

/**
 * A mask generator
 * @param {Buffer} seed randomized seed use to generate mask.
 * @param {Number} maskLength bit length of the mask
 * @returns {ArrayBuffer} a Mask in arraybuffer.
 */
function maskGen(seed, maskLength) {
    const lgth = crypto.createHash('sha256').digest().length;

    let t = Buffer.alloc(0);

    for (let i = 0; i < Math.ceil(maskLength / lgth); i ++) {
        const c = Buffer.alloc(4);
        c.writeUInt32BE(i, 0);

        t = Buffer.concat([t, crypto.createHash('sha256')
            .update(Buffer.concat([seed, c]))
            .digest()]);
    }

    return t.subarray(0, maskLength);
}

/**
 * A XOR operator
 * @param {Buffer} x 
 * @param {Buffer} y 
 * @returns {Buffer}
 */
function xor(x, y) {
    const lgth = Math.max(x.length, y.length);
    const buffer = Buffer.alloc(lgth);
    for (let i = 0; i < lgth; i++) {
        buffer[i] = x[i] ^ y[i];
    }

    return buffer;
}

/**
 * OAEP padding.
 * @param {*} text string of message need to be encoded.
 * @param {Number} keyLength length of RSA modulus (n) in byte 
 * @returns {Buffer} padded text
 */
function addPadding(text, keyLength) {
    keyLength = Number(keyLength);
    const txtLgth = text.length;
    const hashLgth = crypto.createHash('sha256').digest().length;
    const byteStringLgth = keyLength - txtLgth - 2 * hashLgth - 2;

    if (byteStringLgth < 0) throw new Error('Text string too long for padding');

    const lHash = crypto.createHash('sha256').update('').digest();
    const ps = Buffer.alloc(byteStringLgth, 0);
    const db = Buffer.concat([lHash, ps, Buffer.from([1]), Buffer.from(text)]);

    const seed = crypto.randomBytes(hashLgth);
    const dbMask = maskGen(seed, keyLength - hashLgth - 1);
    
    const maskedDB = xor(db, dbMask);
    const seedMask = maskGen(maskedDB, hashLgth);
    const maskedSeed = xor(seed, seedMask);

    return Buffer.concat([Buffer.from([0]), maskedSeed, maskedDB]);
}

function removePadding(paddedTxt, keyLength) {
    const hashLgth = crypto.createHash('sha256').digest().length;
    const maskedSeed = paddedTxt.slice(1, hashLgth + 1);
    const maskedDB = paddedTxt.slice(hashLgth +1);

    const seedMask = maskGen(maskedDB, hashLgth);
    const seed = xor(maskedSeed, seedMask);

    const dbMask = maskGen(seed, keyLength - hashLgth - 1);
    const db = xor(maskedDB, dbMask);

    const lHash = crypto.createHash('sha256').update('').digest();
    const lHashPrime = db.subarray(0, hashLgth);

    if (!lHash.equals(lHashPrime)) {
        throw new Error(
            'Decryption failed: Hash mismatch'
        );
    }

    const txtStart = db.indexOf(1, hashLgth) + 1;

    return db.subarray(txtStart).toString();

}

function string2Chunk(txt, limit) {
    const chunk = [];
    for (let i = 0; i < txt.length; i += limit) {
        chunk.push(txt.slice(i, i + limit));
    }

    return chunk;
}

module.exports = {
    addPadding,
    removePadding,
    string2Chunk
}