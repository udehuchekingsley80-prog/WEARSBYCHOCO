(async function () {
  const user = await initShell('notifications', 'Notifications');
  if (!user) return;

  const listEl = document.getElementById('notifications-list');
  const emailsWrapper = document.getElementById('emails-wrapper');
  const markAllReadBtn = document.getElementById('mark-all-read-btn');

  const categoryBadge = {
    statement: 'blue', security: 'red', transfer: 'green', rewards: 'amber', general: 'gray',
  };

  async function loadNotifications() {
    listEl.innerHTML = `${skeletonRows(3)}`;
    try {
      const data = await Northstar.get('/api/notifications');
      renderNotifications(data.notifications);
    } catch (err) {
      listEl.innerHTML = errorState(err.message, true);
      const btn = listEl.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', loadNotifications);
    }
  }

  function renderNotifications(notifications) {
    if (!notifications.length) {
      listEl.innerHTML = emptyState('&#128276;', 'No notifications', "You're all caught up.");
      return;
    }

    listEl.innerHTML = notifications.map((n) => `
      <div class="card mb-16" style="${n.isRead ? '' : 'border-left: 3px solid var(--blue-500);'}">
        <div class="flex justify-between items-center mb-16" style="margin-bottom:6px;">
          <span class="badge badge-${categoryBadge[n.category] || 'gray'}">${n.category}</span>
          <span class="text-sm text-muted">${formatDateTime(n.createdAt)}</span>
        </div>
        <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(n.title)}</div>
        <div class="text-sm text-muted">${escapeHtml(n.body)}</div>
      </div>
    `).join('');
  }

  async function loadEmails() {
    emailsWrapper.innerHTML = `<div style="padding:16px;">${skeletonRows(4)}</div>`;
    try {
      const data = await Northstar.get('/api/notifications/emails');
      renderEmails(data.emails);
    } catch (err) {
      emailsWrapper.innerHTML = errorState(err.message, true);
      const btn = emailsWrapper.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', loadEmails);
    }
  }

  function renderEmails(emails) {
    if (!emails.length) {
      emailsWrapper.innerHTML = emptyState('&#128231;', 'No emails sent yet', 'Emails triggered by account activity will appear here.');
      return;
    }

    emailsWrapper.innerHTML = `
      <table>
        <thead><tr><th>Subject</th><th>Recipient</th><th>Type</th><th>Sent</th><th>Status</th></tr></thead>
        <tbody>
          ${emails.map((e) => `
            <tr>
              <td>${escapeHtml(e.subject)}</td>
              <td>${escapeHtml(e.toEmail)}</td>
              <td><span class="badge badge-gray">${escapeHtml(e.type)}</span></td>
              <td>${formatDateTime(e.createdAt)}</td>
              <td><span class="badge badge-${e.status === 'sent' ? 'green' : 'red'}">${e.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  markAllReadBtn.addEventListener('click', async () => {
    markAllReadBtn.disabled = true;
    try {
      await Northstar.post('/api/notifications/mark-all-read', {});
      await loadNotifications();
      refreshNotificationDot();
      Toast.success('All notifications marked as read.');
    } catch (err) {
      Toast.error(err.message);
    } finally {
      markAllReadBtn.disabled = false;
    }
  });

  await Promise.all([loadNotifications(), loadEmails()]);
})();
