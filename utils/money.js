// Every dollar amount in this application is stored and handled as an
// integer number of cents. Never use parseFloat or float division on money.

/**
 * Turns a human dollar string like "967,000.00", "$1,234", or "12.5" into an
 * integer number of cents. Uses only regex + parseInt — never parseFloat.
 * Throws if the input is not a valid dollar amount.
 */
function parseDollarsToCents(input) {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new Error('Invalid amount');
    input = String(input);
  }
  if (typeof input !== 'string') throw new Error('Invalid amount');

  const cleaned = input.trim().replace(/^\$/, '').replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) throw new Error('Invalid amount');

  const wholePart = match[1];
  let fractionPart = match[2] || '0';
  if (fractionPart.length === 1) fractionPart += '0';

  const wholeCents = parseInt(wholePart, 10) * 100;
  const fractionCents = parseInt(fractionPart, 10);

  if (Number.isNaN(wholeCents) || Number.isNaN(fractionCents)) {
    throw new Error('Invalid amount');
  }

  return wholeCents + fractionCents;
}

/**
 * Turns an integer number of cents into a formatted dollar string like
 * "$967,000.00". Uses Math.trunc/% only — never float division.
 */
function formatCents(cents) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) {
    throw new Error('Invalid cents value');
  }
  const negative = cents < 0;
  const absCents = Math.trunc(Math.abs(cents));
  const dollars = Math.trunc(absCents / 100);
  const remainder = absCents % 100;

  const dollarsStr = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const centsStr = remainder < 10 ? `0${remainder}` : `${remainder}`;

  return `${negative ? '-' : ''}$${dollarsStr}.${centsStr}`;
}

module.exports = { parseDollarsToCents, formatCents };
