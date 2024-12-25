const coeff = []
const bigCoeff = []
const test = []
let testN = 0;

function bitLengthString2(n = 1n) {
    return n.toString(2).length;
}

function bitLengthString16(n = 1n) {
    const i = (n.toString(16).length - 1) * 4;
    return i + 32 - Math.clz32(Number(n >> BigInt(i)));
}

function bitLengthFast(n = 1n) {
    if (n === 0n) return 0;


    let k = 0;
    while (true) {
        if (testN === k) {
            coeff.push(32 << testN)
            bigCoeff.push(BigInt(coeff[testN]))
            test.push(1n << bigCoeff[testN])
            testN++;
        }
        if (n < test[k]) break;
        k++;
    }

    if (!k) return 32 - Math.clz32(Number(n));

    k--;
    let i = coeff[k];
    let a = n >> bigCoeff[k];
    while (k--) {
        let b = a >> bigCoeff[k];
        if (b) {
            i += coeff[k];
            a = b;
        }
    }

    return i + 32 - Math.clz32(Number(a));
}

function bitLength(n) {
    let i = 0;
    for (let x = n; x > 0n; x >>= 1n) ++i;
    return i;
};

module.exports = {
    bitLengthString2,
    bitLengthString16,
    bitLengthFast,
    bitLength,
}