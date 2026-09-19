export function renderAdminDashboardHtml(port = 3000) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Employment Department - Government Interoperability Admin Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #090d16;
      --bg-card: #111827;
      --bg-card-hover: #1e293b;
      --border: #1f293d;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --success: #10b981;
      --warning: #f59e0b;
      --text: #f3f4f6;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }

    .container { max-width: 1380px; margin: 0 auto; }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .emblem { font-size: 38px; }
    .brand-text h1 { font-size: 22px; font-weight: 700; color: #fff; }
    .brand-text p { font-size: 13px; color: var(--text-muted); }

    .header-badges { display: flex; gap: 10px; align-items: center; }
    .badge {
      font-size: 11px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .badge-live { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-live::before { content: ''; width: 7px; height: 7px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399; animation: pulse 2s infinite; }
    .badge-soap { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .stat-card.highlight {
      border-color: #38bdf8;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.1);
    }
    .stat-label { font-size: 12px; font-weight: 500; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .stat-sub { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
    .stat-sub.positive { color: #34d399; }
    .stat-sub.warning { color: #fbbf24; }

    /* Sections */
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tabs { display: flex; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .tab-btn.active { background: #1e293b; color: #38bdf8; }

    /* Tables */
    .card-table {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 30px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      background: #0f172a;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 14px 18px;
      font-size: 13.5px;
      border-bottom: 1px solid #172133;
      color: #e2e8f0;
      vertical-align: middle;
    }
    tr:hover { background: rgba(255, 255, 255, 0.02); }

    .tag-master {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .tag-manual {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .tag-verified { color: #34d399; font-weight: 600; font-size: 12px; }
    .tag-unverified { color: #f87171; font-weight: 500; font-size: 12px; }

    /* Search Bar */
    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .filter-bar input, .filter-bar select {
      background: #0f172a;
      border: 1px solid var(--border);
      color: #fff;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
    }
    .filter-bar input:focus { border-color: #38bdf8; }

    /* Code block */
    pre {
      background: #020617;
      color: #93c5fd;
      padding: 12px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 11.5px;
      overflow-x: auto;
      max-height: 250px;
    }

    .pill { background: #1e293b; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; }
<<<<<<< HEAD

    /* Match the public department portal visual language. */
    :root {
      --bg-primary: #f3f6f9;
      --bg-card: #ffffff;
      --bg-card-hover: #f5f7f9;
      --border: #d6dee7;
      --accent: #1c5d99;
      --accent-glow: rgba(28, 93, 153, 0.12);
      --success: #18794e;
      --warning: #d97925;
      --text: #172433;
      --text-muted: #5f6d7c;
    }

    body {
      max-width: none;
      padding: 0;
      color: var(--text);
      background: var(--bg-primary);
      font-family: Georgia, "Times New Roman", serif;
    }

    .container { width: min(1280px, calc(100% - 48px)); max-width: none; }
    header { margin-bottom: 24px; padding: 1rem 0; border-top: 6px solid #0b2545; border-bottom: 1px solid var(--border); background: #fff; }
    .brand-text h1 { color: #0b2545; font-size: 1.55rem; }
    .brand-text p, .stat-sub, .section-title span:last-child { color: var(--text-muted); }
    .emblem { font-size: 36px; }
    .badge { border-radius: 2px; }
    .badge-live { color: var(--success); background: #e8f5ee; border-color: #b9dfc9; }
    .badge-soap { color: var(--accent); background: #eaf3fb; border-color: #bfd5e9; }
    .tab-btn { color: var(--text-muted); border-radius: 3px; }
    .tab-btn.active { color: #0b2545; background: #eaf3fb; }
    .stat-card, .card-table { border: 1px solid var(--border); border-radius: 0; background: #fff; box-shadow: 0 8px 24px rgba(18, 52, 91, 0.07); }
    .stat-card.highlight { border-color: var(--accent); box-shadow: 0 8px 24px rgba(18, 52, 91, 0.1); }
    .stat-label { color: var(--text-muted); }
    .stat-value, .section-title { color: #0b2545; }
    th { color: #12345b; background: #edf2f6; border-bottom-color: var(--border); }
    td { color: var(--text); border-bottom-color: var(--border); }
    tr:hover { background: #f5f7f9; }
    .tag-master, .tag-manual { border-radius: 2px; }
    .tag-master { color: var(--success); background: #e8f5ee; border-color: #b9dfc9; }
    .tag-manual { color: #8a4b09; background: #fff4df; border-color: #efd29d; }
    .tag-verified { color: var(--success); }
    .tag-unverified { color: #b42318; }
    .filter-bar input, .filter-bar select { color: var(--text); background: #fff; border-color: #aebdca; border-radius: 3px; }
    .filter-bar input:focus { border-color: var(--accent); }
    pre { color: #12345b; background: #f7f9fb; border: 1px solid var(--border); border-radius: 3px; }
    .pill { color: #12345b; background: #eaf3fb; border-radius: 2px; }

    .government-strip {
      background: #0b2545;
      color: #dce8f5;
      font: 13px Arial, sans-serif;
    }

    .government-strip-inner {
      width: min(1280px, calc(100% - 48px));
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: .45rem 0;
    }

    .admin-footer {
      margin-top: 2rem;
      padding: 1.25rem 0;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font: 13px Arial, sans-serif;
    }

    .admin-footer-inner {
      width: min(1280px, calc(100% - 48px));
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .section-title {
      padding-bottom: .7rem;
      border-bottom: 1px solid var(--border);
    }

    .card-table { margin-bottom: 2rem; }
    .card-table table { min-width: 980px; }
    .card-table td { overflow-wrap: anywhere; }
    .filter-bar { padding: 1rem; border: 1px solid var(--border); background: #fff; }
    .filter-bar input, .filter-bar select { min-height: 40px; }

    @media (max-width: 700px) {
      .government-strip-inner, .admin-footer-inner { width: calc(100% - 32px); flex-direction: column; gap: .25rem; }
      .admin-footer { margin-top: 1.25rem; }
    }

    @media (max-width: 700px) {
      .container { width: calc(100% - 32px); }
      header { padding: .85rem 0; }
      .brand-text h1 { font-size: 1.25rem; }
    }
  </style>
</head>
<body>
  <div class="government-strip">
    <div class="government-strip-inner">
      <span>Government of Maharashtra | Department Administration</span>
      <span>Interoperability monitoring service</span>
    </div>
  </div>
=======
  </style>
</head>
<body>
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
  <div class="container">
    <header>
      <div class="brand">
        <div class="emblem">🏛️</div>
        <div class="brand-text">
          <h1>Employment Department Administration Console</h1>
          <p>Government Interoperability Framework (SIH) - Node Registry & Cross-Dept Telemetry</p>
        </div>
      </div>
      <div class="header-badges">
        <span class="badge badge-live" id="liveIndicator">LIVE TELEMETRY</span>
        <span class="badge badge-soap">SOAP 1.1 + WS-SECURITY</span>
        <button onclick="fetchData()" class="tab-btn active" style="margin-left: 10px; padding: 6px 12px;">↻ Refresh</button>
      </div>
    </header>

    <!-- Stats Overview -->
    <div class="stats-grid">
      <div class="stat-card highlight">
        <div class="stat-label">Master Website Applications</div>
        <div class="stat-value" id="ssoCount">--</div>
        <div class="stat-sub positive">
          <span>⚡ 100% Instant Cross-Dept Verified</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Manual Citizen Applications</div>
        <div class="stat-value" id="manualCount">--</div>
        <div class="stat-sub warning">
          <span>⏳ Pending Physical Document Scrutiny</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Registered Citizens (Exchange)</div>
        <div class="stat-value" id="citizensCount">10</div>
        <div class="stat-sub">
          <span>Pre-linked with Aadhaar & Edu Dept Certs</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Inter-Dept SOAP Exchanges</div>
        <div class="stat-value" id="soapCallsCount">--</div>
        <div class="stat-sub positive">
          <span>OASIS WS-Security Authenticated</span>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('applications')">📋 Received Job Applications</button>
      <button class="tab-btn" onclick="switchTab('citizens')">👥 Registered Citizens Registry (10 Seekers)</button>
      <button class="tab-btn" onclick="switchTab('logs')">🔒 Master Website SOAP Packets (WS-Security)</button>
    </div>

    <!-- TAB 1: APPLICATIONS -->
    <div id="tab-applications">
      <div class="section-title">
        <span>Recent Job Applications</span>
        <span style="font-size: 13px; color: var(--text-muted);">Auto-updating every 4 seconds</span>
      </div>

      <div class="card-table">
        <table>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Candidate Name</th>
              <th>Aadhaar</th>
              <th>Applied Post</th>
              <th>Submission Source</th>
              <th>Education Dept Skill Certificate</th>
              <th>Department Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody id="applicationsTable">
            <tr><td colspan="8" style="text-align:center;">Loading application data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: REGISTERED CITIZENS -->
    <div id="tab-citizens" style="display: none;">
      <div class="section-title">
        <span>State Employment Exchange Registered Seekers</span>
        <span style="font-size: 13px; color: var(--text-muted);">Available for Master Website SSO Querying</span>
      </div>

      <div class="filter-bar">
        <input type="text" id="citizenSearchAadhaar" placeholder="Search by Aadhaar (e.g. 9999)" oninput="filterCitizens()">
        <input type="text" id="citizenSearchName" placeholder="Search by Name (e.g. Rahul)" oninput="filterCitizens()">
        <select id="citizenRangeSelect" onchange="filterCitizens()">
          <option value="all">All 10 Citizens</option>
          <option value="range1_5">Records 1 - 5</option>
          <option value="range6_10">Records 6 - 10</option>
        </select>
      </div>

      <div class="card-table">
        <table>
          <thead>
            <tr>
              <th>Reg No.</th>
              <th>Full Name</th>
              <th>Aadhaar Number</th>
              <th>DOB / Age</th>
              <th>Education &amp; Skills</th>
              <th>Verified Skill Certificate</th>
              <th>Employment Status</th>
            </tr>
          </thead>
          <tbody id="citizensTable">
            <tr><td colspan="7" style="text-align:center;">Loading citizens...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: SOAP INTEROP LOGS -->
    <div id="tab-logs" style="display: none;">
      <div class="section-title">
        <span>Real-time Inter-Department SOAP Audit Trail</span>
        <span style="font-size: 13px; color: var(--text-muted);">Incoming XML payloads from Master Website</span>
      </div>

      <div class="card-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operation</th>
              <th>WS-Security Principal</th>
              <th>Auth Status</th>
              <th>Latency</th>
              <th>Payload Snippet</th>
            </tr>
          </thead>
          <tbody id="logsTable">
            <tr><td colspan="6" style="text-align:center;">Loading SOAP logs...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

<<<<<<< HEAD
  <footer class="admin-footer">
    <div class="admin-footer-inner">
      <span>Government of Maharashtra | State Employment Department</span>
      <span>Administrative interoperability console</span>
      <span>Last updated: 19 September 2026</span>
    </div>
  </footer>

=======
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
  <script>
    let allCitizens = [];

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');

      document.getElementById('tab-applications').style.display = tab === 'applications' ? 'block' : 'none';
      document.getElementById('tab-citizens').style.display = tab === 'citizens' ? 'block' : 'none';
      document.getElementById('tab-logs').style.display = tab === 'logs' ? 'block' : 'none';
    }

    async function fetchData() {
      try {
        // 1. Fetch Admin Dashboard Stats
        const statsRes = await fetch('/api/admin/dashboard');
        const statsData = await statsRes.json();

        if (statsData.success) {
          document.getElementById('ssoCount').textContent = statsData.overview.receivedFromMasterWebsite.count;
          document.getElementById('manualCount').textContent = statsData.overview.receivedViaManualEntry.count;
          document.getElementById('citizensCount').textContent = statsData.overview.totalRegisteredCitizensInExchange;
          document.getElementById('soapCallsCount').textContent = statsData.interoperabilityTelemetry.totalInterDepartmentSoapCalls;
        }

        // 2. Fetch Applications
        const appsRes = await fetch('/api/applications');
        const appsData = await appsRes.json();
        const appsBody = document.getElementById('applicationsTable');

        if (appsData.applications.length === 0) {
          appsBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px;">No applications received yet.</td></tr>';
        } else {
          appsBody.innerHTML = appsData.applications.map(app => {
            const isMaster = app.submissionMode === 'SSO_INTEROPERABILITY_GATEWAY';
            const sourceBadge = isMaster
              ? '<span class="tag-master">⚡ MASTER WEBSITE (SOAP WS-SEC)</span>'
              : '<span class="tag-manual">📝 MANUAL ENTRY</span>';

            const certStatus = app.educationCertificate.isVerifiedBySourceDept
              ? '<span class="tag-verified">✔ Verified (' + app.educationCertificate.courseName + ')</span>'
              : '<span class="tag-unverified">⚠ Self-Uploaded (Unverified)</span>';

            const statusClass = app.status === 'APPROVED_AND_REGISTERED' ? 'tag-verified' : 'tag-unverified';

            return \`<tr>
              <td><strong class="pill">\${app.applicationId}</strong></td>
              <td><strong>\${app.citizen.fullName}</strong></td>
              <td><span class="pill">\${app.citizen.maskedAadhaar}</span></td>
              <td>\${app.jobTitle}</td>
              <td>\${sourceBadge}</td>
              <td>\${certStatus}</td>
              <td><strong class="\${statusClass}">\${app.status}</strong></td>
              <td style="font-size:12px; color: #94a3b8;">\${new Date(app.appliedAt).toLocaleTimeString()}</td>
            </tr>\`;
          }).join('');
        }

        // 3. Fetch Citizens
        const citRes = await fetch('/api/citizens');
        const citData = await citRes.json();
        allCitizens = citData.citizens;
        renderCitizens(allCitizens);

        // 4. Fetch Logs
        const logsRes = await fetch('/api/interop/logs');
        const logsData = await logsRes.json();
        const logsBody = document.getElementById('logsTable');

        if (logsData.logs.length === 0) {
          logsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No SOAP logs recorded yet.</td></tr>';
        } else {
          logsBody.innerHTML = logsData.logs.slice(0, 8).map(l => {
            const isAuth = l.authStatus === 'AUTHORIZED';
            const authBadge = isAuth
              ? '<span class="tag-verified">✔ AUTHORIZED</span>'
              : '<span class="tag-unverified">✖ REJECTED</span>';

            const snippet = (l.rawRequestSnippet || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 160) + '...';

            return \`<tr>
              <td style="font-size: 11px;">\${new Date(l.timestamp).toLocaleTimeString()}</td>
              <td><strong class="pill">\${l.operation}</strong></td>
              <td>\${l.authenticatedUser || 'INTEROP_GATEWAY_SERVICE'}</td>
              <td>\${authBadge}</td>
              <td>\${l.latencyMs || 2}ms</td>
              <td><pre style="max-height: 50px; font-size: 10px;">\${snippet}</pre></td>
            </tr>\`;
          }).join('');
        }

      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    }

    function renderCitizens(list) {
      const tbody = document.getElementById('citizensTable');
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No matching citizens found.</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(c => {
        const cert = c.educationCertificate;
        return \`<tr>
          <td><span class="pill">\${c.registrationNumber}</span></td>
          <td><strong>\${c.fullName}</strong><br><small style="color:#94a3b8;">\${c.district}, \${c.state}</small></td>
          <td><span class="pill">\${c.aadhaarNumber}</span></td>
          <td>\${c.dateOfBirth}</td>
          <td>\${c.highestQualification}<br><small style="color:#38bdf8;">\${c.skills.join(', ')}</small></td>
          <td><span class="tag-verified">✔ \${cert.courseName}</span><br><small style="color:#94a3b8;">\${cert.certificateNumber}</small></td>
          <td><span class="tag-master">\${c.employmentStatus}</span></td>
        </tr>\`;
      }).join('');
    }

    function filterCitizens() {
      const aadhaarQ = document.getElementById('citizenSearchAadhaar').value.trim();
      const nameQ = document.getElementById('citizenSearchName').value.trim().toLowerCase();
      const range = document.getElementById('citizenRangeSelect').value;

      let filtered = [...allCitizens];

      if (aadhaarQ) {
        filtered = filtered.filter(c => c.aadhaarNumber.includes(aadhaarQ));
      }
      if (nameQ) {
        filtered = filtered.filter(c => c.fullName.toLowerCase().includes(nameQ));
      }
      if (range === 'range1_5') {
        filtered = filtered.slice(0, 5);
      } else if (range === 'range6_10') {
        filtered = filtered.slice(5, 10);
      }

      renderCitizens(filtered);
    }

    // Initial load and polling every 4 seconds
    fetchData();
    setInterval(fetchData, 4000);
  </script>
</body>
</html>`;
}
