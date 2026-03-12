 <script>
    // Password toggle function moved outside
    function togglePassword(id) {
      const input = document.getElementById(id);
      if (!input) return;
      const btn = input.nextElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.innerText = 'Hide';
      } else {
        input.type = 'password';
        if (btn) btn.innerText = 'Show';
      }
    }

// Store messages temporarily
const requestorMessages = [];

function sendRequestorMessage() {
  const input = document.getElementById('requestorInput');
  const message = input.value.trim();
  if (message === '') return;

  // Add message to requestor's message box
  const msgDiv = document.createElement('div');
  msgDiv.innerHTML = `<strong>Requestor:</strong> ${message}`;
  document.getElementById('requestorMessages').appendChild(msgDiv);

  // Save message
  requestorMessages.push(message);

  // Clear input
  input.value = '';

  // Notify admin
  notifyAdmin(message);
}

function notifyAdmin(message) {
  const notificationDiv = document.createElement('div');
  notificationDiv.innerHTML = `<strong>New Message from Requestor:</strong> ${message}`;
  notificationDiv.style.borderBottom = '1px solid #eee';
  document.getElementById('adminNotifications').appendChild(notificationDiv);

  // Optional: alert or prompt for admin
  alert('New message received from requestor!');
}


    // Function to toggle delivery address input display
    function toggleDeliveryAddress(){
      const m=document.getElementById("deliveryMethod").value;
      document.getElementById("deliveryAddressBox").style.display=
      m==="Shipment"?"block":"none";
    }

    /********** CONFIG **********/
    const ADMIN_EMAIL = 'barangayrequirementrequesttrac@gmail.com';
    const DEFAULT_ADMIN_PASS = 'admin@2025'; // stored but NOT displayed to residents
    const STORAGE_KEY = 'bgs_db_v1';

    /********** TOASTS **********/
    function showToast(message, type = '') {
      const container = document.getElementById('toastContainer');
      const t = document.createElement('div');
      t.className = 'toast ' + (type || '');
      t.innerText = message;
      t.style.opacity = '1';
      container.appendChild(t);
      // auto hide
      setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(16px)';
      }, 3000);
      setTimeout(() => {
        if (t.parentNode) container.removeChild(t);
      }, 3600);
    }

    /********** UTIL HELPERS **********/
    function _(id) { return document.getElementById(id); }
    function statusToken(status) { return String(status || '').replace(/\s+/g, ''); } // e.g. "Ready for Pickup" -> "ReadyforPickup"

    /********** localStorage DB (single source) **********/
    function getDB() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const init = {
          users: [
            { name: 'Barangay Admin', email: ADMIN_EMAIL, password: DEFAULT_ADMIN_PASS, isAdmin: true }
          ],
          requests: [],
          pwResets: []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
        return init;
      }
      try { return JSON.parse(raw); } catch (e) { return { users: [], requests: [], pwResets: [] }; }
    }
    function saveDB(db) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }

    /********** AUTH & ACCOUNT **********/
    function handleRegister() {
      const name = _('reg-name').value.trim();
      const email = _('reg-email').value.trim().toLowerCase();
      const pass = _('reg-pass').value;
      const pass2 = _('reg-pass2').value;
      if (!name || !email || !pass) { showToast('Please complete required fields', 'error'); return; }
      if (pass !== pass2) { showToast('Passwords do not match', 'error'); return; }
      const db = getDB();
      if (db.users.find(u => u.email === email)) { showToast('Email already registered', 'error'); return; }
      db.users.push({ name, email, password: pass, isAdmin: false });
      saveDB(db);
      _('reg-name').value = _('reg-email').value = _('reg-pass').value = _('reg-pass2').value = '';
      showToast('Account created — sign in now', 'success');
      setTimeout(() => showPage('login'), 700);
    }

    function handleLogin() {
      const email = _('login-email').value.trim().toLowerCase();
      const pass = _('login-pass').value;
      const db = getDB();
      const user = db.users.find(u => u.email === email && u.password === pass);
      if (!user) { showToast('Invalid credentials', 'error'); return; }
      sessionStorage.setItem('bgs_user', JSON.stringify({ name: user.name, email: user.email, isAdmin: !!user.isAdmin }));
      showToast('Signed in', 'success');
      setTimeout(() => {
        if (user.isAdmin) showPage('admin'); else showPage('dashboard');
      }, 400);
    }

    function handleLogout() {
      sessionStorage.removeItem('bgs_user');
      showToast('Signed out', 'success');
      showPage('front');
    }

    function getCurrentUser() {
      const s = sessionStorage.getItem('bgs_user');
      return s ? JSON.parse(s) : null;
    }

    function renderAccount() {
      const user = getCurrentUser();
      if (!user) return showPage('login');
      _('acct-name').value = user.name || '';
      _('acct-email').value = user.email;
    }

    function saveAccount() {
      const user = getCurrentUser(); if (!user) return showPage('login');
      const db = getDB();
      const person = db.users.find(u => u.email === user.email);
      if (!person) { showToast('User not found', 'error'); return; }
      const newName = _('acct-name').value.trim();
      const pass = _('acct-pass').value;
      const pass2 = _('acct-pass2').value;
      if (pass && pass !== pass2) { showToast('Passwords do not match', 'error'); return; }
      if (newName) person.name = newName;
      if (pass) person.password = pass;
      saveDB(db);
      sessionStorage.setItem('bgs_user', JSON.stringify({ name: person.name, email: person.email, isAdmin: !!person.isAdmin }));
      _('acct-pass').value = _('acct-pass2').value = '';
      showToast('Account updated', 'success');
      setTimeout(() => showPage(person.isAdmin ? 'admin' : 'dashboard'), 700);
    }

    function changeAdminPassword() {
      const newp = _('admin-newpass').value.trim();
      if (!newp) { showToast('Enter a new password', 'error'); return; }
      const db = getDB();
      const adm = db.users.find(u => u.email === ADMIN_EMAIL);
      if (adm) adm.password = newp;
      saveDB(db);
      _('admin-newpass').value = '';
      showToast('Admin password updated (hidden from residents)', 'success');
    }

    /********** Forgot Password (simulated) **********/
    function forgotPasswordFlow() {
      const email = prompt('Enter your registered email for password reset:');
      if (!email) return;
      const db = getDB();
      const user = db.users.find(u => u.email === email.toLowerCase());
      if (!user) { showToast('Email not found', 'error'); return; }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 1000 * 60 * 10;
      db.pwResets = db.pwResets.filter(r => r.email !== user.email);
      db.pwResets.push({ email: user.email, otp, expires });
      saveDB(db);
      showToast('Reset OTP (simulated): ' + otp, 'success');
      setTimeout(() => {
        const inputOtp = prompt('Enter the OTP sent to your email (simulated):');
        if (!inputOtp) { showToast('OTP entry cancelled', 'error'); return; }
        const record = db.pwResets.find(r => r.email === user.email && r.otp === inputOtp);
        if (!record || Date.now() > record.expires) { showToast('Invalid or expired OTP', 'error'); return; }
        const newPass = prompt('Enter your new password: (minimum 6 characters)');
        if (!newPass || newPass.length < 6) { showToast('Password too short or cancelled', 'error'); return; }
        const db2 = getDB();
        const u = db2.users.find(x => x.email === user.email);
        if (u) { u.password = newPass; saveDB(db2); showToast('Password updated. Please login.', 'success'); }
      }, 600);
    }

    /********** Camera & Upload **********/
    function handleUpload(e) {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function () { sessionStorage.setItem('bgs_upload', reader.result); showToast('Image attached', 'success'); }
      reader.readAsDataURL(file);
    }

    let stream = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        _('video').srcObject = stream;
        _('cameraBox').style.display = 'flex';
      } catch (e) {
        showToast('Unable to access camera: ' + (e.message || e), 'error');
      }
    }
    function stopCamera() {
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
      _('cameraBox').style.display = 'none';
    }
    function capturePhoto() {
      const video = _('video'), canvas = _('canvas');
      if (!video || !video.srcObject) { showToast('Camera not started', 'error'); return; }
      canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/png');
      sessionStorage.setItem('bgs_upload', data);
      showToast('Photo captured and attached', 'success');
    }

    /********** Requests (user-facing) **********/
    function resetForm() {
      ['fullName', 'birthday', 'contact', 'address', 'dateRequested', 'emailAddr', 'purpose'].forEach(id => { const el = _(id); if (el) el.value = ''; });
      const reqType = _('reqType'); if (reqType) reqType.selectedIndex = 0;
      const fi = _('fileInput'); if (fi) fi.value = null;
      const canvas = _('canvas'); if (canvas) canvas.style.display = 'none';
      sessionStorage.removeItem('bgs_upload');
      // Reset delivery address display
      document.getElementById("deliveryMethod").value = "Pickup";
      document.getElementById("deliveryAddressBox").style.display="none";
    }

    function submitRequest() {
      const user = getCurrentUser(); if (!user) { showToast('Please sign in first', 'error'); showPage('login'); return; }
      const data = {
        id: 'REQ-' + Date.now(),
        userEmail: user.email,
        name: _('fullName').value.trim() || user.name,
        birthday: _('birthday').value || '',
        contact: _('contact').value.trim(),
        address: _('address').value.trim(),
        dateIssued: _('dateRequested').value || new Date().toLocaleDateString(),
        emailAddr: _('emailAddr').value.trim() || user.email,
        purpose: _('purpose').value.trim(),
        reqType: _('reqType').value,
        deliveryMethod: document.getElementById("deliveryMethod").value,
        deliveryAddress: document.getElementById("deliveryAddress").value,
        image: sessionStorage.getItem('bgs_upload') || null,
        status: 'Submitted',
        history: [{ when: new Date().toISOString(), status: 'Submitted' }],
        adminAttachment: null // for admin uploaded final doc
      };
      const db = getDB(); db.requests.unshift(data); saveDB(db);
      showToast('Request submitted. ID: ' + data.id, 'success');
      resetForm(); 
      // Refresh requests list
      const currentUser = getCurrentUser();
      if (currentUser) {
        renderUserRequests(); 
        populateSelectRequests(currentUser.email);
      }
    }

    function renderUserRequests() {
      const user = getCurrentUser(); if (!user) return;
      const db = getDB();
      const list = db.requests.filter(r => r.userEmail === user.email);
      const el = _('userRequests'); el.innerHTML = '';
      if (list.length === 0) el.innerHTML = '<div class="small muted">No requests yet</div>';
      list.forEach(r => {
        const div = document.createElement('div'); div.className = 'req-card';
        const imgThumb = r.image ? `<div style="margin-top:8px"><img src="${r.image}" style="max-width:100%;border-radius:6px"/></div>` : '';
        const token = statusToken(r.status);
        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><strong>${r.reqType}</strong><div class="small muted">${r.id}</div></div>
            <div><span class="status ${token}">${r.status}</span></div>
          </div>
          <div class="small muted" style="margin-top:8px">${r.purpose || ''}</div>
          ${imgThumb}
        `;
        el.appendChild(div);
      });
    }

    /********** Admin: render list with dropdown actions **********/
    function renderAdmin() {
      const user = getCurrentUser(); if (!user || !user.isAdmin) return showPage('login');
      _('admin-email-display').innerText = user.email;
      _('admin-email').value = ADMIN_EMAIL;
      const db = getDB(); const el = _('adminRequests'); el.innerHTML = '';
      if (db.requests.length === 0) el.innerHTML = '<div class="small muted">No requests</div>';
      db.requests.forEach(r => {
        const div = document.createElement('div'); div.className = 'req-card';
        const imageHtml = r.image ? `<div style="margin-top:8px"><img src="${r.image}" style="max-width:180px;border-radius:6px"/></div>` : '';
        const token = statusToken(r.status);
        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <strong>${r.reqType}</strong>
              <div class="small muted">${r.id} · ${r.name} · ${r.userEmail}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <select onchange="changeStatus('${r.id}', this.value)">
                <option value="Submitted" ${r.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                <option value="Processing" ${r.status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Approved" ${r.status === 'Approved' ? 'selected' : ''}>Approved</option>
                <option value="Incomplete Details" ${r.status === 'Incomplete Details' ? 'selected' : ''}>Incomplete Details</option>
                <option value="Ready for Pickup" ${r.status === 'Ready for Pickup' ? 'selected' : ''}>Ready for Pickup</option>
                <option value="Out for Delivery" ${r.status==='Out for Delivery'?'selected':''}>Out for Delivery</option>
                <option value="Complete" ${r.status === 'Complete' ? 'selected' : ''}>Complete</option>
                <option value="Rejected" ${r.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              </select>

              
              <!-- Prominent "View Details" button -->
        <button style="padding:6px 12px;border:none;border-radius:4px;background:#0b2140;color:#fff;font-weight:600;cursor:pointer" onclick="openViewModal('${r.id}')">View Details</button>

              <div class="dropdown">
                <button class="dropdown-btn">⋮</button>
                <div class="dropdown-content">
                  <a href="#" onclick="openViewModal('${r.id}');return false;">View Details</a>
                  <a href="#" onclick="changeStatus('${r.id}','Complete');return false;">Complete</a>
                  <a href="#" onclick="changeStatus('${r.id}','Rejected');return false;">Rejected</a>
                  <a href="#" onclick="confirmDelete('${r.id}');return false;">Delete</a>
                  <label onclick="triggerAdminAttach('${r.id}')">Attach final document</label>
                  <a href="#" onclick="simulateEmail('${r.id}');return false;">Send Email (simulate)</a>
                </div>
              </div>
              <button style="background:#e74c3c;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer" onclick="deleteRequest('${r.id}')">Delete</button>
  </div>
</div>
              <!-- hidden file input used when admin attaches for a specific request -->
              <input type="file" id="attach-${r.id}" style="display:none" onchange="handleAdminAttach(event, '${r.id}')"/>
            </div>
          </div>
          <div style="margin-top:8px" class="small muted">${r.purpose || ''}</div>
          ${imageHtml}
          ${r.adminAttachment ? `<div style="margin-top:8px"><small>Admin file attached</small></div>` : ''}
        `;
        el.appendChild(div);
      });
    }

    function confirmDelete(id) {
      if (!confirm('Are you sure you want to delete this request?')) return;
      deleteRequest(id);
    }

    function deleteRequest(id) {
      const db = getDB();
      db.requests = db.requests.filter(r => r.id !== id);
      saveDB(db);
      showToast('Request deleted', 'success');
      const cur = getCurrentUser();
      if (cur) {
        renderUserRequests();
        if (cur.isAdmin) renderAdmin();
        populateSelectRequests(cur.email);
      }
    }

    /********** Status change **********/
    function changeStatus(id, newStatus) {
      const db = getDB();
      const req = db.requests.find(r => r.id === id);
      if (!req) { showToast('Request not found', 'error'); return; }
      req.status = newStatus;
      if (!req.history) req.history = [];
      req.history.push({ when: new Date().toISOString(), status: newStatus });
      saveDB(db);
      showToast(`Status updated: ${id} → ${newStatus}`, 'success');
      const cur = getCurrentUser();
      if (cur) {
        renderUserRequests();
        if (cur.isAdmin) renderAdmin();
        populateSelectRequests(req.userEmail);
        updateAdminAnalytics();
      }
    }

    /********** Modal & View Details **********/
    function openViewModal(id) {
  const db = getDB();
  const req = db.requests.find(r => r.id === id);
  if (!req) { showToast('Request not found', 'error'); return; }
  const details = _('modalDetails');
  details.innerHTML = `
    <div style="background:#f9f9f9;padding:20px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      <div style="margin-bottom:15px;display:flex;justify-content:flex-end;">
        <button style="border:none;background:none;font-size:20px;cursor:pointer" onclick="closeViewModal()">&times;</button>
      </div>
      <h3 style="margin-top:0;margin-bottom:15px;">Request Details</h3>
      <div style="display:flex;flex-direction:column;gap:10px;line-height:1.5;">
        <div class="modal-info"><strong>Name:</strong> ${req.name}</div>
        <div class="modal-info"><strong>Request Type:</strong> ${req.reqType}</div>
        <div class="modal-info"><strong>Status:</strong> <span class="status ${statusToken(req.status)}">${req.status}</span></div>
        <div class="modal-info"><strong>Purpose:</strong> ${req.purpose || 'N/A'}</div>
        <div class="modal-info"><strong>Contact:</strong> ${req.contact || 'N/A'}</div>
        <div class="modal-info"><strong>Email:</strong> ${req.emailAddr || 'N/A'}</div>
        <div class="modal-info"><strong>Address:</strong> ${req.address || 'N/A'}</div>
        <div class="modal-info"><strong>Birthday:</strong> ${req.birthday || 'N/A'}</div>
        <div class="modal-info"><strong>Delivery Method:</strong> ${req.deliveryMethod}</div>
        <div class="modal-info"><strong>Delivery Address:</strong> ${req.deliveryAddress || 'N/A'}</div>
        <div class="modal-info"><strong>Requested on:</strong> ${new Date(req.history ? req.history[0].when : req.dateIssued).toLocaleString()}</div>
        ${req.image ? `<div style="margin-top:8px;text-align:center"><img src="${req.image}" style="max-width:220px;border-radius:6px;display:block;margin:auto" /></div>` : ''}
        ${req.adminAttachment ? `<div style="margin-top:8px"><strong>Admin Attachment:</strong> <a href="${req.adminAttachment}" target="_blank">View</a></div>` : ''}
      </div>
    </div>
  `;
  _('viewModal').dataset.current = id;
  _('viewModal').style.display = 'flex';
}

function closeModal() {
  _('viewModal').style.display = 'none';
  delete _('viewModal').dataset.current;
  _('adminAttach').value = '';
}

// Handle attaching admin document from modal
function handleAdminAttach(e) {
  const file = e.target.files ? e.target.files[0] : null;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    const db = getDB();
    const id = _('viewModal').dataset.current;
    const req = db.requests.find(r => r.id === id);
    if (!req) { showToast('Request not found', 'error'); return; }
    req.adminAttachment = reader.result; // save as data URL
    saveDB(db);
    showToast('Admin document attached for ' + id, 'success');
    renderAdmin();
    renderUserRequests();
    populateSelectRequests(req.userEmail);
    if (_('viewModal').style.display === 'flex') openViewModal(id);
  }
  reader.readAsDataURL(file);
  if (e.target) e.target.value = '';
}

// Trigger file input click for attaching admin file
function triggerAdminAttach(id) {
  const fileInput = document.getElementById(`attach-${id}`);
  if (fileInput) fileInput.click();
}
;
    

    /********** Simulated Email **********/
    function simulateEmail(id) {
      const db = getDB();
      const req = db.requests.find(r => r.id === id);
      if (!req) return showToast('Request not found', 'error');
      // simulated: show toast and add entry to history
      req.history = req.history || [];
      req.history.push({ when: new Date().toISOString(), status: 'Email sent (simulated)' });
      saveDB(db);
      showToast('Simulated email sent to ' + req.emailAddr, 'success');
      renderAdmin(); renderUserRequests();
    }
    function sendEmailFromModal() {
      const id = _('viewModal').dataset.current;
      if (!id) return showToast('No request selected', 'error');
      simulateEmail(id);
      closeModal();
    }

    /********** Tracker **********/
    function populateSelectRequests(email) {
      const sel = _('selectRequest'); const db = getDB();
      sel.innerHTML = '<option value="">-- Select request --</option>';
      const list = db.requests.filter(r => r.userEmail === email);
      list.forEach(r => {
        const opt = document.createElement('option'); opt.value = r.id; opt.text = r.id + ' · ' + r.reqType; sel.appendChild(opt);
      });
    }

    function renderTracker(id) {
      if (!id) { _('trackerArea').style.display = 'none'; return; }
      const db = getDB(); const r = db.requests.find(x => x.id === id); if (!r) return;
      _('trackerArea').style.display = 'block';
      const steps = ['Submitted', 'Processing', 'Approved', 'Ready for Pickup'];
      const container = _('trackerSteps'); container.innerHTML = '';
      steps.forEach(s => {
        const div = document.createElement('div'); div.className = 'step';
        if (steps.indexOf(r.status) >= steps.indexOf(s)) div.classList.add('active');
        div.innerText = s;
        container.appendChild(div);
      });
      const historyHtml = (r.history || []).map(h => `<li>${new Date(h.when).toLocaleString()} — ${h.status}</li>`).join('');
      _('trackerInfo').innerHTML = `<div style="margin-top:8px"><strong>Current status:</strong> ${r.status}<div class="small muted" style="margin-top:6px">History:<ul>${historyHtml}</ul></div></div>`;
    }

    /********** Approval / Print **********/
    function viewApproval(id) {
      const db = getDB(); const r = db.requests.find(x => x.id === id); if (!r) return showToast('Not found', 'error');
      const letter = _('approvalLetter'); letter.innerHTML = generateLetterHTML(r);
      const printBtn = _('printBtn');
      if (r.status === 'Approved') { printBtn.disabled = false; printBtn.classList.remove('btn-ghost'); } else { printBtn.disabled = true; printBtn.classList.add('btn-ghost'); }
      _('printModal').style.display = 'block';
    }
    function closePrint() { _('printModal').style.display = 'none'; }

    function generateLetterHTML(r) {
      return `
        <div style="padding:12px;background:white;border-radius:8px;color:var(--midnight)">
          <h2 style="margin:0">Barangay ${r.reqType}</h2>
          <p class="small muted">Request ID: ${r.id}</p>
          <p>To whom it may concern,</p>
          <p>This is to certify that <strong>${r.name}</strong> has requested a <strong>${r.reqType}</strong> for the purpose of <em>${r.purpose || '—'}</em>. Current status: <strong>${r.status}</strong>.</p>
          <p>Address: ${r.address || '—'}</p>
          <p>Date Issued: ${r.dateIssued || new Date().toLocaleDateString()}</p>
          ${r.image ? `<div style="margin-top:8px"><img src="${r.image}" style="max-width:320px;border-radius:6px;display:block" /></div>` : ''}
          ${r.adminAttachment ? `<div style="margin-top:8px"><strong>Attachment:</strong> Attached by admin</div>` : ''}
          <p style="margin-top:12px">Sincerely,<br/>Barangay Office</p>
        </div>
      `;
    }

    function printApproval() {
      const content = _('approvalLetter').innerHTML;
      if (!content.includes('Current status')) { showToast('Cannot print this document', 'error'); return; }
      if (!content.includes('Current status: <strong>Approved</strong>') && !content.includes('<strong>Approved</strong>')) {
        showToast('Document must be Approved before printing', 'error');
        return;
      }
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>Approval Letter</title><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600,700&display=swap" rel="stylesheet"><style>body{font-family:'Poppins',sans-serif;padding:24px;color:${getComputedStyle(document.documentElement).getPropertyValue('--midnight')};}</style></head><body>${content}</body></html>`);
      w.document.close(); w.focus();
      setTimeout(() => w.print(), 300);
    }

    /********** Initialization and helpers **********/
    function showPage(page) {
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      _('printModal').style.display = 'none';
      // always close modals when navigating
      closeModal();
      if (page === 'front') _('front').style.display = 'block';
      if (page === 'login') _('login').style.display = 'block';
      if (page === 'register') _('register').style.display = 'block';
      if (page === 'dashboard') {
        _('dashboard').style.display = 'block';
        renderDashboard();
      }
      if (page === 'admin') {
        _('admin').style.display = 'block';
        renderAdmin();
      }
      if (page === 'account') {
        _('account').style.display = 'block';
        renderAccount();
      }
    }

    function renderDashboard() {
      const user = getCurrentUser();
      if (!user) return showPage('login');
      _('welcome-name').innerText = user.name || 'User';
      _('welcome-email').innerText = user.email || '';
      renderUserRequests();
      populateSelectRequests(user.email);
    }

    // helper used when a non-admin open page: redirect to login
    function requireAuth() {
      const cur = getCurrentUser();
      if (!cur) { showPage('login'); return false; }
      return cur;
    }

    // admin-only protect
    function requireAdmin() {
      const cur = getCurrentUser();
      if (!cur || !cur.isAdmin) { showPage('login'); return false; }
      return cur;
    }

    // boot
    (function init() {
      // ensure DB exists and admin in place
      getDB();
      const cur = getCurrentUser();
      if (cur) {
        if (cur.isAdmin) showPage('admin'); else showPage('dashboard');
      } else {
        showPage('front');
      }

      // refresh UI every few seconds to simulate "live"
      setInterval(() => {
        const cur = getCurrentUser();
        if (cur) {
          renderUserRequests();
          if (cur.isAdmin) renderAdmin();
          populateSelectRequests(cur.email);
        }
        // update admin analytics here
        updateAdminAnalytics();

        function updateAdminAnalytics() {
          const db = getDB();
          const req = db.requests;

          let submitted=0, processing=0, completed=0, rejected=0, shipment=0;

          req.forEach(r => {
            if(r.status==="Submitted") submitted++;
            if(r.status==="Processing") processing++;
            if(r.status==="Complete") completed++;
            if(r.status==="Rejected") rejected++;
            if(r.deliveryMethod==="Shipment") shipment++;
          });

          document.getElementById("totalRequests").innerText=req.length;
          document.getElementById("submittedRequests").innerText=submitted;
          document.getElementById("processingRequests").innerText=processing;
          document.getElementById("completedRequests").innerText=completed;
          document.getElementById("rejectedRequests").innerText=rejected;
          document.getElementById("shipmentRequests").innerText=shipment;

          renderChart(submitted,processing,completed,rejected,shipment);
        }

        let chart;
        function renderChart(submitted,processing,completed,rejected,shipment){
          const ctx=document.getElementById("requestChart");
          if(!ctx) return;
          if(chart) chart.destroy();
          chart=new Chart(ctx,{
            type:"bar",
            data:{
              labels:["Submitted","Processing","Completed","Rejected","Shipment"],
              datasets:[{
                label:"Requests",
                data:[submitted,processing,completed,rejected,shipment]
              }]
            },
            options:{
              responsive:true
            }
          });
        }
      }, 2500);
    })();
  </script>