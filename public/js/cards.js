(async function () {
  const user = await initShell('cards', 'Cards');
  if (!user) return;

  const container = document.getElementById('cards-container');
  const payModal = document.getElementById('pay-modal');
  const payForm = document.getElementById('pay-form');
  const payFromAccount = document.getElementById('pay-from-account');
  const payAmount = document.getElementById('pay-amount');
  const payError = document.getElementById('pay-error');
  const paySubmit = document.getElementById('pay-submit');
  const paySubmitLabel = document.getElementById('pay-submit-label');
  const payModalClose = document.getElementById('pay-modal-close');

  let cards = [];
  let accounts = [];
  let activePaymentCardId = null;

  await loadCards();

  async function loadCards() {
    try {
      const [cardsData, accountsData] = await Promise.all([
        Northstar.get('/api/cards'),
        Northstar.get('/api/accounts'),
      ]);
      cards = cardsData.cards;
      accounts = accountsData.accounts;
      renderCards();
    } catch (err) {
      container.innerHTML = errorState(err.message, true);
      const btn = container.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', loadCards);
    }
  }

  function chipSvg(cardId) {
    return `
      <svg class="paycard-chip" viewBox="0 0 40 30" aria-hidden="true">
        <defs>
          <linearGradient id="chipGold-${cardId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff3c9"/>
            <stop offset="35%" stop-color="#e8c975"/>
            <stop offset="70%" stop-color="#c9a24a"/>
            <stop offset="100%" stop-color="#a67c2e"/>
          </linearGradient>
          <linearGradient id="chipShine-${cardId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
            <stop offset="40%" stop-color="#ffffff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect x="0.6" y="0.6" width="38.8" height="28.8" rx="5.5" fill="url(#chipGold-${cardId})" stroke="#7a5a20" stroke-width="0.7"/>
        <rect x="3.4" y="3.4" width="33.2" height="23.2" rx="2.8" fill="none" stroke="#7a5a20" stroke-width="0.6" opacity="0.55"/>
        <g stroke="#7a5a20" stroke-width="0.6" opacity="0.55">
          <line x1="14.6" y1="3.4" x2="14.6" y2="26.6"/>
          <line x1="25.4" y1="3.4" x2="25.4" y2="26.6"/>
          <line x1="3.4" y1="15" x2="36.6" y2="15"/>
        </g>
        <rect x="0.6" y="0.6" width="38.8" height="28.8" rx="5.5" fill="url(#chipShine-${cardId})"/>
      </svg>
    `;
  }

  function renderCards() {
    if (!cards.length) {
      container.innerHTML = emptyState('&#128179;', 'No cards yet', 'Your debit and credit cards will appear here.');
      return;
    }

    container.innerHTML = cards.map((card) => {
      const isCredit = card.type === 'credit';
      const availableCredit = isCredit ? card.creditLimitCents - card.creditBalanceCents : null;

      return `
      <div class="paycard-block" data-card-id="${card._id}">
        <div class="paycard ${card.type} ${card.status === 'frozen' ? 'frozen' : ''}" data-visual="${card._id}">
          <div class="paycard-top">
            ${chipSvg(card._id)}
            <span class="paycard-network">Northstar Network</span>
          </div>
          <div class="paycard-number" data-number="${card._id}">${maskCardNumber(card.cardNumber)}</div>
          <div class="paycard-bottom">
            <div>
              <div class="paycard-holder">${escapeHtml(card.cardHolder)}</div>
              <div class="paycard-expiry">Exp ${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}</div>
            </div>
            <span class="badge badge-${card.status === 'active' ? 'green' : card.status === 'frozen' ? 'red' : 'gray'}">${card.status}</span>
          </div>
        </div>

        <div class="paycard-actions">
          <button class="btn btn-outline btn-sm js-toggle-number" data-id="${card._id}" type="button">Show number</button>
          <button class="btn btn-outline btn-sm js-toggle-freeze" data-id="${card._id}" type="button">${card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}</button>
          ${isCredit ? `<button class="btn btn-primary btn-sm js-open-pay" data-id="${card._id}" type="button">Make a payment</button>` : ''}
        </div>

        ${isCredit ? `
        <div class="paycard-details">
          <div class="detail-row"><span class="detail-label">Credit limit</span><span class="detail-value tabular">${formatCents(card.creditLimitCents)}</span></div>
          <div class="detail-row"><span class="detail-label">Current balance</span><span class="detail-value tabular">${formatCents(card.creditBalanceCents)}</span></div>
          <div class="detail-row"><span class="detail-label">Available credit</span><span class="detail-value tabular">${formatCents(availableCredit)}</span></div>
          <div class="detail-row"><span class="detail-label">Statement balance</span><span class="detail-value tabular">${formatCents(card.statementBalanceCents)}</span></div>
          <div class="detail-row"><span class="detail-label">Minimum payment</span><span class="detail-value tabular">${formatCents(card.minimumPaymentCents)}</span></div>
          <div class="detail-row"><span class="detail-label">Payment due</span><span class="detail-value">${formatDate(card.paymentDueDate)}</span></div>
          <div class="detail-row"><span class="detail-label">APR</span><span class="detail-value">${(card.aprBps / 100).toFixed(2)}%</span></div>
        </div>` : ''}

        <div class="section-header" style="margin-top:4px;"><h2 style="font-size:14px;">Recent Activity</h2></div>
        <div class="table-wrapper" id="activity-${card._id}">
          <div style="padding:12px;">${skeletonRows(3)}</div>
        </div>
      </div>
      `;
    }).join('');

    cards.forEach((card) => loadCardActivity(card._id));
    wireCardEvents();
  }

  async function loadCardActivity(cardId) {
    const el = document.getElementById(`activity-${cardId}`);
    try {
      const data = await Northstar.get(`/api/cards/${cardId}/transactions?limit=5`);
      if (!data.transactions.length) {
        el.innerHTML = emptyState('&#128203;', 'No activity yet', 'Purchases and payments will show up here.');
        return;
      }
      el.innerHTML = `
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            ${data.transactions.map((t) => `
              <tr>
                <td>${formatDate(t.createdAt)}</td>
                <td>${escapeHtml(t.description)}</td>
                <td class="tabular ${t.direction === 'credit' ? 'amount-credit' : 'amount-debit'}">${t.direction === 'credit' ? '+' : '-'}${formatCents(t.amountCents)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      el.innerHTML = errorState(err.message, false);
    }
  }

  function wireCardEvents() {
    container.querySelectorAll('.js-toggle-number').forEach((btn) => {
      btn.addEventListener('click', () => toggleNumber(btn));
    });
    container.querySelectorAll('.js-toggle-freeze').forEach((btn) => {
      btn.addEventListener('click', () => toggleFreeze(btn));
    });
    container.querySelectorAll('.js-open-pay').forEach((btn) => {
      btn.addEventListener('click', () => openPayModal(btn.dataset.id));
    });
  }

  const remaskTimers = {};

  function toggleNumber(btn) {
    const id = btn.dataset.id;
    const numberEl = document.querySelector(`[data-number="${id}"]`);
    const card = cards.find((c) => c._id === id);
    const isMasked = numberEl.dataset.state !== 'revealed';

    if (isMasked) {
      numberEl.textContent = card.cardNumber.replace(/(.{4})/g, '$1 ').trim();
      numberEl.dataset.state = 'revealed';
      btn.textContent = 'Hide number';
      clearTimeout(remaskTimers[id]);
      remaskTimers[id] = setTimeout(() => {
        numberEl.textContent = maskCardNumber(card.cardNumber);
        numberEl.dataset.state = 'masked';
        btn.textContent = 'Show number';
      }, 8000);
    } else {
      numberEl.textContent = maskCardNumber(card.cardNumber);
      numberEl.dataset.state = 'masked';
      btn.textContent = 'Show number';
      clearTimeout(remaskTimers[id]);
    }
  }

  async function toggleFreeze(btn) {
    const id = btn.dataset.id;
    btn.disabled = true;
    try {
      const data = await Northstar.post(`/api/cards/${id}/freeze`, {});
      const idx = cards.findIndex((c) => c._id === id);
      cards[idx] = data.card;
      renderCards();
      Toast.success(`Card ${data.card.status === 'frozen' ? 'frozen' : 'unfrozen'} successfully.`);
    } catch (err) {
      Toast.error(err.message);
      btn.disabled = false;
    }
  }

  function openPayModal(cardId) {
    activePaymentCardId = cardId;
    payError.style.display = 'none';
    payAmount.value = '';

    payFromAccount.innerHTML = accounts.map((a) => `<option value="${a._id}">${escapeHtml(a.nickname)} — ${formatCents(a.availableBalanceCents)} available</option>`).join('');

    openModal('pay-modal');
  }

  payModalClose.addEventListener('click', () => closeModal('pay-modal'));
  payModal.addEventListener('click', (e) => {
    if (e.target === payModal) closeModal('pay-modal');
  });

  payForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    payError.style.display = 'none';
    paySubmit.disabled = true;
    paySubmitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      const data = await Northstar.post(`/api/cards/${activePaymentCardId}/pay`, {
        fromAccountId: payFromAccount.value,
        amount: payAmount.value,
      });
      closeModal('pay-modal');
      Toast.success('Payment submitted successfully.');
      await loadCards();
    } catch (err) {
      payError.textContent = err.message;
      payError.style.display = 'block';
    } finally {
      paySubmit.disabled = false;
      paySubmitLabel.textContent = 'Submit Payment';
    }
  });
})();
