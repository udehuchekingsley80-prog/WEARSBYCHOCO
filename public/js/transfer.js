(async function () {
  const user = await initShell('transfer', 'Transfer');
  if (!user) return;

  const fromAccountSelect = document.getElementById('from-account');
  const detailsForm = document.getElementById('details-form');
  const detailsError = document.getElementById('details-error');
  const reviewSummary = document.getElementById('review-summary');
  const reviewError = document.getElementById('review-error');
  const reviewBackBtn = document.getElementById('review-back-btn');
  const reviewConfirmBtn = document.getElementById('review-confirm-btn');
  const confirmationCodeEl = document.getElementById('confirmation-code');
  const successSummary = document.getElementById('success-summary');

  const pinModal = document.getElementById('pin-modal');
  const pinModalClose = document.getElementById('pin-modal-close');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');
  const pinSubmit = document.getElementById('pin-submit');
  const pinSubmitLabel = document.getElementById('pin-submit-label');

  let accounts = [];
  let lastFormValues = null;
  let lastReview = null;

  try {
    const data = await Northstar.get('/api/accounts');
    accounts = data.accounts.filter((a) => a.status === 'active');
    fromAccountSelect.innerHTML = accounts.map((a) => `<option value="${a._id}">${escapeHtml(a.nickname)} — ${formatCents(a.availableBalanceCents)} available</option>`).join('');
  } catch (err) {
    detailsError.textContent = 'Could not load your accounts. Please refresh the page.';
    detailsError.style.display = 'block';
  }

  function goToStep(n) {
    document.querySelectorAll('.wizard-panel').forEach((panel) => panel.classList.remove('active'));
    document.getElementById(`step-${n}`).classList.add('active');

    document.querySelectorAll('[data-step-dot]').forEach((dot) => {
      const step = Number(dot.dataset.stepDot);
      dot.classList.toggle('active', step === n);
      dot.classList.toggle('done', step < n);
    });
  }

  function collectFormValues() {
    return {
      fromAccountId: fromAccountSelect.value,
      amount: document.getElementById('amount').value.trim(),
      transferType: document.getElementById('transfer-type').value,
      recipientName: document.getElementById('recipient-name').value.trim(),
      recipientAccountNumber: document.getElementById('recipient-account').value.trim(),
      recipientRoutingNumber: document.getElementById('recipient-routing').value.trim(),
      recipientEmail: document.getElementById('recipient-email').value.trim(),
      memo: document.getElementById('memo').value.trim(),
      notifyRecipient: document.getElementById('notify-recipient').checked,
    };
  }

  detailsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    detailsError.style.display = 'none';

    lastFormValues = collectFormValues();

    try {
      const data = await Northstar.post('/api/transfers/review', lastFormValues);
      lastReview = data.review;
      renderReview(lastReview);
      goToStep(2);
    } catch (err) {
      detailsError.textContent = err.message;
      detailsError.style.display = 'block';
    }
  });

  function renderReview(review) {
    reviewSummary.innerHTML = `
      <div class="detail-row"><span class="detail-label">From</span><span class="detail-value">${escapeHtml(review.fromAccountNickname)}</span></div>
      <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value tabular">${formatCents(review.amountCents)}</span></div>
      <div class="detail-row"><span class="detail-label">Transfer type</span><span class="detail-value">${escapeHtml(review.transferType)}</span></div>
      <div class="detail-row"><span class="detail-label">Recipient</span><span class="detail-value">${escapeHtml(review.recipientName)}</span></div>
      <div class="detail-row"><span class="detail-label">Recipient account</span><span class="detail-value">${escapeHtml(review.recipientAccountNumber)}</span></div>
      <div class="detail-row"><span class="detail-label">Recipient routing</span><span class="detail-value">${escapeHtml(review.recipientRoutingNumber)}</span></div>
      ${review.recipientEmail ? `<div class="detail-row"><span class="detail-label">Recipient email</span><span class="detail-value">${escapeHtml(review.recipientEmail)}</span></div>` : ''}
      ${review.memo ? `<div class="detail-row"><span class="detail-label">Memo</span><span class="detail-value">${escapeHtml(review.memo)}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">Notify recipient</span><span class="detail-value">${review.notifyRecipient ? 'Yes' : 'No'}</span></div>
      <div class="detail-row"><span class="detail-label">Current balance</span><span class="detail-value tabular">${formatCents(review.currentBalanceCents)}</span></div>
      <div class="detail-row"><span class="detail-label">Balance after transfer</span><span class="detail-value tabular">${formatCents(review.balanceAfterCents)}</span></div>
    `;
  }

  reviewBackBtn.addEventListener('click', () => goToStep(1));

  // "Confirm Transfer" opens the PIN modal — nothing is submitted yet.
  reviewConfirmBtn.addEventListener('click', () => {
    reviewError.style.display = 'none';
    pinError.style.display = 'none';
    pinInput.value = '';
    openModal('pin-modal');
    setTimeout(() => pinInput.focus(), 50);
  });

  pinModalClose.addEventListener('click', () => closeModal('pin-modal'));
  pinModal.addEventListener('click', (e) => {
    if (e.target === pinModal) closeModal('pin-modal');
  });

  pinInput.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
  });

  pinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    pinError.style.display = 'none';

    if (!/^\d{4}$/.test(pinInput.value)) {
      pinError.textContent = 'Please enter your 4-digit PIN.';
      pinError.style.display = 'block';
      return;
    }

    pinSubmit.disabled = true;
    pinSubmitLabel.innerHTML = '<span class="spinner"></span>';

    try {
      const data = await Northstar.post('/api/transfers/confirm', { ...lastFormValues, pin: pinInput.value });
      closeModal('pin-modal');
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      });
      const receiptTimestamp = document.getElementById('receipt-timestamp');
      if (receiptTimestamp) receiptTimestamp.textContent = timestamp;

      confirmationCodeEl.textContent = data.confirmationCode;
      successSummary.innerHTML = `
        <div class="receipt-amount-row">
          <span class="receipt-amount-label">Amount sent</span>
          <span class="receipt-amount tabular">${formatCents(lastReview.amountCents)}</span>
        </div>
        <div class="receipt-divider"></div>
        <div class="detail-row"><span class="detail-label">From account</span><span class="detail-value">${escapeHtml(lastReview.fromAccountNickname)}</span></div>
        <div class="detail-row"><span class="detail-label">Sender</span><span class="detail-value">${escapeHtml(fullNameOf(user))}</span></div>
        <div class="detail-row"><span class="detail-label">Recipient</span><span class="detail-value">${escapeHtml(lastReview.recipientName)}</span></div>
        <div class="detail-row"><span class="detail-label">Recipient account</span><span class="detail-value tabular">${maskAccountNumber(lastReview.recipientAccountNumber)}</span></div>
        <div class="detail-row"><span class="detail-label">Recipient routing</span><span class="detail-value tabular">${escapeHtml(lastReview.recipientRoutingNumber)}</span></div>
        <div class="detail-row"><span class="detail-label">Transfer type</span><span class="detail-value">${escapeHtml(lastReview.transferType)}</span></div>
        ${lastReview.memo ? `<div class="detail-row"><span class="detail-label">Memo</span><span class="detail-value">${escapeHtml(lastReview.memo)}</span></div>` : ''}
        <div class="receipt-divider"></div>
        <div class="detail-row"><span class="detail-label">New balance</span><span class="detail-value tabular">${formatCents(data.newBalanceCents)}</span></div>
      `;
      goToStep(4);
    } catch (err) {
      if (err.status === 403 || err.status === 423) {
        // Incorrect or locked PIN — stay on the modal so the user can retry
        // without re-entering the whole transfer.
        pinError.textContent = err.message;
        pinError.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
      } else {
        // Any other failure (balance changed, account issue, etc.) — back
        // to review with the error shown there.
        closeModal('pin-modal');
        goToStep(2);
        reviewError.textContent = err.message;
        reviewError.style.display = 'block';
      }
    } finally {
      pinSubmit.disabled = false;
      pinSubmitLabel.textContent = 'Verify & Confirm Transfer';
    }
  });
})();
