// cab230-server/generate-cert.js

const selfsigned = require('selfsigned');
const fs = require('fs');

// Define certificate attributes
const attrs = [{ name: 'commonName', value: 'localhost' }];

// Generate a self-signed certificate valid for 365 days
const pems = selfsigned.generate(attrs, { days: 365 });

// Write private key and certificate to disk
fs.writeFileSync('key.pem', pems.private);
fs.writeFileSync('cert.pem', pems.cert);

console.log('✔ key.pem and cert.pem successfully generated (self-signed).');
