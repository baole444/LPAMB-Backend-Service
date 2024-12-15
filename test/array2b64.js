const arrayBufferToBase64 = (arrayBuffer) => {
    var base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return base64;
};

function stringToArrayBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
}

function App () {
    const str = arrayBufferToBase64(stringToArrayBuffer('12345abcde'));
    console.log(`Base 64 string is: ${str}`);
}

App();