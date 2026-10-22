(async function () {
  const user = await initShell('rewards', 'Rewards');
  if (!user) return;

  const summaryEl = document.getElementById('rewards-summary');
  const activityWrapper = document.getElementById('activity-wrapper');

  try {
    const data = await Northstar.get('/api/rewards');

    if (!data.rewards) {
      summaryEl.innerHTML = emptyState('&#127942;', 'No rewards program yet', 'Rewards will appear here once your credit card is enrolled.');
      activityWrapper.innerHTML = '';
      return;
    }

    const { rewards, activity } = data;

    summaryEl.innerHTML = `
      <div class="card" style="background: linear-gradient(135deg, #3b1f66 0%, #1a0f2e 100%); color:#fff; border:none;">
        <div class="flex justify-between items-center">
          <div>
            <div class="rewards-eyebrow">Northstar Rewards</div>
            <div class="rewards-points tabular">${rewards.pointsBalance.toLocaleString('en-US')} pts</div>
          </div>
          <span class="badge badge-amber">${rewards.tier} Tier</span>
        </div>
        <div class="text-sm mt-16" style="opacity:0.85;">${rewards.pointsToNextTier.toLocaleString('en-US')} points to next tier</div>
      </div>
    `;

    if (!activity.length) {
      activityWrapper.innerHTML = emptyState('&#128202;', 'No points activity yet', 'Points earned from purchases will appear here.');
      return;
    }

    activityWrapper.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Points</th></tr></thead>
        <tbody>
          ${activity.map((a) => `
            <tr>
              <td>${formatDate(a.createdAt)}</td>
              <td>${escapeHtml(a.description)}</td>
              <td class="tabular amount-credit">+${a.points.toLocaleString('en-US')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    summaryEl.innerHTML = errorState(err.message, false);
    activityWrapper.innerHTML = '';
  }
})();
