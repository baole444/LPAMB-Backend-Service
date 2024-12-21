const { keyGen } = require('../rsaGen');

function test() {
    const min = 100000;
    const max = 1000000000;
    const diff = 1000000;

    const result = keyGen(min, max, diff);

    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
}

test();