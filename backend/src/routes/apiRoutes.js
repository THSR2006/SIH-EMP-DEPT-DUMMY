import express from 'express';
import { employmentService } from '../services/employmentService.js';
import { buildWSSecurityHeader } from '../soap/wsSecurity.js';

export const apiRouter = express.Router();

/**
 * =========================================================================
 * 1. CITIZEN REGISTRY APIS (SERVES MASTER WEBSITE & SSO INTEROPERABILITY)
 * =========================================================================
 */

/**
 * GET /api/citizens
 * Search and query the 10 registered employment department citizens.
 * Supports:
 * - ?aadhaar=999912345678 (full or last 4 digits)
 * - ?name=Rahul (case-insensitive search)
 * - ?start=5&end=10 (range slice 5-10)
 * - ?limit=5&offset=5 (pagination)
 * - ?skill=python
 * - ?minAge=18&maxAge=30
 */
apiRouter.get('/citizens', (req, res) => {
  const { aadhaar, name, skill, status, minAge, maxAge, start, end, limit, offset } = req.query;

  const result = employmentService.searchCitizens({
    aadhaar,
    name,
    skill,
    status,
    minAge,
    maxAge,
    start,
    end,
    limit,
    offset
  });

  res.json({
    success: true,
    totalRecordsInRegistry: employmentService.getRegisteredCitizens().length,
    matchedCount: result.total,
    returnedCount: result.count,
    query: req.query,
    citizens: result.citizens
  });
});

/**
 * GET /api/citizens/:aadhaar
 * Direct Aadhaar lookup for Master Website SSO integration
 */
apiRouter.get('/citizens/:aadhaar', (req, res) => {
  const citizen = employmentService.getCitizenByAadhaar(req.params.aadhaar);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      message: `No citizen found with Aadhaar '${req.params.aadhaar}' in Employment Exchange registry.`
    });
  }
  res.json({
    success: true,
    sourceDepartment: 'State Department of Employment & Training',
    citizen
  });
});

/**
 * Backward compatibility: GET /api/citizens/mock
 */
apiRouter.get('/citizens/mock', (req, res) => {
  const citizens = employmentService.getRegisteredCitizens();
  res.json({
    success: true,
    total: citizens.length,
    citizens
  });
});

/**
 * =========================================================================
 * 2. JOBS & ELIGIBILITY APIS
 * =========================================================================
 */

/**
 * GET /api/jobs
 * List all available government job postings
 */
apiRouter.get('/jobs', (req, res) => {
  const { category, search } = req.query;
  let jobs = employmentService.getJobs();

  if (category) {
    jobs = jobs.filter((j) => j.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (search) {
    const s = search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(s) ||
        j.description.toLowerCase().includes(s) ||
        j.department.toLowerCase().includes(s)
    );
  }

  res.json({
    success: true,
    total: jobs.length,
    jobs
  });
});

/**
 * GET /api/jobs/:id
 * Get single job posting details
 */
apiRouter.get('/jobs/:id', (req, res) => {
  const job = employmentService.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: `Job ${req.params.id} not found.` });
  }
  res.json({ success: true, job });
});

/**
 * POST /api/eligibility/check
 * Pre-screen citizen eligibility before applying
 */
apiRouter.post('/eligibility/check', (req, res) => {
  const { jobId, citizen, educationCertificate } = req.body;
  if (!jobId || !citizen) {
    return res.status(400).json({
      success: false,
      message: 'jobId and citizen details are required.'
    });
  }

  const result = employmentService.checkEligibility(jobId, citizen, educationCertificate);
  res.json({ success: true, ...result });
});

/**
 * =========================================================================
 * 3. APPLICATION FILING (MANUAL ENTRY VS SSO)
 * =========================================================================
 */

/**
 * POST /api/applications/manual
 * Traditional manual data entry route (high citizen friction, unverified certificate)
 */
apiRouter.post('/applications/manual', (req, res) => {
  try {
    const { jobId, citizen, educationCertificate } = req.body;
    if (!jobId || !citizen || !citizen.fullName || !citizen.dateOfBirth || !citizen.aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required manual entry fields: jobId, fullName, dateOfBirth, aadhaarNumber.'
      });
    }

    const application = employmentService.submitManualApplication({
      jobId,
      citizen,
      educationCertificate
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted manually. Awaiting document verification and physical scrutiny.',
      application
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
      reasons: err.reasons || [err.message]
    });
  }
});

/**
 * GET /api/applications
 * List submitted applications with filter for Manual vs SSO Interoperability
 */
apiRouter.get('/applications', (req, res) => {
  const { submissionMode, jobId, aadhaar, status } = req.query;
  const applications = employmentService.getApplications({ submissionMode, jobId, aadhaar, status });

  const manualCount = applications.filter((a) => a.submissionMode === 'MANUAL_ENTRY').length;
  const ssoCount = applications.filter((a) => a.submissionMode === 'SSO_INTEROPERABILITY_GATEWAY').length;

  res.json({
    success: true,
    total: applications.length,
    counts: {
      manual: manualCount,
      ssoInteroperabilityFromMasterWebsite: ssoCount
    },
    applications
  });
});

/**
 * GET /api/applications/:id
 * Get single application status
 */
apiRouter.get('/applications/:id', (req, res) => {
  const application = employmentService.getApplicationById(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }
  res.json({ success: true, application });
});

/**
 * =========================================================================
 * 4. ADMIN APIS (FOR JUDGES PRESENTATION & LIVE MONITORING)
 * =========================================================================
 */

/**
 * GET /api/admin/dashboard & GET /api/admin/stats
 * Real-time stats and proof that applications arrived from Master Website
 */
apiRouter.get(['/admin/dashboard', '/admin/stats'], (req, res) => {
  const adminStats = employmentService.getAdminStats();
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    department: 'State Directorate of Employment, Skill Development & Training',
    interoperabilityGateway: {
      connected: true,
      protocol: 'SOAP 1.1 with OASIS WS-Security (UsernameToken)',
      endpoint: '/soap/employment',
      wsdl: '/soap/employment?wsdl'
    },
    ...adminStats
  });
});

/**
 * GET /api/admin/applications
 * Filtered applications list specifically for Admin view
 */
apiRouter.get('/admin/applications', (req, res) => {
  const { source, status, jobId } = req.query;
  let submissionMode;
  if (source === 'master' || source === 'sso') {
    submissionMode = 'SSO_INTEROPERABILITY_GATEWAY';
  } else if (source === 'manual') {
    submissionMode = 'MANUAL_ENTRY';
  }

  const applications = employmentService.getApplications({ submissionMode, status, jobId });

  res.json({
    success: true,
    total: applications.length,
    applications: applications.map((app) => ({
      ...app,
      isReceivedFromMasterWebsite: app.submissionMode === 'SSO_INTEROPERABILITY_GATEWAY',
      verificationSummary: app.submissionMode === 'SSO_INTEROPERABILITY_GATEWAY'
        ? 'Instant Automated Approval via Master SSO Interoperability'
        : 'Manual Entry: Requires physical scrutiny of self-uploaded certificates'
    }))
  });
});

/**
 * PATCH /api/admin/applications/:id/status
 * Administrative action on application
 */
apiRouter.patch('/admin/applications/:id/status', (req, res) => {
  const { status, note } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'New status is required.' });
  }
  const updated = employmentService.updateApplicationStatus(req.params.id, status, note);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }
  res.json({ success: true, message: `Application ${req.params.id} updated to ${status}.`, application: updated });
});

/**
 * =========================================================================
 * 5. INTEROP LOGS & SOAP TEST SIMULATOR
 * =========================================================================
 */

/**
 * GET /api/interop/logs
 * Live audit log of department-to-department SOAP requests and WS-Security handshakes
 */
apiRouter.get('/interop/logs', (req, res) => {
  const logs = employmentService.getInteropLogs();
  res.json({
    success: true,
    total: logs.length,
    logs
  });
});

/**
 * GET /api/stats
 * Overview analytics for dashboard
 */
apiRouter.get('/stats', (req, res) => {
  const adminStats = employmentService.getAdminStats();
  res.json({
    success: true,
    ...adminStats.overview
  });
});

/**
 * POST /api/interop/simulate-soap
 * Helper tool for Master Gateway or testing UI to simulate sending a SOAP call with WS-Security
 */
apiRouter.post('/interop/simulate-soap', async (req, res) => {
  const {
    jobId,
    citizen,
    educationDeptVerification,
    username = 'INTEROP_GATEWAY_SERVICE',
    password = 'GovInterop@Secret#2026',
    invalidAuth = false
  } = req.body;

  const actualPassword = invalidAuth ? 'WrongPassword123' : password;
  const securityHeader = buildWSSecurityHeader(username, actualPassword);

  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header>${securityHeader}
  </soapenv:Header>
  <soapenv:Body>
    <emp:ApplyForJobRequest>
      <emp:JobId>${jobId || 'JOB-GOV-2026-01'}</emp:JobId>
      <emp:Citizen>
        <emp:AadhaarNumber>${citizen?.aadhaarNumber || '999912345678'}</emp:AadhaarNumber>
        <emp:FullName>${citizen?.fullName || 'Rahul Sharma'}</emp:FullName>
        <emp:FatherName>${citizen?.fatherName || 'Mohan Lal Sharma'}</emp:FatherName>
        <emp:DateOfBirth>${citizen?.dateOfBirth || '1998-05-14'}</emp:DateOfBirth>
        <emp:Gender>${citizen?.gender || 'Male'}</emp:Gender>
        <emp:Email>${citizen?.email || 'rahul.sharma@example.gov.in'}</emp:Email>
        <emp:Phone>${citizen?.phone || '+919876543210'}</emp:Phone>
        <emp:Address>${citizen?.address || 'Flat 402, Shanti Kunj, Dwarka'}</emp:Address>
        <emp:PinCode>${citizen?.pinCode || '110075'}</emp:PinCode>
        <emp:HighestQualification>${citizen?.highestQualification || 'B.Tech CS'}</emp:HighestQualification>
      </emp:Citizen>
      <emp:EducationDeptVerification>
        <emp:CertificateNumber>${educationDeptVerification?.certificateNumber || 'EDU-NCVT-2023-88219'}</emp:CertificateNumber>
        <emp:CourseName>${educationDeptVerification?.courseName || 'Advanced Python & Data Processing'}</emp:CourseName>
        <emp:IssuingAuthority>${educationDeptVerification?.issuingAuthority || 'Ministry of Skill Development & Education'}</emp:IssuingAuthority>
        <emp:IssueDate>${educationDeptVerification?.issueDate || '2023-08-20'}</emp:IssueDate>
        <emp:Status>${educationDeptVerification?.status || 'VERIFIED_BY_EDUCATION_DEPT'}</emp:Status>
        <emp:Grade>${educationDeptVerification?.grade || 'A+'}</emp:Grade>
      </emp:EducationDeptVerification>
      <emp:ApplicationSource>SSO_INTEROPERABILITY_GATEWAY</emp:ApplicationSource>
    </emp:ApplyForJobRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const port = process.env.PORT || 3000;
    const response = await fetch(`http://127.0.0.1:${port}/soap/employment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://employment.gov.in/interop/v1/ApplyForJob'
      },
      body: soapEnvelope
    });

    const responseText = await response.text();

    res.status(response.status).json({
      success: response.ok,
      httpStatus: response.status,
      dispatchedPayloadXml: soapEnvelope,
      soapResponseXml: responseText
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Failed to dispatch SOAP request: ${err.message}`,
      dispatchedPayloadXml: soapEnvelope
    });
  }
});
