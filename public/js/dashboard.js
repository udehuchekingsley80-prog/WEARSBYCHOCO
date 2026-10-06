(async function () {
  const user = await initShell('dashboard', 'Dashboard');
  if (!user) return;

  const greeting = document.getElementById('greeting');
  greeting.textContent = `Hello, welcome, ${user.title || 'Mr.'} ${user.lastName}.`;

  await loadDashboard();

  async function loadDashboard() {
    const statGrid = document.getElementById('stat-grid');
    const accountGrid = document.getElementById('account-grid');
    const activityWrapper = document.getElementById('activity-wrapper');

    try {
      const [accountsData, cardsData, txData] = await Promise.all([
        Northstar.get('/api/accounts'),
        Northstar.get('/api/cards'),
        Northstar.get('/api/transactions?pageSize=8'),
      ]);

      renderStats(accountsData.accounts, cardsData.cards, statGrid);
      renderAccounts(accountsData.accounts, accountGrid);
      renderActivity(txData.transactions, activityWrapper);
    } catch (err) {
      statGrid.innerHTML = errorState(err.message, true);
      accountGrid.innerHTML = '';
      activityWrapper.innerHTML = errorState(err.message, true);
      wireRetry(statGrid, loadDashboard);
      wireRetry(activityWrapper, loadDashboard);
    }
  }

  function wireRetry(container, fn) {
    const btn = container.querySelector('.js-retry-btn');
    if (btn) btn.addEventListener('click', fn);
  }

  function renderStats(accounts, cards, container) {
    const totalCashCents = accounts.reduce((sum, a) => sum + a.availableBalanceCents, 0);
    const creditCard = cards.find((c) => c.type === 'credit');
    const availableCreditCents = creditCard ? creditCard.creditLimitCents - creditCard.creditBalanceCents : 0;
    const activeCards = cards.filter((c) => c.status === 'active').length;
    const frozenCards = cards.filter((c) => c.status === 'frozen').length;

    container.innerHTML = `
      <div class="stat-tile">
        <div class="stat-label">Total Cash</div>
        <div class="stat-value tabular">${formatCents(totalCashCents)}</div>
        <div class="stat-sub">${accounts.length} account${accounts.length === 1 ? '' : 's'}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">Available Credit</div>
        <div class="stat-value tabular">${creditCard ? formatCents(availableCreditCents) : '—'}</div>
        <div class="stat-sub">${creditCard ? `of ${formatCents(creditCard.creditLimitCents)} limit` : 'No credit card'}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">Card Status</div>
        <div class="stat-value">${activeCards} Active</div>
        <div class="stat-sub">${frozenCards > 0 ? `${frozenCards} frozen` : 'All cards in good standing'}</div>
      </div>
    `;
  }

  function renderAccounts(accounts, container) {
    if (!accounts.length) {
      container.innerHTML = emptyState('&#128179;', 'No accounts yet', 'Your accounts will appear here once opened.');
      return;
    }

    container.innerHTML = accounts.map((a) => `
      <a class="account-tile ${a.type}" href="accounts.html?id=${a._id}">
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
      </a>
    `).join('');
  }

  function renderActivity(transactions, container) {
    if (!transactions.length) {
      container.innerHTML = emptyState('&#128203;', 'No recent activity', 'Transactions will show up here as they happen.');
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
        </thead>
        <tbody>
          ${transactions.map((t) => `
            <tr class="js-tx-row" data-id="${t._id}" style="cursor:pointer;">
              <td>${formatDate(t.createdAt)}</td>
              <td>${escapeHtml(t.description)}</td>
              <td><span class="badge badge-gray">${escapeHtml(t.category)}</span></td>
              <td class="tabular ${t.direction === 'credit' ? 'amount-credit' : 'amount-debit'}">${t.direction === 'credit' ? '+' : '-'}${formatCents(t.amountCents)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.js-tx-row').forEach((row) => {
      row.addEventListener('click', () => {
        window.location.href = `transaction.html?id=${row.dataset.id}`;
      });
    });
  }
})();
