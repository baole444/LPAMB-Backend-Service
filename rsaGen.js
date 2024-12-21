const perf_hooks = require('perf_hooks');
const term = require('./interface');

function integerRandomizer(min, max) {
    return Math.floor(Math.random() *(max - min)) + min;
}

// Skip generate 2 or 3 prime from input as this is too small for rsa
// Prime formulation 6n + 1 or 6n - 1
function primeGen(n = 1) {
    if (n < 1) return -1; 
    const choice = integerRandomizer(0, 1);

    if (choice === 1) {
        return 6*n + 1;
    } else {
        return 6*n - 1;
    }
}

function genPairPrime(min, max, diff) {
    const firstInt = integerRandomizer(min, max);
    const secondInt = integerRandomizer(firstInt + diff, firstInt + max + diff);

    const firstPrime = primeGen(firstInt);
    const secondPrime = primeGen(secondInt);

    if (firstPrime < 1 || secondPrime < 1) {
        return { p: null, q: null }
    }
    
    return { p: firstPrime, q: secondPrime};
}

function findGCD(a, b) {
    for (let tmp = b; b != 0;) {
        b = a % b;
        a = tmp;
        tmp = b;
    }

    return a;
}

function findLCM(p, q) {
    const gcd = findGCD(p, q);
    return (p * q) / gcd;
}

function findE(CarmichaelTotientN) {
    let e = 0;
    while (e < 3) {
        const choice = integerRandomizer(2, CarmichaelTotientN - 1);
        if (findGCD(choice, CarmichaelTotientN) === 1) {
            e = choice;
        }
    }
    return e;
}

function modInverse(e, CarmichaelTotientN) {
    let coefficient = 0, newCoefficient = 1;
    let remainder = CarmichaelTotientN, newRemainder = e;

    while (newRemainder !== 0) {
        const quotient = Math.floor(remainder / newRemainder);

        [coefficient, newCoefficient] = [newCoefficient, coefficient - quotient * newCoefficient];
        [remainder, newRemainder] = [newRemainder, remainder - quotient * newRemainder];
    }

    if (coefficient < 0) {
        coefficient += CarmichaelTotientN;
    }

    return coefficient;
}

function keyGen(min, max, diff) {
    console.log('Generating new public and private key.');

    const startTime = perf_hooks.performance.now();

    const { p, q } = genPairPrime(min, max, diff);

    const n = p * q;

    const CarmichaelTotientN = findLCM(p - 1, q - 1);

    const e =  findE(CarmichaelTotientN);

    const d = modInverse(e, CarmichaelTotientN);

    const publicKey = { n, e };
    const privateKey = { n, d };

    const endTime = perf_hooks.performance.now();
    console.log(`Key generation took ${Math.floor(endTime) - Math.floor(startTime)}ms.`);
    return { publicKey, privateKey }
}

module.exports = {
    keyGen,
}