const coeff = []
const bigCoeff = []
const test = []
let testN = 0;

function bitLengthString2(n = 1n) {
    const bl = n.toString(2).length;
    return Math.ceil(bl / 8);
}

function bitLengthString16(n = 1n) {
    const bl = (() => {
        const i = (n.toString(16).length - 1) * 4;
        return i + 32 - Math.clz32(Number(n >> BigInt(i)));
    })();
    return Math.ceil(bl / 8);

}

function bitLengthFast(n = 1n) {
    if (n === 0n) return 0;

    const bl = (() => {
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
    })();

    return Math.ceil(bl / 8);
}

function bitLength(n) {
    let i = 0;
    for (let x = n; x > 0n; x >>= 1n) ++i;
    return Math.ceil(i / 8);
};

module.exports = {
    bitLengthString2,
    bitLengthString16,
    bitLengthFast,
    bitLength,
}