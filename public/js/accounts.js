(async function () {
  const user = await initShell('accounts', 'Accounts');
  if (!user) return;

  const accountGrid = document.getElementById('account-grid');
  const detailSection = document.getElementById('account-detail');
  const detailTitle = document.getElementById('detail-title');
  const detailFields = document.getElementById('detail-fields');
  const detailTransactions = document.getElementById('detail-transactions');
  const closeDetailBtn = document.getElementById('close-detail-btn');

  let accounts = [];

  closeDetailBtn.addEventListener('click', () => {
    detailSection.style.display = 'none';
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
  });

  await loadAccounts();

  const preselectId = new URLSearchParams(window.location.search).get('id');
  if (preselectId) {
    const match = accounts.find((a) => a._id === preselectId);
    if (match) showDetail(match);
  }

  async function loadAccounts() {
    try {
      const data = await Northstar.get('/api/accounts');
      accounts = data.accounts;
      renderAccounts();
    } catch (err) {
      accountGrid.innerHTML = errorState(err.message, true);
      const btn = accountGrid.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', loadAccounts);
    }
  }

  function renderAccounts() {
    if (!accounts.length) {
      accountGrid.innerHTML = emptyState('&#128179;', 'No accounts yet', 'Your accounts will appear here once opened.');
      return;
    }

    accountGrid.innerHTML = accounts.map((a) => `
      <div class="account-tile ${a.type}" data-id="${a._id}">
        <div class="account-tile-top">
          <div>
            <div class="account-tile-label">${escapeHtml(a.nickname)}</div>
            <div class="account-tile-balance tabular">${formatCents(a.balanceCents)}</div>
          </div>
          <span class="badge badge-${a.status === 'active' ? 'green' : 'red'}">${a.status}</span>
        </div>
        <div class="account-tile-meta">
          <span>${maskAccountNumber(a.accountNumber)}</span>
          <span>Available: ${formatCents(a.availableBalanceCents)}</span>
        </div>
      </div>
    `).join('');

    accountGrid.querySelectorAll('.account-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        const account = accounts.find((a) => a._id === tile.dataset.id);
        if (account) showDetail(account);
      });
    });
  }

  async function showDetail(account) {
    detailSection.style.display = 'block';
    detailTitle.textContent = account.nickname;

    detailFields.innerHTML = `
      <div class="detail-row"><span class="detail-label">Account number</span><span class="detail-value">${maskAccountNumber(account.accountNumber)}</span></div>
      <div class="detail-row"><span class="detail-label">Routing number</span><span class="detail-value">${escapeHtml(account.routingNumber)}</span></div>
      <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${account.type === 'checking' ? 'Checking' : 'Savings'}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge badge-${account.status === 'active' ? 'green' : 'red'}">${account.status}</span></span></div>
      <div class="detail-row"><span class="detail-label">Opened</span><span class="detail-value">${formatDate(account.openedAt)}</span></div>
      ${account.interestRateBps ? `<div class="detail-row"><span class="detail-label">APY</span><span class="detail-value">${(account.interestRateBps / 100).toFixed(2)}%</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">Current balance</span><span class="detail-value tabular">${formatCents(account.balanceCents)}</span></div>
      <div class="detail-row"><span class="detail-label">Available balance</span><span class="detail-value tabular">${formatCents(account.availableBalanceCents)}</span></div>
    `;

    detailTransactions.innerHTML = `<div style="padding:16px;">${skeletonRows(4)}</div>`;
    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const data = await Northstar.get(`/api/accounts/${account._id}/transactions`);
      renderTransactions(data.transactions);
    } catch (err) {
      detailTransactions.innerHTML = errorState(err.message, true);
      const btn = detailTransactions.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', () => showDetail(account));
    }
  }

  function renderTransactions(transactions) {
    if (!transactions.length) {
      detailTransactions.innerHTML = emptyState('&#128203;', 'No transactions yet', 'Activity on this account will show up here.');
      return;
    }

    detailTransactions.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Balance</th></tr></thead>
        <tbody>
          ${transactions.map((t) => `
            <tr>
              <td>${formatDate(t.createdAt)}</td>
              <td>${escapeHtml(t.description)}</td>
              <td><span class="badge badge-gray">${escapeHtml(t.category)}</span></td>
              <td class="tabular ${t.direction === 'credit' ? 'amount-credit' : 'amount-debit'}">${t.direction === 'credit' ? '+' : '-'}${formatCents(t.amountCents)}</td>
              <td class="tabular">${formatCents(t.balanceAfterCents)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
})();
