const { keyGen, keyGenTest } = require('../rsaGen');
const { addPadding, removePadding } = require('../oaep');
const { 
    bitLengthFast,
} = require('../bigInt/bitLength');

const fs = require('fs');
const yml = require('js-yaml');
const perf_hooks = require('perf_hooks');
const { encrypter, decrypter } = require('../rsaEncrypt');

const rsaCfg = yml.load(fs.readFileSync('../config/rsa.yml', 'utf8'));

function test() {
    const startTime = perf_hooks.performance.now();
    //const result = keyGen(rsaCfg.prime.min, rsaCfg.prime.max, rsaCfg.prime.diff);
    const n = 5100337599352941241007795981536885n;
    const e = 65537n;
    const d = 570720749879530547344129507240595n;
    
    const result = keyGenTest(n, e, d);
    const serialize = JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2
    )
    
    console.log(serialize);

    console.log('Performing Encryption and Decryption test.');

    const publicKey = result.publicKey;
    const privateKey = result.privateKey;  
    //const n = result.publicKey.n;
    const keyLength = bitLengthFast(n);
    console.log(keyLength);

    const message = "This is a very long message. It is so long that I have nothing to say about it.";

    console.log(`Original msg: ${message}`);

    const encryptedmsg = encrypter(message, publicKey, keyLength);

    //console.log(`Encrypted msg: ${encryptedmsg.toString('hex')}`);

    const decryptedmsg = decrypter(encryptedmsg, privateKey, keyLength);

    console.log(`Decrypted msg: ${decryptedmsg}`);

    const endTime = perf_hooks.performance.now();
    console.log(`Test done in ${Math.floor(endTime) - Math.floor(startTime)}ms.`);

    process.exit(0);
}

test();