(async function () {
  const user = await initShell('statements', 'Statements');
  if (!user) return;

  const wrapper = document.getElementById('statements-wrapper');

  async function loadStatements() {
    wrapper.innerHTML = `<div style="padding:16px;">${skeletonRows(5)}</div>`;
    try {
      const data = await Northstar.get('/api/statements');
      renderStatements(data.statements);
    } catch (err) {
      wrapper.innerHTML = errorState(err.message, true);
      const btn = wrapper.querySelector('.js-retry-btn');
      if (btn) btn.addEventListener('click', loadStatements);
    }
  }

  function renderStatements(statements) {
    if (!statements.length) {
      wrapper.innerHTML = emptyState('&#128196;', 'No statements yet', 'Your generated statements will appear here.');
      return;
    }

    wrapper.innerHTML = `
      <table>
        <thead><tr><th>Statement</th><th>Period</th><th>Opening Balance</th><th>Closing Balance</th><th>Generated</th></tr></thead>
        <tbody>
          ${statements.map((s) => `
            <tr>
              <td>${escapeHtml(s.label)}</td>
              <td>${formatDate(s.periodStart)} – ${formatDate(s.periodEnd)}</td>
              <td class="tabular">${formatCents(s.openingBalanceCents)}</td>
              <td class="tabular">${formatCents(s.closingBalanceCents)}</td>
              <td>${formatDate(s.generatedAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  await loadStatements();
})();
