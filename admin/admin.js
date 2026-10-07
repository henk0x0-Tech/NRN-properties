// ============================================================
// NRN PROPERTIES — ADMIN CPANEL JavaScript
// localStorage-based DBMS (works as flat-file JSON CMS)
// ============================================================

const DATA_KEY = 'nrn_cms_data';
const SESSION_KEY = 'nrn_admin_session';

// ── Utility: Load/Save DB ──────────────────────────────────
async function loadDB() {
  // 1. Fetch from active Node.js API backend first
  try {
    const res = await fetch('/api/data?_=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data && data.residences) {
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (apiErr) {
    // API not reachable or static, continue
  }

  // 2. Try localStorage
  const local = localStorage.getItem(DATA_KEY);
  if (local) {
    try { return JSON.parse(local); } catch(e) {}
  }

  // 3. Fall back to static data.json (relative to admin folder)
  try {
    const res = await fetch('../data.json?_=' + Date.now());
    const data = await res.json();
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return data;
  } catch(e) {
    console.error('Failed to load data.json', e);
    return getDefaultData();
  }
}

async function saveDB(data) {
  data._meta = data._meta || {};
  data._meta.lastUpdated = new Date().toISOString();
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  setSaveStatus('Saving changes...');

  // Sync to Node.js backend API
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setSaveStatus('All changes saved to Server (Node.js)');
    } else {
      setSaveStatus('Saved locally (Cache)');
    }
  } catch (e) {
    setSaveStatus('Saved to local storage');
  }

  updateLastSaveTime();
  refreshDashboardStats(data);
  return data;
}

function getDefaultData() {
  return { site: {}, stats: [], residences: [], leads: [], subscribers: [], adminCredentials: { username: 'admin', passwordHash: 'nrn2026@admin' } };
}

// ── Global DB reference ────────────────────────────────────
let DB = null;

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (isLoggedIn()) {
    showAdminPanel();
  } else {
    showLoginScreen();
  }
});

// ── Auth ───────────────────────────────────────────────────
function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

async function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  DB = await loadDB();
  const creds = DB.adminCredentials || { username: 'admin', passwordHash: 'nrn2026@admin' };

  if (user === creds.username && pass === creds.passwordHash) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    errorEl.style.display = 'none';
    showAdminPanel();
  } else {
    errorEl.style.display = 'block';
    document.getElementById('login-pass').value = '';
  }
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

async function showAdminPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';

  if (!DB) DB = await loadDB();

  // Init all panels
  renderDashboard();
  renderPropertyList();
  renderSiteSettings();
  renderStatsEditor();
  renderLeadsTable();
  renderSubscribersTable();
  renderJsonEditor();
  updateBadges();
}

// ── Panel Navigation ───────────────────────────────────────
function showPanel(panelId, clickedEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const panel = document.getElementById('panel-' + panelId);
  if (panel) panel.classList.add('active');
  if (clickedEl) clickedEl.classList.add('active');

  // Refresh panel data
  if (panelId === 'database') renderJsonEditor();
  if (panelId === 'leads') renderLeadsTable();
  if (panelId === 'subscribers') renderSubscribersTable();
  if (panelId === 'properties') renderPropertyList();
}

function toggleSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  const main = document.getElementById('admin-main');
  sidebar.classList.toggle('collapsed');
  main.classList.toggle('sidebar-collapsed');
}

// ── Dashboard ──────────────────────────────────────────────
function renderDashboard() {
  refreshDashboardStats(DB);
  renderRecentLeads();
}

function refreshDashboardStats(data) {
  const residences = data.residences || [];
  const leads = data.leads || [];
  const subs = data.subscribers || [];
  const featured = residences.filter(r => r.featured).length;

  setEl('dash-properties', residences.length);
  setEl('dash-leads', leads.length);
  setEl('dash-subs', subs.length);
  setEl('dash-featured', featured);
}

function renderRecentLeads() {
  const el = document.getElementById('dash-recent-leads');
  const leads = (DB.leads || []).slice(-5).reverse();
  if (leads.length === 0) {
    el.innerHTML = '<div class="empty-state-sm">No leads yet. They\'ll appear here when users submit inquiries.</div>';
    return;
  }
  el.innerHTML = leads.map(l => `
    <div style="padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
      <div>
        <div style="font-weight:600; font-size:0.875rem;">${escHtml(l.name || 'Anonymous')}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${escHtml(l.inquiry || '')} · ${formatDate(l.date)}</div>
      </div>
      <span style="font-size:0.6875rem; background:var(--green-dim); color:var(--green); padding:2px 8px; border-radius:4px; font-weight:700;">NEW</span>
    </div>
  `).join('');
}

// ── Properties ─────────────────────────────────────────────
function renderPropertyList() {
  const container = document.getElementById('property-list');
  const residences = DB.residences || [];
  if (residences.length === 0) {
    container.innerHTML = '<div class="empty-state-sm" style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:3rem;text-align:center;">No properties yet. Click "Add Property" to get started.</div>';
    return;
  }
  container.innerHTML = residences.map((r, i) => `
    <div class="property-row">
      <img class="property-row-img" src="${escHtml(r.image)}" alt="${escHtml(r.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 80 60\'%3E%3Crect fill=\'%23131824\' width=\'80\' height=\'60\'/%3E%3C/svg%3E'">
      <div class="property-row-info">
        <div class="property-row-title">${escHtml(r.title)}</div>
        <div class="property-row-meta">${escHtml(r.location)} · ${escHtml(r.specs?.beds || '')} · ${escHtml(r.specs?.sqft || '')}</div>
        <div style="margin-top:4px; display:flex; gap:6px; flex-wrap:wrap;">
          <span class="status-pill ${r.status || 'available'}">${r.status || 'available'}</span>
          ${r.featured ? '<span style="font-size:0.6875rem; background:var(--gold-dim); color:var(--gold); padding:2px 8px; border-radius:4px; font-weight:700;">★ Featured</span>' : ''}
        </div>
      </div>
      <div class="property-row-price">${escHtml(r.priceFormatted || '')}</div>
      <div class="property-row-actions">
        <button class="btn-icon-edit" onclick="editProperty(${i})" title="Edit">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="btn-icon-danger" onclick="deleteProperty(${i})" title="Delete">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Property Modal ───────────────────────────────────────────
let editingPropertyIndex = null;
let roomCount = 0;

function openPropertyModal(index = null) {
  editingPropertyIndex = index;
  roomCount = 0;
  const modal = document.getElementById('property-modal');
  modal.style.display = 'flex';
  document.getElementById('modal-title-text').textContent = index !== null ? 'Edit Property' : 'Add New Property';

  // Reset form
  resetPropertyForm();

  if (index !== null) {
    const p = DB.residences[index];
    populatePropertyForm(p);
  }

  switchModalTab('basic', document.querySelector('.modal-tab'));
}

function closePropertyModal() {
  document.getElementById('property-modal').style.display = 'none';
  editingPropertyIndex = null;
}

function editProperty(index) {
  openPropertyModal(index);
}

function deleteProperty(index) {
  if (!confirm(`Delete "${DB.residences[index].title}"? This cannot be undone.`)) return;
  DB.residences.splice(index, 1);
  saveDB(DB);
  renderPropertyList();
  toast('Property deleted', 'success');
}

function resetPropertyForm() {
  const fields = ['p-id','p-title','p-location','p-landmark','p-badge','p-description','p-priceInr','p-priceFormatted','p-beds','p-baths','p-sqft','p-plates','p-image'];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  setSelect('p-locationKey', 'ec-phase1');
  setSelect('p-type', 'sky-mansion');
  setSelect('p-tier', 'tier-2');
  setSelect('p-status', 'available');
  setSelect('p-featured', 'false');
  document.getElementById('rooms-editor').innerHTML = '';
  document.getElementById('p-image-preview').style.display = 'none';
  roomCount = 0;
}

function populatePropertyForm(p) {
  setVal('p-id', p.id);
  setVal('p-title', p.title);
  setVal('p-location', p.location);
  setVal('p-landmark', p.landmark);
  setVal('p-badge', p.badge);
  setVal('p-description', p.description);
  setVal('p-priceInr', p.priceInr);
  setVal('p-priceFormatted', p.priceFormatted);
  setVal('p-beds', p.specs?.beds || '');
  setVal('p-baths', p.specs?.baths || '');
  setVal('p-sqft', p.specs?.sqft || '');
  setVal('p-plates', (p.plates || []).join('\n'));
  setVal('p-image', p.image);
  setSelect('p-locationKey', p.locationKey || 'ec-phase1');
  setSelect('p-type', p.type || 'sky-mansion');
  setSelect('p-tier', p.specs?.tier || 'tier-2');
  setSelect('p-status', p.status || 'available');
  setSelect('p-featured', p.featured ? 'true' : 'false');

  // Preview image
  if (p.image) {
    const prev = document.getElementById('p-image-preview');
    prev.src = p.image;
    prev.style.display = 'block';
  }

  // Rooms
  const roomsEl = document.getElementById('rooms-editor');
  roomsEl.innerHTML = '';
  roomCount = 0;
  (p.rooms || []).forEach(room => addRoomField(room));
}

function addRoomField(roomData = null) {
  const idx = roomCount++;
  const container = document.getElementById('rooms-editor');
  const div = document.createElement('div');
  div.className = 'room-row';
  div.id = 'room-row-' + idx;
  div.innerHTML = `
    <div class="room-row-header">
      <span class="room-row-label">Room / Space ${idx + 1}</span>
      <button type="button" class="btn-icon-danger" onclick="removeRoom(${idx})">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Room ID</label>
        <input type="text" id="room-id-${idx}" value="${escHtml(roomData?.id || '')}" placeholder="living">
      </div>
      <div class="form-field">
        <label>Room Name</label>
        <input type="text" id="room-name-${idx}" value="${escHtml(roomData?.name || '')}" placeholder="Grand Living Salon">
      </div>
    </div>
    <div class="form-field">
      <label>360° Panorama Image URL</label>
      <input type="url" id="room-panorama-${idx}" value="${escHtml(roomData?.panorama || '')}" placeholder="https://images.unsplash.com/...">
    </div>
    <div class="form-field">
      <label>Room Description</label>
      <input type="text" id="room-desc-${idx}" value="${escHtml(roomData?.desc || '')}" placeholder="Double-height salon with...">
    </div>
  `;
  container.appendChild(div);
}

function removeRoom(idx) {
  const el = document.getElementById('room-row-' + idx);
  if (el) el.remove();
}

function saveProperty() {
  const id = document.getElementById('p-id').value.trim();
  if (!id) { toast('Property ID is required', 'error'); return; }
  if (!document.getElementById('p-title').value.trim()) { toast('Property title is required', 'error'); return; }

  // Collect rooms
  const rooms = [];
  document.querySelectorAll('[id^="room-row-"]').forEach(row => {
    const idx = row.id.replace('room-row-', '');
    const rId = document.getElementById('room-id-' + idx)?.value.trim();
    const rName = document.getElementById('room-name-' + idx)?.value.trim();
    if (rId && rName) {
      rooms.push({
        id: rId,
        name: rName,
        panorama: document.getElementById('room-panorama-' + idx)?.value.trim() || '',
        desc: document.getElementById('room-desc-' + idx)?.value.trim() || ''
      });
    }
  });

  const prop = {
    id,
    title: document.getElementById('p-title').value.trim(),
    location: document.getElementById('p-location').value.trim(),
    locationKey: getSelect('p-locationKey'),
    landmark: document.getElementById('p-landmark').value.trim(),
    type: getSelect('p-type'),
    priceInr: parseFloat(document.getElementById('p-priceInr').value) || 0,
    priceFormatted: document.getElementById('p-priceFormatted').value.trim(),
    badge: document.getElementById('p-badge').value.trim(),
    image: document.getElementById('p-image').value.trim(),
    specs: {
      beds: document.getElementById('p-beds').value.trim(),
      baths: document.getElementById('p-baths').value.trim(),
      sqft: document.getElementById('p-sqft').value.trim(),
      tier: getSelect('p-tier')
    },
    plates: document.getElementById('p-plates').value.split('\n').map(s => s.trim()).filter(Boolean),
    rooms,
    description: document.getElementById('p-description').value.trim(),
    featured: getSelect('p-featured') === 'true',
    status: getSelect('p-status')
  };

  if (editingPropertyIndex !== null) {
    DB.residences[editingPropertyIndex] = prop;
    toast('Property updated successfully', 'success');
  } else {
    // Check for duplicate ID
    const dup = DB.residences.findIndex(r => r.id === id);
    if (dup !== -1) { toast('Property ID already exists. Choose a different ID.', 'error'); return; }
    DB.residences.push(prop);
    toast('Property added successfully', 'success');
  }

  saveDB(DB);
  renderPropertyList();
  closePropertyModal();
}

function previewPropertyImage() {
  const url = document.getElementById('p-image').value.trim();
  const prev = document.getElementById('p-image-preview');
  if (url) { prev.src = url; prev.style.display = 'block'; }
  else { prev.style.display = 'none'; }
}

function switchModalTab(tabName, btn) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Site Settings & Google Analytics ───────────────────────
function renderSiteSettings() {
  const s = DB.site || {};
  const map = ['brandName','tagline','heroTitle','heroSubtitle','heroEyebrow','heroEyebrowSub','whatsappNumber','email','phone','officePhase1','officePhase2','footerCopyright','reraText'];
  map.forEach(key => setVal('s-' + key, s[key] || ''));

  // Google Analytics Settings
  const ga = DB.analytics || { googleAnalyticsId: 'G-XXXXXXXXXX', enabled: true, trackEvents: true };
  const gaInput = document.getElementById('s-gaId');
  if (gaInput) gaInput.value = ga.googleAnalyticsId || 'G-XXXXXXXXXX';

  const gaEnabled = document.getElementById('s-gaEnabled');
  if (gaEnabled) gaEnabled.checked = ga.enabled !== false;

  const gaEvents = document.getElementById('s-gaTrackEvents');
  if (gaEvents) gaEvents.checked = ga.trackEvents !== false;
}

function saveSiteSettings() {
  const map = ['brandName','tagline','heroTitle','heroSubtitle','heroEyebrow','heroEyebrowSub','whatsappNumber','email','phone','officePhase1','officePhase2','footerCopyright','reraText'];
  DB.site = DB.site || {};
  map.forEach(key => { DB.site[key] = getVal('s-' + key); });

  // Save Google Analytics Configuration
  const gaId = (getVal('s-gaId') || 'G-XXXXXXXXXX').trim();
  const gaEnabled = document.getElementById('s-gaEnabled')?.checked ?? true;
  const gaTrackEvents = document.getElementById('s-gaTrackEvents')?.checked ?? true;

  DB.analytics = {
    googleAnalyticsId: gaId,
    enabled: gaEnabled,
    trackEvents: gaTrackEvents,
    lastConfigured: new Date().toISOString()
  };

  // Update localStorage for immediate frontend effect
  localStorage.setItem('NRN_GA_ID', gaId);

  saveDB(DB);
  toast('Site & Google Analytics settings saved successfully!', 'success');
}

// ── Stats ──────────────────────────────────────────────────
function renderStatsEditor() {
  const container = document.getElementById('stats-editor');
  const stats = DB.stats || [];
  container.innerHTML = stats.map((s, i) => `
    <div class="stat-edit-card">
      <h4>Stat ${i + 1}</h4>
      <div class="form-field">
        <label>Value</label>
        <input type="text" id="stat-val-${i}" value="${escHtml(s.value || '')}">
      </div>
      <div class="form-field">
        <label>Unit (suffix)</label>
        <input type="text" id="stat-unit-${i}" value="${escHtml(s.unit || '')}">
      </div>
      <div class="form-field">
        <label>Label</label>
        <input type="text" id="stat-label-${i}" value="${escHtml(s.label || '')}">
      </div>
    </div>
  `).join('');
}

function saveStats() {
  const stats = DB.stats || [];
  stats.forEach((s, i) => {
    s.value = getVal('stat-val-' + i);
    s.unit = getVal('stat-unit-' + i);
    s.label = getVal('stat-label-' + i);
  });
  DB.stats = stats;
  saveDB(DB);
  toast('Stats saved successfully!', 'success');
}

// ── Leads ──────────────────────────────────────────────────
function renderLeadsTable() {
  const container = document.getElementById('leads-table-container');
  const leads = DB.leads || [];

  if (leads.length === 0) {
    container.innerHTML = '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:3rem; text-align:center; color:var(--text-dim);">No leads submitted yet. Leads appear here when users fill out the contact form on the website.</div>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Inquiry</th>
            <th>Location Pref</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map((l, i) => `
            <tr>
              <td style="color:var(--text-dim);">${i + 1}</td>
              <td style="font-weight:600;">${escHtml(l.name || '—')}</td>
              <td><a href="mailto:${escHtml(l.email || '')}" style="color:var(--blue);">${escHtml(l.email || '—')}</a></td>
              <td>${escHtml(l.phone || '—')}</td>
              <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(l.inquiry || '—')}</td>
              <td>${escHtml(l.locationPref || '—')}</td>
              <td style="color:var(--text-muted); white-space:nowrap;">${formatDate(l.date)}</td>
              <td>
                <button class="btn-icon-edit" onclick="viewLead(${i})" title="View">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                </button>
                <button class="btn-icon-danger" onclick="deleteLead(${i})" title="Delete">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function viewLead(index) {
  const l = DB.leads[index];
  const modal = document.getElementById('lead-modal');
  document.getElementById('lead-modal-body').innerHTML = `
    <div style="display:grid; gap:1rem;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-field"><label>Full Name</label><input type="text" value="${escHtml(l.name || '')}" readonly></div>
        <div class="form-field"><label>Email</label><input type="text" value="${escHtml(l.email || '')}" readonly></div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-field"><label>Phone</label><input type="text" value="${escHtml(l.phone || '')}" readonly></div>
        <div class="form-field"><label>Location Preference</label><input type="text" value="${escHtml(l.locationPref || '')}" readonly></div>
      </div>
      <div class="form-field"><label>Inquiry</label><input type="text" value="${escHtml(l.inquiry || '')}" readonly></div>
      <div class="form-field"><label>Notes / Message</label><textarea rows="3" readonly>${escHtml(l.notes || '')}</textarea></div>
      <div class="form-field"><label>Submitted</label><input type="text" value="${formatDate(l.date)}" readonly></div>
    </div>
    <div style="display:flex; gap:0.75rem; margin-top:0.5rem; flex-wrap:wrap;">
      <a href="mailto:${escHtml(l.email || '')}" class="btn-primary">📧 Email Lead</a>
      ${l.phone ? `<a href="https://wa.me/${l.phone.replace(/\D/g,'')}" target="_blank" class="btn-outline-sm">💬 WhatsApp</a>` : ''}
    </div>
  `;
  modal.style.display = 'flex';
}

function closeLeadModal() {
  document.getElementById('lead-modal').style.display = 'none';
}

function deleteLead(index) {
  if (!confirm('Delete this lead?')) return;
  DB.leads.splice(index, 1);
  saveDB(DB);
  renderLeadsTable();
  updateBadges();
  toast('Lead deleted', 'success');
}

function clearLeads() {
  if (!confirm('Clear ALL leads? This cannot be undone.')) return;
  DB.leads = [];
  saveDB(DB);
  renderLeadsTable();
  updateBadges();
  renderRecentLeads();
  toast('All leads cleared', 'success');
}

function exportLeads() {
  const leads = DB.leads || [];
  if (leads.length === 0) { toast('No leads to export', 'info'); return; }
  const headers = ['Name','Email','Phone','Inquiry','LocationPref','Notes','Date'];
  const rows = leads.map(l => [l.name, l.email, l.phone, l.inquiry, l.locationPref, l.notes, l.date].map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','));
  downloadCSV('nrn-leads.csv', [headers.join(','), ...rows].join('\n'));
  toast('Leads exported as CSV', 'success');
}

// ── Subscribers ────────────────────────────────────────────
function renderSubscribersTable() {
  const container = document.getElementById('subscribers-table-container');
  const subs = DB.subscribers || [];

  if (subs.length === 0) {
    container.innerHTML = '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:3rem; text-align:center; color:var(--text-dim);">No subscribers yet. They appear here when users sign up for the Off-Market Gazette newsletter.</div>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>WhatsApp</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${subs.map((s, i) => `
            <tr>
              <td style="color:var(--text-dim);">${i + 1}</td>
              <td style="font-weight:600;">${escHtml(s.name || '—')}</td>
              <td><a href="mailto:${escHtml(s.email || '')}" style="color:var(--blue);">${escHtml(s.email || '—')}</a></td>
              <td>${escHtml(s.phone || '—')}</td>
              <td style="color:var(--text-muted); white-space:nowrap;">${formatDate(s.date)}</td>
              <td>
                <button class="btn-icon-danger" onclick="deleteSubscriber(${i})" title="Delete">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function deleteSubscriber(index) {
  if (!confirm('Delete this subscriber?')) return;
  DB.subscribers.splice(index, 1);
  saveDB(DB);
  renderSubscribersTable();
  updateBadges();
  toast('Subscriber deleted', 'success');
}

function clearSubscribers() {
  if (!confirm('Clear ALL subscribers? This cannot be undone.')) return;
  DB.subscribers = [];
  saveDB(DB);
  renderSubscribersTable();
  updateBadges();
  toast('All subscribers cleared', 'success');
}

function exportSubscribers() {
  const subs = DB.subscribers || [];
  if (subs.length === 0) { toast('No subscribers to export', 'info'); return; }
  const headers = ['Name','Email','Phone','Date'];
  const rows = subs.map(s => [s.name, s.email, s.phone, s.date].map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','));
  downloadCSV('nrn-subscribers.csv', [headers.join(','), ...rows].join('\n'));
  toast('Subscribers exported as CSV', 'success');
}

// ── Database JSON Editor ───────────────────────────────────
function renderJsonEditor() {
  document.getElementById('json-editor').value = JSON.stringify(DB, null, 2);
}

function formatJsonEditor() {
  try {
    const raw = document.getElementById('json-editor').value;
    document.getElementById('json-editor').value = JSON.stringify(JSON.parse(raw), null, 2);
    toast('JSON formatted', 'success');
  } catch(e) {
    toast('Invalid JSON: ' + e.message, 'error');
  }
}

function saveRawJson() {
  try {
    const raw = document.getElementById('json-editor').value;
    const parsed = JSON.parse(raw);
    DB = parsed;
    saveDB(DB);
    renderDashboard();
    renderPropertyList();
    renderSiteSettings();
    renderStatsEditor();
    renderLeadsTable();
    renderSubscribersTable();
    updateBadges();
    toast('Database saved from raw JSON!', 'success');
  } catch(e) {
    toast('Invalid JSON — not saved: ' + e.message, 'error');
  }
}

// ── Export full DB ─────────────────────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'nrn-data.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Database exported as nrn-data.json', 'success');
}

// ── Badges & Status ────────────────────────────────────────
function updateBadges() {
  const leads = (DB.leads || []).length;
  const subs = (DB.subscribers || []).length;
  setEl('leads-badge', leads || 0);
  setEl('subs-badge', subs || 0);
  setEl('dash-leads', leads);
  setEl('dash-subs', subs);
}

function setSaveStatus(msg) {
  setEl('save-status', msg);
}

function updateLastSaveTime() {
  const el = document.getElementById('last-save-time');
  if (el) el.textContent = 'Last saved: ' + new Date().toLocaleTimeString();
}

// ── Toast Notifications ────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = '';
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.innerHTML = `<span>${icons[type] || '✓'}</span> ${escHtml(msg)}`;
  el.className = 'toast ' + type;
  void el.offsetWidth; // reflow
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── CSV Downloader ─────────────────────────────────────────
function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── DOM Helpers ────────────────────────────────────────────
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val !== undefined ? val : ''; }
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setSelect(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function getSelect(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function escHtml(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); } catch(e) { return dateStr; }
}

// ── PUBLIC API: Called from app.js on the main site ───────
// The main app.js will call loadSiteCMSData() to get DB content
window.NRN_CMS = {
  loadDB,
  saveDB,
  addLead: async function(leadData) {
    const db = await loadDB();
    db.leads = db.leads || [];
    db.leads.push({ ...leadData, date: new Date().toISOString() });
    saveDB(db);
  },
  addSubscriber: async function(subData) {
    const db = await loadDB();
    db.subscribers = db.subscribers || [];
    db.subscribers.push({ ...subData, date: new Date().toISOString() });
    saveDB(db);
  }
};
