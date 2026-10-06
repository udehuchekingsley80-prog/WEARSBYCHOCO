const crypto = require('crypto');

// BIN 0000 is not issued to any real network — nothing generated here can
// ever function as a real payment credential. Routing numbers use the
// fictional prefix 99, which ABA never assigns to a real institution.

function randomDigits(count) {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out;
}

function generateCardNumber() {
  return `0000${randomDigits(12)}`;
}

function generateAccountNumber() {
  return randomDigits(12);
}

function generateRoutingNumber() {
  return `99${randomDigits(7)}`;
}

function generateConfirmationCode() {
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `NSF-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function maskNumber(number, visibleTail = 4) {
  const str = String(number);
  const tail = str.slice(-visibleTail);
  return `•••• •••• •••• ${tail}`;
}

module.exports = {
  generateCardNumber,
  generateAccountNumber,
  generateRoutingNumber,
  generateConfirmationCode,
  maskNumber,
};
