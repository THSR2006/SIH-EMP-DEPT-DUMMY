import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleSoapRequest, serveWsdl } from './src/soap/soapHandler.js';
import { apiRouter } from './src/routes/apiRoutes.js';
import { renderAdminDashboardHtml } from './src/views/adminDashboard.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Enable CORS for frontend and master application interoperability
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'SOAPAction', 'X-Requested-With']
  })
);

// XML body parsing for SOAP requests
app.use(
  '/soap',
  express.text({
    type: ['text/xml', 'application/xml', 'application/soap+xml', 'text/plain'],
    limit: '5mb'
  })
);

// JSON body parser for REST APIs
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true }));

// ================= SOAP ENDPOINTS =================
// 1. WSDL specification query: GET /soap/employment?wsdl
app.get('/soap/employment', (req, res) => {
  if (req.query.wsdl !== undefined || req.query.WSDL !== undefined) {
    return serveWsdl(req, res);
  }
  res.redirect('/soap/inspect');
});

// 2. SOAP Endpoint: POST /soap/employment
app.post('/soap/employment', handleSoapRequest);

// 3. SOAP & WSDL Visual Inspector
app.get('/soap/inspect', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Employment Department SOAP Web Service</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; background: #0f172a; color: #f8fafc; }
        h1, h2 { color: #38bdf8; }
        .badge { background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; padding: 4px 10px; border-radius: 6px; font-size: 0.85em; font-weight: bold; }
        .card { background: #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }
        pre { background: #020617; padding: 14px; border-radius: 6px; overflow-x: auto; color: #a5f3fc; font-size: 0.9em; border: 1px solid #1e293b; }
        a { color: #38bdf8; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      </style>
    </head>
    <body>
      <h1>🏛️ State Employment Department <span class="badge">SOAP + WS-Security</span></h1>
      <p>Interoperability Node for Government Department-to-Department Data Exchange (SIH Framework).</p>
      
      <div class="card">
        <h2>SOAP 1.1 Specification & WSDL</h2>
        <p><strong>Endpoint URL:</strong> <code>POST http://localhost:${PORT}/soap/employment</code></p>
        <p><strong>WSDL Contract:</strong> <a href="/soap/employment?wsdl" target="_blank"><code>http://localhost:${PORT}/soap/employment?wsdl</code></a></p>
        <p><strong>Authentication Standard:</strong> OASIS WS-Security 1.0 (UsernameToken profile)</p>
        <p><strong>Allowed Service Credentials:</strong> Username: <code>INTEROP_GATEWAY_SERVICE</code> | Password: <code>GovInterop@Secret#2026</code></p>
      </div>

      <div class="card">
        <h2>Available SOAP Operations</h2>
        <ul>
          <li><code>GetAvailableJobs</code> - Query active vacancies & eligibility thresholds</li>
          <li><code>CheckEligibility</code> - Validate citizen age, qualification, and certificate match</li>
          <li><code>ApplyForJob</code> - Inter-department application filing with verified Education Dept certificate</li>
          <li><code>GetApplicationStatus</code> - Query application status using application tracking ID</li>
        </ul>
      </div>

      <div class="card">
        <h2>REST APIs (Frontend Portal & Audit)</h2>
        <div class="grid">
          <div>
            <p><strong>Jobs Catalog:</strong> <a href="/api/jobs" target="_blank"><code>GET /api/jobs</code></a></p>
            <p><strong>Applications Feed:</strong> <a href="/api/applications" target="_blank"><code>GET /api/applications</code></a></p>
            <p><strong>Mock Citizens:</strong> <a href="/api/citizens/mock" target="_blank"><code>GET /api/citizens/mock</code></a></p>
          </div>
          <div>
            <p><strong>System Stats:</strong> <a href="/api/stats" target="_blank"><code>GET /api/stats</code></a></p>
            <p><strong>Live Audit Logs:</strong> <a href="/api/interop/logs" target="_blank"><code>GET /api/interop/logs</code></a></p>
            <p><strong>Manual Submission:</strong> <code>POST /api/applications/manual</code></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ================= REST API ROUTES =================
app.use('/api', apiRouter);

// Admin Console Visual UI
app.get(['/admin', '/admin/dashboard'], (req, res) => {
  res.send(renderAdminDashboardHtml(PORT));
});

// Root landing redirect to inspect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🏛️  Employment Department Backend Server is RUNNING`);
  console.log(`📡  Port: ${PORT}`);
  console.log(`🎯  Admin Console (Judges Demo): http://localhost:${PORT}/admin`);
  console.log(`📜  WSDL: http://localhost:${PORT}/soap/employment?wsdl`);
  console.log(`🔒  SOAP Endpoint: http://localhost:${PORT}/soap/employment`);
  console.log(`👥  Citizens API: http://localhost:${PORT}/api/citizens`);
  console.log(`📊  Admin Stats API: http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`🖥️  SOAP Inspector: http://localhost:${PORT}/soap/inspect`);
  console.log(`=======================================================`);
});

