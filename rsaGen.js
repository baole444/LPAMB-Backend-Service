function integerRandomizer(min, max) {
    return BigInt(Math.floor(Math.random() * (Number(max) - Number(min))) + Number(min));
}

// Skip generate 2 or 3 prime from input as this is too small for rsa
// Prime formulation 6n + 1 or 6n - 1
function primeGen(n = 1n) {
    if (n < 1n) return -1; 
    const choice = integerRandomizer(0, 1);

    if (choice === 1) {
        return BigInt(6n * n + 1n);
    } else {
        return BigInt(6n * n - 1n);
    }
}

function genPairPrime(min, max, diff) {
    const firstInt = integerRandomizer(min, max);
    const secondInt = integerRandomizer(firstInt + diff + min, firstInt + max + diff);

    const firstPrime = primeGen(firstInt);
    const secondPrime = primeGen(secondInt);

    if (firstPrime < 1 || secondPrime < 1) {
        return { p: null, q: null }
    }
    
    return { p: firstPrime, q: secondPrime};
}

function findGCD(a, b) {
    a = BigInt(a);
    b = BigInt(b);

    while (b !== 0n) {
        [a, b] = [b, a % b];
    }
    return a;
}

function findLCM(p, q) {
    const gcd = findGCD(p, q);
    return BigInt((p * q) / gcd);
}

function findE(CarmichaelTotientN) {
    let e = 65537n;

    if (findGCD(e, CarmichaelTotientN) === 1n) {
        return e;
    } else {
        for (let i = e; i < CarmichaelTotientN; i++) {
            if (findGCD(i, CarmichaelTotientN) === 1n) {
                return i;
            }
        }
    }
}

function modInverse(e, CarmichaelTotientN) {
    let coefficient = 0n, newCoefficient = 1n;
    let remainder = CarmichaelTotientN, newRemainder = e;
    while (newRemainder !== 0n) {
        const quotient = remainder / newRemainder;

        [coefficient, newCoefficient] = [newCoefficient, (coefficient - quotient * newCoefficient) % CarmichaelTotientN];
        [remainder, newRemainder] = [newRemainder, remainder % newRemainder];
    }

    if (coefficient < 0n) {
        coefficient += CarmichaelTotientN;
    }

    return coefficient;
}

function keyGen(min, max, diff) {
    min = BigInt(min);
    max = BigInt(max);
    diff = BigInt(diff);

    const { p, q } = genPairPrime(min, max, diff);

    //console.log('Primes selected:');
    //console.log(`p: ${p}`);
    //console.log(`q: ${q}`);

    const n = p * q;
    //console.log(`n: ${n}`);

    const CarmichaelTotientN = findLCM(p - 1n, q - 1n);
    //console.log(`Lambda N: ${CarmichaelTotientN}`);

    const e = findE(CarmichaelTotientN);
    //console.log(`e: ${e}`);

    const d = modInverse(e, CarmichaelTotientN);
    //console.log(`d: ${d}`);

    const publicKey = { n, e };
    const privateKey = { n, d };

    return { publicKey, privateKey }
}

function keyGenTest(n, e, d) {

    const publicKey = { n, e };
    const privateKey = { n, d };

    return { publicKey, privateKey }
}

function modExpo(m, e, n) {
    if (n === 1n) return 0n;

    let result = 1n;

    m = m % n;

    while (e > 0n) {
        if (e % 2n === 1n) {
            result = (result * m) % n;
        }

        e = e / 2n;

        m = (m * m) % n;
    }

    return result;
}

module.exports = {
    keyGen,
    modExpo,
    keyGenTest,
}