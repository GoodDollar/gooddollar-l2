const $ = id => document.getElementById(id);
const money = n => `$${Number(n ?? 0).toFixed(4)}`;
const bps = n => `${Number(n ?? 0).toFixed(1)} bps`;

async function api(path, opts={}) {
  const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function refresh() {
  const s = await api('/api/snapshot');
  $('runState').textContent = s.running ? 'Running' : 'Stopped';
  $('dryRun').textContent = s.dryRun ? 'Dry-run' : 'LIVE';
  const h = s.lastHealth || {};
  $('chainState').textContent = h.chainOk ? `${h.chainId} ✓` : `${h.chainId ?? '—'} ✗`;
  $('healthState').textContent = h.status?.overall ? `${h.status.healthy}/${h.status.total} ${h.status.overall}` : (h.statusOk ? 'OK' : '—');
  $('lastScan').textContent = s.lastScanAt ? new Date(s.lastScanAt).toLocaleTimeString() : '—';
  $('venuesCount').textContent = String(s.venues?.length ?? 0);
  $('quotesCount').textContent = String(s.quotes?.length ?? 0);
  $('oppsCount').textContent = String(s.opportunities?.length ?? 0);

  const venues = $('venuesList'); venues.innerHTML = '';
  (s.venues || []).forEach(v => { const li = document.createElement('li'); li.textContent = v; venues.appendChild(li); });
  if (!s.venues?.length) venues.innerHTML = '<li>No enabled venues yet. Wire markets.json adapters/contracts.</li>';

  const errors = $('errorsList'); errors.innerHTML = '';
  (s.errors || []).forEach(e => { const li = document.createElement('li'); li.className='danger'; li.textContent = e; errors.appendChild(li); });
  if (!s.errors?.length) errors.innerHTML = '<li>No errors.</li>';

  const body = $('oppsBody'); body.innerHTML = '';
  if (!s.opportunities?.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty">No opportunities yet.</td></tr>';
  } else {
    for (const o of s.opportunities) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><span class="pill">${o.kind}</span></td><td>${o.description}</td><td>${money(o.notionalUsd)}</td><td>${money(o.expectedProfitUsd)}<br>${bps(o.expectedProfitBps)}</td><td>${(o.risks||[]).join(', ')}</td><td><button data-exec="${o.id}">Dry-run execute</button></td>`;
      body.appendChild(tr);
    }
  }
  document.querySelectorAll('[data-exec]').forEach(btn => btn.onclick = async () => { await api(`/api/execute/${btn.dataset.exec}`, { method:'POST' }); await refresh(); });
}

$('scanBtn').onclick = async () => { await api('/api/scan', { method:'POST' }); await refresh(); };
$('startBtn').onclick = async () => { await api('/api/start', { method:'POST' }); await refresh(); };
$('stopBtn').onclick = async () => { await api('/api/stop', { method:'POST' }); await refresh(); };
refresh();
setInterval(refresh, 5000);
