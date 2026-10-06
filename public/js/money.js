// Client-side mirror of utils/money.js formatCents. Never uses float
// division — only Math.trunc/% on the integer cents value.
function formatCents(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return '$0.00';
  const negative = value < 0;
  const absCents = Math.trunc(Math.abs(value));
  const dollars = Math.trunc(absCents / 100);
  const remainder = absCents % 100;
  const dollarsStr = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const centsStr = remainder < 10 ? `0${remainder}` : `${remainder}`;
  return `${negative ? '-' : ''}$${dollarsStr}.${centsStr}`;
}

function maskAccountNumber(number) {
  const str = String(number || '');
  return `••••${str.slice(-4)}`;
}

function maskCardNumber(number) {
  const str = String(number || '');
  return `•••• •••• •••• ${str.slice(-4)}`;
}

function formatDate(dateInput) {
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateInput) {
  const d = new Date(dateInput);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
