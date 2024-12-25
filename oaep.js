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

        const hash = crypto.createHash('sha256')
            .update(Buffer.concat([seed, c]))
            .digest();
        
        //console.log(`maskGen iteration ${i}: ${hash.toString('hex')}`);
        
        t = Buffer.concat([t, hash]);
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
        buffer[i] = (x[i] || 0) ^ (y[i] || 0);
    }
    //console.log(`xor result: ${buffer.toString('hex')}`);
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
    console.log(`lHash during padding: ${lHash.toString('hex')}`);
    const ps = Buffer.alloc(byteStringLgth, 0);
    const db = Buffer.concat([lHash, ps, Buffer.from([1]), Buffer.from(text)]);
    console.log(`DB during padding: ${db.toString('hex')}`);
    const seed = crypto.randomBytes(hashLgth);
    console.log(`Seed during padding: ${seed.toString('hex')}`);
    const dbMask = maskGen(seed, keyLength - hashLgth - 1);
    console.log(`DB mask during padding: ${dbMask.toString('hex')}`);
    const maskedDB = xor(db, dbMask);
    console.log(`Masked DB during padding: ${maskedDB.toString('hex')}`);
    const seedMask = maskGen(maskedDB, hashLgth);
    console.log(`Seed mask during padding: ${seedMask.toString('hex')}`);
    const maskedSeed = xor(seed, seedMask);
    console.log(`Masked seed during padding: ${maskedSeed.toString('hex')}`);
    const paddedData = Buffer.concat([Buffer.from([0]), maskedSeed, maskedDB]);
    console.log(`Padded data: ${paddedData.toString('hex')}`);
    return paddedData;
}

function removePadding(paddedTxt, keyLength) {
    const hashLgth = crypto.createHash('sha256').digest().length;
    const maskedSeed = paddedTxt.slice(1, hashLgth + 1);
    const maskedDB = paddedTxt.slice(hashLgth +1);
    console.log(`Masked seed during unpadding: ${maskedSeed.toString('hex')}`);
    console.log(`Masked DB during unpadding: ${maskedDB.toString('hex')}`);
    const seedMask = maskGen(maskedDB, hashLgth);
    console.log(`Seed mask during unpadding: ${seedMask.toString('hex')}`);
    const seed = xor(maskedSeed, seedMask);
    console.log(`Seed during unpadding: ${seed.toString('hex')}`);
    const dbMask = maskGen(seed, keyLength - hashLgth - 1);
    console.log(`DB mask during unpadding: ${dbMask.toString('hex')}`);
    const db = xor(maskedDB, dbMask);
    console.log(`DB during unpadding: ${db.toString('hex')}`);
    const lHash = crypto.createHash('sha256').update('').digest();
    console.log(`lHash during unpadding: ${lHash.toString('hex')}`);
    const lHashPrime = db.subarray(0, hashLgth);
    console.log(`lHashPrime during unpadding: ${lHashPrime.toString('hex')}`);
    if (!lHash.equals(lHashPrime)) {
        throw new Error(
            'lHash mismatch'
        );
    }

    const txtStart = db.indexOf(1, hashLgth) + 1;

    return db.subarray(txtStart).toString();
}

function string2Chunk(txt, limit) {
    console.log(`Chunk limit: ${limit}`);
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