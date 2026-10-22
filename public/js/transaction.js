(async function () {
  const user = await initShell('transactions', 'Transaction');
  if (!user) return;

  const content = document.getElementById('tx-content');
  const backLink = document.getElementById('back-link');
  backLink.href = 'transactions.html';

  const params = new URLSearchParams(window.location.search);
  const txId = params.get('id');

  if (!txId) {
    content.innerHTML = errorState('No transaction was specified.', false);
    return;
  }

  await load();

  async function load() {
    content.innerHTML = `<div class="skeleton-row" style="height:220px;"></div>`;
    try {
      const data = await Northstar.get(`/api/transactions/${encodeURIComponent(txId)}`);
      render(data);
    } catch (err) {
      content.innerHTML = errorState(err.message, true);
      const btn = content.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', load);
    }
  }

  function render({ transaction: t, account, card, transfer }) {
    document.title = `${t.description} — Northstar Financial`;

    const isCredit = t.direction === 'credit';
    const amountSign = isCredit ? '+' : '-';
    const amountColorVar = isCredit ? 'var(--green-600)' : 'var(--ink-900)';
    const statusBadge = t.status === 'posted' ? 'green' : 'amber';

    const whereRow = card
      ? detailRow('Card', `${card.type === 'credit' ? 'Credit' : 'Debit'} card ${maskCardNumber(card.cardNumber)}`)
      : account
        ? detailRow('Account', `${escapeHtml(account.nickname)} ${maskAccountNumber(account.accountNumber)}`)
        : '';

    let transferSection = '';
    if (transfer) {
      transferSection = `
        <div class="section-header" style="margin-top:28px;"><h2 style="font-size:14px;">Transfer Details</h2></div>
        <div class="card">
          ${detailRow('Recipient', escapeHtml(transfer.recipientName))}
          ${detailRow('Recipient account', escapeHtml(transfer.recipientAccountNumber))}
          ${detailRow('Recipient routing', escapeHtml(transfer.recipientRoutingNumber))}
          ${transfer.recipientEmail ? detailRow('Recipient email', escapeHtml(transfer.recipientEmail)) : ''}
          ${detailRow('Transfer type', escapeHtml(transfer.transferType))}
          ${transfer.memo ? detailRow('Memo', escapeHtml(transfer.memo)) : ''}
          <div class="confirmation-code" style="margin-top:14px;">${escapeHtml(transfer.confirmationCode)}</div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="text-sm text-muted">${escapeHtml(t.category)}</div>
            <div class="tx-title">${escapeHtml(t.description)}</div>
            ${t.merchant ? `<div class="text-sm text-muted" style="margin-top:2px;">${escapeHtml(t.merchant)}</div>` : ''}
          </div>
          <span class="badge badge-${statusBadge}">${escapeHtml(t.status)}</span>
        </div>

        <div class="tabular tx-amount" style="color:${amountColorVar};">
          ${amountSign}${formatCents(t.amountCents)}
        </div>

        <div style="margin-top:24px;">
          ${detailRow('Date', formatDateTime(t.createdAt))}
          ${whereRow}
          ${detailRow('Category', escapeHtml(t.category))}
          ${detailRow('Type', escapeHtml(t.type))}
          ${detailRow('Balance after', formatCents(t.balanceAfterCents))}
        </div>
      </div>

      ${transferSection}
    `;
  }

  function detailRow(label, value) {
    return `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
  }
})();
