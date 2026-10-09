(() => {
  const $ = id => document.getElementById(id);
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => {
    const section = $(button.dataset.scroll);
    if (section) { section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); const heading = section.querySelector('h2'); heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }));
  if (!$('scan-form')) return;
  const storageKey = 'scan-aml-report';
  let pending;
  let revision = 0;
  const network = () => document.querySelector('input[name="network"]:checked').value;
  const message = (text, error = false) => { $('form-message').textContent = text; $('form-message').classList.toggle('error', error); $('address').setAttribute('aria-invalid', String(error)); };
  const forget = () => { try { sessionStorage.removeItem(storageKey); } catch {} };
  function resetReport() {
    revision++;
    clearTimeout(pending);
    $('scan-button').disabled = false;
    $('scan-button').innerHTML = 'Check wallet risk <span aria-hidden="true">→</span>';
    $('report-panel').setAttribute('aria-busy', 'false');
    $('risk-score').textContent = '—';
    $('risk-level').textContent = 'Know what to review.';
    $('risk-summary').textContent = 'Your score and exposure breakdown will appear here after an address check.';
    $('report-status').textContent = 'Awaiting address';
    $('score-gauge').style.background = '';
    [['direct', 50], ['indirect', 30], ['activity', 20]].forEach(([key, max]) => { $(key + '-bar').style.width = '0%'; $(key + '-value').textContent = '— / ' + max; });
    $('report-reference').textContent = 'Address and check time appear here.';
    $('report-reference').removeAttribute('title');
  }
  function updateNetwork() {
    resetReport(); forget();
    const eth = network() === 'eth';
    $('address').placeholder = eth ? 'Enter an Ethereum address (0x…)' : 'Enter a Bitcoin mainnet address';
    $('address-hint').textContent = eth ? 'Ethereum · 0x followed by 40 hexadecimal characters' : 'Bitcoin · starts with 1, 3, bc1q, or bc1p';
    message('Paste a public address to get started.');
  }
  function validAddress(address, chain) {
    if (chain === 'eth') return /^0x[0-9a-fA-F]{40}$/.test(address);
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || (/^(bc1q[ac-hj-np-z02-9]{38}|bc1q[ac-hj-np-z02-9]{58}|bc1p[ac-hj-np-z02-9]{58})$/i.test(address) && (address === address.toLowerCase() || address === address.toUpperCase()));
  }
  function scoreAddress(address, chain) {
    const normalized = chain === 'eth' || /^bc1/i.test(address) ? address.toLowerCase() : address;
    let hash = 2166136261;
    for (const char of chain + normalized) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    return { direct: hash % 51, indirect: (hash >>> 8) % 31, activity: (hash >>> 16) % 21 };
  }
  function render(address, chain, timestamp) {
    const scores = scoreAddress(address, chain);
    const score = scores.direct + scores.indirect + scores.activity;
    const level = score < 25 ? 'Lower priority' : score < 60 ? 'Closer review' : 'High priority';
    $('risk-score').textContent = score;
    $('risk-level').textContent = level;
    $('risk-summary').textContent = score < 25 ? 'Confirm the full address, network, and payment details before your transaction.' : score < 60 ? 'Review the largest exposure contributor and the context of this payment.' : 'Resolve exposure concerns and gather supporting context before proceeding.';
    $('report-status').textContent = chain === 'eth' ? 'Ethereum report' : 'Bitcoin report';
    $('score-gauge').style.background = `conic-gradient(from 225deg, #2563EB ${score * 2.7}deg, #dce5f3 ${score * 2.7}deg, #dce5f3 270deg, transparent 270deg)`;
    [['direct', 50], ['indirect', 30], ['activity', 20]].forEach(([key, max]) => { $(key + '-bar').style.width = `${scores[key] / max * 100}%`; $(key + '-value').textContent = `${scores[key]} / ${max}`; });
    const time = new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    $('report-reference').textContent = `${address.slice(0, 6)}…${address.slice(-5)} · ${time}`;
    $('report-reference').title = address;
    message(`Report ready. Risk score ${score} out of 100. ${level}.`);
  }
  document.querySelectorAll('input[name="network"]').forEach(input => input.addEventListener('change', updateNetwork));
  $('address').addEventListener('input', () => { resetReport(); forget(); message('Address updated. Run a check to refresh the report.'); });
  $('clear-address').addEventListener('click', () => { $('address').value = ''; resetReport(); forget(); message('Address and report cleared.'); $('address').focus(); });
  $('scan-form').addEventListener('submit', event => {
    event.preventDefault(); resetReport(); forget();
    const address = $('address').value.trim();
    const chain = network();
    if (!address) { message('Enter a public wallet address to run a check.', true); $('address').focus(); return; }
    if (!validAddress(address, chain)) { message(chain === 'eth' ? 'Use 0x followed by exactly 40 hexadecimal characters.' : 'Enter a Bitcoin mainnet address with the correct length and characters.', true); $('address').focus(); return; }
    $('address').value = address;
    $('scan-button').disabled = true;
    $('scan-button').textContent = 'Preparing risk report…';
    $('report-panel').setAttribute('aria-busy', 'true');
    $('report-status').textContent = 'Preparing report';
    message('Preparing the address report…');
    const version = revision;
    pending = setTimeout(() => {
      if (version !== revision) return;
      const timestamp = Date.now();
      render(address, chain, timestamp);
      $('report-panel').setAttribute('aria-busy', 'false');
      $('scan-button').disabled = false;
      $('scan-button').innerHTML = 'Check wallet risk <span aria-hidden="true">→</span>';
      try { sessionStorage.setItem(storageKey, JSON.stringify({ address, chain, timestamp })); } catch {}
    }, 360);
  });
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && ['eth', 'btc'].includes(saved.chain) && typeof saved.address === 'string' && validAddress(saved.address, saved.chain) && Number.isFinite(saved.timestamp)) {
      document.querySelector(`input[name="network"][value="${saved.chain}"]`).checked = true;
      updateNetwork();
      $('address').value = saved.address;
      render(saved.address, saved.chain, saved.timestamp);
      sessionStorage.setItem(storageKey, JSON.stringify(saved));
    }
  } catch { forget(); }
})();
