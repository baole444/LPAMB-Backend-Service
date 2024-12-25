const { 
    bitLengthFast,
    bitLengthString2,
    bitLengthString16,
    bitLength,
} = require('../bigInt/bitLength');
const perf_hooks = require('perf_hooks');

const n = 987898987654567898765423236797687565678766756535467589787245668759787543483453434596432534234790878675645354634756545342635765345346375643534526378676354398987890989999989898745342345232n;

function test1() {
    console.log(`bit length counter.`)
    const startTime = perf_hooks.performance.now();


    const keyLength = bitLengthFast(n);
    console.log(keyLength);


    const endTime = perf_hooks.performance.now();
    console.log(`Test 1 done in ${endTime - startTime}ms.`);
}

function test2() {
    console.log(`bit length tostring 2.`)
    const startTime = perf_hooks.performance.now();


    const keyLength = bitLengthString2(n);
    console.log(keyLength);


    const endTime = perf_hooks.performance.now();
    console.log(`Test 2 done in ${endTime - startTime}ms.`);
}

function test3() {
    console.log(`bit length tostring 16.`)
    const startTime = perf_hooks.performance.now();


    const keyLength = bitLengthString16(n);
    console.log(keyLength);


    const endTime = perf_hooks.performance.now();
    console.log(`Test 3 done in ${endTime - startTime}ms.`);
}

function test4() {
    console.log(`bit length bound check.`)
    const startTime = perf_hooks.performance.now();


    const keyLength = bitLengthFast(n);
    console.log(keyLength);


    const endTime = perf_hooks.performance.now();
    console.log(`Test 4 done in ${endTime - startTime}ms.`);
}

function test() {
    console.log(`n is ${n}`);

    test1();
    test2();
    test3();
    test4();

    process.exit(0);
}

test();