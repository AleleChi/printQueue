
/* ════════════════════════════════
   Data Structure Implementation
════════════════════════════════ */
class Queue {
  constructor() { this.items = []; }
  enqueue(item) { this.items.push(item); }
  dequeue() { return this.isEmpty() ? null : this.items.shift(); }
  peek()    { return this.isEmpty() ? null : this.items[0]; }
  isEmpty() { return this.items.length === 0; }
  size()    { return this.items.length; }
  toArray() { return [...this.items]; }
}

class PrinterQueue {
  constructor() { this.queue = new Queue(); this.processed = 0; }
  addJob(name, pages, priority = 'normal') {
    const job = { id: Date.now() + Math.random(), name: name.trim() || 'Untitled', pages: parseInt(pages) || 1, priority };
    this.queue.enqueue(job); return job;
  }
  processJob() { const j = this.queue.dequeue(); if (j) this.processed++; return j; }
  printQueue() { return this.queue.toArray(); }
  peek()       { return this.queue.peek(); }
  isEmpty()    { return this.queue.isEmpty(); }
  clear()      { this.queue = new Queue(); }
  get count()      { return this.queue.size(); }
  get totalPages() { return this.queue.toArray().reduce((s, j) => s + j.pages, 0); }
  get jobs()       { return this.queue.toArray(); }
}

/* ════════════════════════════════
   App
════════════════════════════════ */
const pq = new PrinterQueue();

function initials(name) {
  return name.split(/[\s._\-]+/).map(w => w[0]||'').join('').slice(0,2).toUpperCase() || '?';
}
function ts() {
  return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

function log(msg, type='info') {
  const body = document.getElementById('con-body');
  const empty = body.querySelector('.con-empty');
  if (empty) empty.remove();
  const line = document.createElement('div');
  line.className = 'c-line';
  line.innerHTML = `<span class="c-ts">${ts()}</span><span class="c-msg ${type}-c">${msg}</span>`;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

function bumpStat(id) {
  const el = document.getElementById(id);
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

function renderQueue() {
  document.getElementById('s-count').textContent = pq.count;
  document.getElementById('s-pages').textContent = pq.totalPages;
  document.getElementById('s-done').textContent  = pq.processed;
  const el   = document.getElementById('queue-list');
  const jobs = pq.jobs;
  if (jobs.length === 0) {
    el.innerHTML = `<div class="q-empty">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      No jobs in queue
    </div>`;
    return;
  }
  el.innerHTML = '';
  jobs.forEach((j, i) => {
    const isFirst   = i === 0;
    const isUrgent  = j.priority === 'urgent';
    const cls = 'q-item' + (isFirst ? ' first' : '') + (isUrgent && !isFirst ? ' urgent-item' : '');
    const badge = isFirst
      ? `<span class="q-badge badge-next">Next</span>`
      : isUrgent
        ? `<span class="q-badge badge-urgent">Urgent</span>`
        : `<span class="q-badge badge-wait">#${i+1}</span>`;
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = `
      <span class="q-pos">${i+1}</span>
      <div class="q-av">${initials(j.name)}</div>
      <div class="q-info">
        <div class="q-name">${j.name}</div>
        <div class="q-meta">${j.pages} page${j.pages!==1?'s':''}${isUrgent?' · <span style="color:var(--accent3)">urgent</span>':''}</div>
      </div>
      ${badge}`;
    el.appendChild(div);
  });
}

/* ── Operations ── */
function op_enqueue() {
  const name  = document.getElementById('job-name').value.trim();
  const pages = document.getElementById('job-pages').value;
  const prio  = document.getElementById('job-priority').value;
  if (!name) { document.getElementById('job-name').focus(); return; }
  const job = pq.addJob(name, pages, prio);
  document.getElementById('job-name').value  = '';
  document.getElementById('job-pages').value = '1';
  document.getElementById('job-priority').value = 'normal';
  log(`enqueue() → Added "${job.name}" (${job.pages} pages${prio==='urgent'?' · urgent':''}) — Size: ${pq.count}`, 'enqueue');
  bumpStat('s-count'); bumpStat('s-pages');
  document.getElementById('peek-banner').classList.remove('show');
  document.getElementById('pq-snapshot').classList.remove('show');
  renderQueue();
}

function op_dequeue() {
  if (pq.isEmpty()) { log('dequeue() → null  (queue is empty)', 'clear'); return; }
  const topEl = document.querySelector('.q-item.first');
  if (topEl) topEl.classList.add('leaving');
  setTimeout(() => {
    const job = pq.processJob();
    log(`dequeue() → Processed "${job.name}" (${job.pages} pages) ✓ — Remaining: ${pq.count}`, 'dequeue');
    bumpStat('s-done'); bumpStat('s-count');
    const fl = document.createElement('div');
    fl.className = 'flash-overlay'; document.body.appendChild(fl);
    setTimeout(() => fl.remove(), 400);
    document.getElementById('peek-banner').classList.remove('show');
    document.getElementById('pq-snapshot').classList.remove('show');
    renderQueue();
  }, 290);
}

function op_peek() {
  const job = pq.peek();
  const banner = document.getElementById('peek-banner');
  const text   = document.getElementById('peek-text');
  if (!job) {
    log('peek() → null  (queue is empty)', 'peek');
    banner.classList.remove('show'); return;
  }
  text.textContent = `peek() → "${job.name}" — ${job.pages} page${job.pages!==1?'s':''} (not removed)`;
  banner.classList.add('show');
  log(`peek() → "${job.name}" | ${job.pages} pages  (front of queue — not removed)`, 'peek');
}

function op_isEmpty() {
  const result = pq.isEmpty();
  log(`isEmpty() → ${result}  ${result ? '(no jobs in queue)' : `(${pq.count} job${pq.count!==1?'s':''} pending)`}`, 'empty');
}

function op_printQueue() {
  const jobs = pq.printQueue();
  const snap  = document.getElementById('pq-snapshot');
  const rows  = document.getElementById('pq-rows');
  if (jobs.length === 0) {
    log('printQueue() → Queue is empty. No jobs to display.', 'print');
    snap.classList.remove('show'); return;
  }
  log(`printQueue() → ${jobs.length} job${jobs.length!==1?'s':''} in queue:`, 'print');
  jobs.forEach((j,i) => log(`&nbsp;&nbsp;[${i+1}] "${j.name}" — ${j.pages} page${j.pages!==1?'s':''}${j.priority==='urgent'?' (urgent)':''}`, 'result'));
  rows.innerHTML = jobs.map((j,i) => `
    <div class="pq-row">
      <span class="pq-row-pos">${i+1}.</span>
      <span class="pq-row-name">${j.name}</span>
      <span class="pq-row-pages">${j.pages} pg</span>
    </div>`).join('');
  document.getElementById('pq-count').textContent = `${jobs.length} job${jobs.length!==1?'s':''}`;
  document.getElementById('pq-pages').textContent = `${pq.totalPages} pages total`;
  snap.classList.add('show');
}

function op_clear() {
  if (pq.isEmpty()) { log('clear() → Queue already empty.', 'clear'); return; }
  const n = pq.count;
  pq.clear();
  log(`clear() → Removed all ${n} job${n!==1?'s':''} from queue.`, 'clear');
  bumpStat('s-count'); bumpStat('s-pages');
  document.getElementById('peek-banner').classList.remove('show');
  document.getElementById('pq-snapshot').classList.remove('show');
  renderQueue();
}

function quickAdd(name, pages) {
  document.getElementById('job-name').value  = name;
  document.getElementById('job-pages').value = pages;
  op_enqueue();
}

function clearConsole() {
  document.getElementById('con-body').innerHTML = '<div class="con-empty">// Awaiting operations…</div>';
}

function toggleCode() {
  document.getElementById('code-body').classList.toggle('open');
  document.getElementById('code-chev').classList.toggle('open');
  document.getElementById('code-toggle').classList.toggle('open');
}

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if (e.key==='d'||e.key==='D') op_dequeue();
  if (e.key==='p'||e.key==='P') op_peek();
  if (e.key==='i'||e.key==='I') op_isEmpty();
  if (e.key==='q'||e.key==='Q') op_printQueue();
  if (e.key==='x'||e.key==='X') op_clear();
});
document.getElementById('job-name').addEventListener('keydown', e => { if (e.key==='Enter') op_enqueue(); });

/* ── Seed ── */
pq.addJob('Q4_Financial_Report.pdf', 42);
pq.addJob('Team_Meeting_Agenda.docx', 3);
pq.addJob('Product_Roadmap.pptx', 18, 'urgent');
log('// 3 test jobs loaded — all 5 operations ready', 'info');
log('// Keyboard shortcuts: D · P · I · Q · X', 'info');
renderQueue();
