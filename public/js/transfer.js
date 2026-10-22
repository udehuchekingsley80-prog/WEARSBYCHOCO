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
  const downloadReceiptBtn = document.getElementById('download-receipt-btn');
  let receiptTimestampText = '';

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
  let lastNewBalanceCents = null;

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
      receiptTimestampText = timestamp;
      lastNewBalanceCents = data.newBalanceCents;

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

  // Downloadable, print-ready receipt (opens the print dialog so the user
  // can save it as a PDF, like a real bank receipt).
  function downloadReceipt() {
    const code = confirmationCodeEl.textContent || '';
    const amount = formatCents(lastReview.amountCents);
    const from = lastReview.fromAccountNickname;
    const sender = fullNameOf(user);
    const recipient = lastReview.recipientName;
    const recipientAccount = maskAccountNumber(lastReview.recipientAccountNumber);
    const routing = lastReview.recipientRoutingNumber;
    const type = lastReview.transferType;
    const memo = lastReview.memo;
    const balanceText = formatCents(lastNewBalanceCents != null ? lastNewBalanceCents : lastReview.balanceAfterCents);
    const when = receiptTimestampText || new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

    const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Transfer Receipt - ' + code + '</title>' +
      '<style>*{box-sizing:border-box}body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:32px;color:#12161f;background:#fff}.receipt{max-width:460px;margin:0 auto;border:1px solid #e1e4ea;border-radius:12px;padding:28px 26px}.brand{display:flex;align-items:center;gap:10px;font-family:IBM Plex Sans,sans-serif;font-weight:700;font-size:17px;color:#0d1b33}.brand-mark{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3b82f6,#1c4fd6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px}.check{width:48px;height:48px;margin:14px auto 10px;border-radius:50%;background:#e8f8ef;color:#0a8a52;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700}.title{text-align:center;margin:0 0 4px;font-family:IBM Plex Sans,sans-serif;font-size:20px;font-weight:700;color:#12161f}.subtitle{text-align:center;font-size:13px;color:#69707e;margin:0 0 16px}.code-block{text-align:center;padding:14px 0;border-top:1px dashed #e1e4ea;border-bottom:1px dashed #e1e4ea;margin-bottom:4px}.code-label{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#69707e}.code{font-family:IBM Plex Sans,monospace;font-size:17px;font-weight:700;color:#1c4fd6;background:#eef3ff;padding:8px 14px;border-radius:8px;display:inline-block;margin-top:6px}.amount-row{display:flex;justify-content:space-between;align-items:baseline;padding:14px 0 10px}.amount-label{font-size:12px;font-weight:600;color:#69707e;text-transform:uppercase;letter-spacing:.4px}.amount{font-family:IBM Plex Sans,sans-serif;font-size:26px;font-weight:700;color:#12161f}.divider{height:1px;background:#e1e4ea;margin:6px 0 8px}.row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;gap:12px}.label{color:#69707e}.value{color:#12161f;font-weight:600;text-align:right;word-break:break-word}.footer{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid #e1e4ea}.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;background:#e8f8ef;color:#0a8a52}.ts{font-size:12px;color:#69707e}.note{font-size:11.5px;color:#9aa1ad;text-align:center;margin-top:18px;line-height:1.5}@media print{body{padding:0}.receipt{border:none}}</style></head><body><div class="receipt"><div class="brand"><span class="brand-mark">N</span><span>Northstar Financial</span></div><div class="check">&#10003;</div><h1 class="title">Transfer Receipt</h1><p class="subtitle">Your transfer has been completed successfully.</p><div class="code-block"><div class="code-label">Confirmation code</div><div class="code">' + escapeHtml(code) + '</div></div><div class="amount-row"><span class="amount-label">Amount sent</span><span class="amount">' + escapeHtml(amount) + '</span></div><div class="divider"></div>' +
      '<div class="row"><span class="label">From account</span><span class="value">' + escapeHtml(from) + '</span></div>' +
      '<div class="row"><span class="label">Sender</span><span class="value">' + escapeHtml(sender) + '</span></div>' +
      '<div class="row"><span class="label">Recipient</span><span class="value">' + escapeHtml(recipient) + '</span></div>' +
      '<div class="row"><span class="label">Recipient account</span><span class="value">' + escapeHtml(recipientAccount) + '</span></div>' +
      '<div class="row"><span class="label">Recipient routing</span><span class="value">' + escapeHtml(routing) + '</span></div>' +
      '<div class="row"><span class="label">Transfer type</span><span class="value">' + escapeHtml(type) + '</span></div>' +
      (memo ? '<div class="row"><span class="label">Memo</span><span class="value">' + escapeHtml(memo) + '</span></div>' : '') +
      '<div class="divider"></div><div class="row"><span class="label">New balance</span><span class="value">' + escapeHtml(balanceText) + '</span></div>' +
      '<div class="footer"><span class="badge">Completed</span><span class="ts">' + escapeHtml(when) + '</span></div>' +
      '<p class="note">This is an official record of your transfer. Keep this receipt for your records. If you did not authorize this transfer, contact Northstar Financial support immediately.</p></div>' +
      '<script>window.onload=function(){window.print();};</script></body></html>';

    const win = window.open('', '_blank', 'width=560,height=820');
    if (!win) {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'northstar-receipt-' + code + '.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', downloadReceipt);
  }

})();
