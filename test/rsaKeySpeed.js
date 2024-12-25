const { keyGen } = require('../rsaGen');
const perf_hooks = require('perf_hooks');

function test() {
    const min = 10000000000000n;
    const max = 10000000000000000n;
    const diff = 1000000000000n;
    const startTime = perf_hooks.performance.now();
    const result = keyGen(min, max, diff);

    const endTime = perf_hooks.performance.now();
    console.log(`Test done in ${endTime - startTime}ms.`);

    console.log('Result:');

    const serialize = JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2
    )
    
    console.log(serialize);

    process.exit(0);
}

test();