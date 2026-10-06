(async function () {
  const user = await initShell('transactions', 'Activity');
  if (!user) return;

  const searchInput = document.getElementById('search-input');
  const accountFilter = document.getElementById('account-filter');
  const cardFilter = document.getElementById('card-filter');
  const directionFilter = document.getElementById('direction-filter');
  const startDate = document.getElementById('start-date');
  const endDate = document.getElementById('end-date');
  const txWrapper = document.getElementById('tx-wrapper');
  const pageInfo = document.getElementById('page-info');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');

  let page = 1;
  let totalPages = 1;

  try {
    const [accountsData, cardsData] = await Promise.all([
      Northstar.get('/api/accounts'),
      Northstar.get('/api/cards'),
    ]);
    accountFilter.innerHTML += accountsData.accounts.map((a) => `<option value="${a._id}">${escapeHtml(a.nickname)}</option>`).join('');
    cardFilter.innerHTML += cardsData.cards.map((c) => `<option value="${c._id}">${c.type === 'credit' ? 'Credit' : 'Debit'} — ${maskCardNumber(c.cardNumber)}</option>`).join('');
  } catch (err) {
    // filters are a non-critical enhancement; table load below will surface errors
  }

  function buildQuery() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
    if (accountFilter.value) params.set('accountId', accountFilter.value);
    if (cardFilter.value) params.set('cardId', cardFilter.value);
    if (directionFilter.value) params.set('direction', directionFilter.value);
    if (startDate.value) params.set('startDate', startDate.value);
    if (endDate.value) params.set('endDate', endDate.value);
    params.set('page', page);
    params.set('pageSize', 20);
    return params.toString();
  }

  async function loadTransactions() {
    txWrapper.innerHTML = `<div style="padding:16px;">${skeletonRows(6)}</div>`;

    try {
      const data = await Northstar.get(`/api/transactions?${buildQuery()}`);
      totalPages = data.totalPages;
      renderTable(data.transactions);
      pageInfo.textContent = `Page ${data.page} of ${data.totalPages} — ${data.total} result${data.total === 1 ? '' : 's'}`;
      prevPageBtn.disabled = data.page <= 1;
      nextPageBtn.disabled = data.page >= data.totalPages;
    } catch (err) {
      txWrapper.innerHTML = errorState(err.message, true);
      const btn = txWrapper.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', loadTransactions);
      pageInfo.textContent = '';
    }
  }

  function renderTable(transactions) {
    if (!transactions.length) {
      txWrapper.innerHTML = emptyState('&#128269;', 'No transactions found', 'Try adjusting your search or filters.');
      return;
    }

    txWrapper.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Merchant</th><th>Category</th><th>Amount</th></tr></thead>
        <tbody>
          ${transactions.map((t) => `
            <tr class="js-tx-row" data-id="${t._id}" style="cursor:pointer;">
              <td>${formatDate(t.createdAt)}</td>
              <td>${escapeHtml(t.description)}</td>
              <td>${escapeHtml(t.merchant || '—')}</td>
              <td><span class="badge badge-gray">${escapeHtml(t.category)}</span></td>
              <td class="tabular ${t.direction === 'credit' ? 'amount-credit' : 'amount-debit'}">${t.direction === 'credit' ? '+' : '-'}${formatCents(t.amountCents)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    txWrapper.querySelectorAll('.js-tx-row').forEach((row) => {
      row.addEventListener('click', () => {
        window.location.href = `transaction.html?id=${row.dataset.id}`;
      });
    });
  }

  const debouncedLoad = debounce(() => { page = 1; loadTransactions(); }, 350);

  [searchInput, startDate, endDate].forEach((el) => el.addEventListener('input', debouncedLoad));
  [accountFilter, cardFilter, directionFilter].forEach((el) => el.addEventListener('change', () => { page = 1; loadTransactions(); }));

  prevPageBtn.addEventListener('click', () => { if (page > 1) { page -= 1; loadTransactions(); } });
  nextPageBtn.addEventListener('click', () => { if (page < totalPages) { page += 1; loadTransactions(); } });

  await loadTransactions();
})();
