import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const CITIZENS_FILE = path.join(DATA_DIR, 'registered-citizens.json');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const LOGS_FILE = path.join(DATA_DIR, 'interop-logs.json');
const CERTIFICATES_DIR = path.join(__dirname, '../../uploads/certificates');

function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

export function maskAadhaar(aadhaar) {
  if (!aadhaar) return 'XXXX-XXXX-0000';
  const clean = String(aadhaar).replace(/[^0-9]/g, '');
  if (clean.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function calculateAge(dobString) {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export class EmploymentService {
  constructor() {
    this.jobs = readJson(JOBS_FILE);
    this.citizens = readJson(CITIZENS_FILE);
    this.applications = readJson(APPLICATIONS_FILE);
    this.interopLogs = readJson(LOGS_FILE);
  }

  getJobs() {
    return this.jobs;
  }

  searchJobs(query = {}) {
    let result = [...this.jobs];

    if (query.category) {
      const category = String(query.category).trim().toLowerCase();
      result = result.filter((job) => job.category.toLowerCase().includes(category));
    }

    if (query.status) {
      const status = String(query.status).trim().toLowerCase();
      result = result.filter((job) => job.status.toLowerCase() === status);
    }

    if (query.ageGreaterThan !== undefined && query.ageGreaterThan !== '') {
      const age = Number(query.ageGreaterThan);
      if (!Number.isFinite(age)) throw new Error('AgeGreaterThan must be a number.');
      result = result.filter((job) => job.eligibility.maxAge > age);
    }

    if (query.experienceLessThan !== undefined && query.experienceLessThan !== '') {
      const experience = Number(query.experienceLessThan);
      if (!Number.isFinite(experience)) throw new Error('ExperienceLessThan must be a number.');
      result = result.filter((job) => job.experienceRequiredYears < experience);
    }

    return result;
  }

  getJobById(jobId) {
    return this.jobs.find((j) => j.id.toLowerCase() === String(jobId).toLowerCase()) || null;
  }

  storeCertificatePdf(applicationNumber, educationVerification) {
    const base64 = educationVerification?.certificatePdfBase64;
    if (!base64) return null;

    const pdfBuffer = Buffer.from(base64, 'base64');
    if (pdfBuffer.length === 0 || pdfBuffer.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('CertificatePdfBase64 must contain a valid PDF file.');
    }
    if (pdfBuffer.length > 4 * 1024 * 1024) {
      throw new Error('Certificate PDF must be 4 MB or smaller.');
    }

    fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
    const fileName = `${applicationNumber}.pdf`;
    fs.writeFileSync(path.join(CERTIFICATES_DIR, fileName), pdfBuffer);
    return `uploads/certificates/${fileName}`;
  }

  getRegisteredCitizens() {
    return this.citizens;
  }

  /**
   * Search/query registered citizens for the Master Website or citizen search
   * Supports aadhaar, name, age range, pagination/slice range (e.g. index 5 to 10 or limit/offset)
   */
  searchCitizens(query = {}) {
    let result = [...this.citizens];

    // Aadhaar search (exact or last 4 digits)
    if (query.aadhaar) {
      const clean = String(query.aadhaar).replace(/[^0-9]/g, '');
      result = result.filter((c) => {
        const citizenClean = c.aadhaarNumber.replace(/[^0-9]/g, '');
        return citizenClean === clean || citizenClean.endsWith(clean);
      });
    }

    // Name search (case insensitive substring)
    if (query.name) {
      const n = query.name.trim().toLowerCase();
      result = result.filter((c) => c.fullName.toLowerCase().includes(n));
    }

    // Skill or qualification search
    if (query.skill) {
      const s = query.skill.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.skills.some((sk) => sk.toLowerCase().includes(s)) ||
          c.highestQualification.toLowerCase().includes(s) ||
          c.educationCertificate.courseName.toLowerCase().includes(s)
      );
    }

    // Employment status filter
    if (query.status) {
      const st = query.status.trim().toLowerCase();
      result = result.filter((c) => c.employmentStatus.toLowerCase().includes(st));
    }

    // Age range filters
    if (query.minAge || query.maxAge) {
      result = result.filter((c) => {
        const age = calculateAge(c.dateOfBirth);
        if (age === null) return false;
        if (query.minAge && age < parseInt(query.minAge, 10)) return false;
        if (query.maxAge && age > parseInt(query.maxAge, 10)) return false;
        return true;
      });
    }

    const totalMatches = result.length;

    // Range slicing (e.g. start=5, end=10, or offset & limit)
    if (query.start !== undefined || query.end !== undefined) {
      const startIdx = Math.max(0, parseInt(query.start || 0, 10));
      const endIdx = query.end ? Math.min(result.length, parseInt(query.end, 10)) : result.length;
      result = result.slice(startIdx, endIdx);
    } else if (query.offset !== undefined || query.limit !== undefined) {
      const offset = Math.max(0, parseInt(query.offset || 0, 10));
      const limit = query.limit ? parseInt(query.limit, 10) : result.length;
      result = result.slice(offset, offset + limit);
    }

    return {
      total: totalMatches,
      count: result.length,
      citizens: result
    };
  }

  getCitizenByAadhaar(aadhaar) {
    const clean = String(aadhaar).replace(/[^0-9]/g, '');
    return this.citizens.find((c) => c.aadhaarNumber.replace(/[^0-9]/g, '') === clean) || null;
  }

  checkEligibility(jobId, citizen, educationCert) {
    const job = this.getJobById(jobId);
    if (!job) {
      return {
        eligible: false,
        reasons: [`Job ID ${jobId} does not exist in employment registry.`]
      };
    }

    const reasons = [];
    const age = calculateAge(citizen.dateOfBirth);

    if (age === null) {
      reasons.push('Invalid or missing Date of Birth.');
    } else {
      if (job.eligibility.minAge && age < job.eligibility.minAge) {
        reasons.push(`Underage: Candidate is ${age} years old; minimum required age is ${job.eligibility.minAge}.`);
      }
      if (job.eligibility.maxAge && age > job.eligibility.maxAge) {
        reasons.push(`Overage: Candidate is ${age} years old; maximum allowable age is ${job.eligibility.maxAge}.`);
      }
    }

    if (job.eligibility.aadhaarRequired && !citizen.aadhaarNumber) {
      reasons.push('Valid 12-digit Aadhaar identification is required for this post.');
    }

    if (job.eligibility.mandatorySkillCertificate?.required) {
      if (!educationCert || !educationCert.certificateNumber) {
        reasons.push(`Mandatory Skill Certificate required: ${job.eligibility.mandatorySkillCertificate.name}.`);
      }
    }

    // Check duplicate application
    const existing = this.applications.find(
      (app) =>
        app.jobId.toLowerCase() === String(jobId).toLowerCase() &&
        app.citizen.aadhaarNumber === String(citizen.aadhaarNumber).replace(/[^0-9]/g, '')
    );
    if (existing) {
      reasons.push(`Application already exists for this post (Application ID: ${existing.applicationId}).`);
    }

    return {
      eligible: reasons.length === 0,
      calculatedAge: age,
      reasons
    };
  }

  submitManualApplication(payload) {
    const { jobId, citizen, educationCertificate } = payload;
    const job = this.getJobById(jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found.`);
    }

    const cleanAadhaar = String(citizen.aadhaarNumber || '').replace(/[^0-9]/g, '');
    const eligibility = this.checkEligibility(jobId, { ...citizen, aadhaarNumber: cleanAadhaar }, educationCertificate);

    if (!eligibility.eligible) {
      const err = new Error(eligibility.reasons.join(' | '));
      err.reasons = eligibility.reasons;
      throw err;
    }

    const applicationNumber = `EMP-MANUAL-${Date.now().toString().slice(-6)}`;
    const newApp = {
      applicationId: applicationNumber,
      jobId: job.id,
      jobTitle: job.title,
      submissionMode: 'MANUAL_ENTRY',
      status: 'PENDING_MANUAL_VERIFICATION',
      appliedAt: new Date().toISOString(),
      citizen: {
        aadhaarNumber: cleanAadhaar,
        maskedAadhaar: maskAadhaar(cleanAadhaar),
        fullName: citizen.fullName,
        fatherName: citizen.fatherName || '',
        dateOfBirth: citizen.dateOfBirth,
        gender: citizen.gender || '',
        email: citizen.email || '',
        phone: citizen.phone || '',
        address: citizen.address || '',
        pinCode: citizen.pinCode || '',
        highestQualification: citizen.highestQualification || ''
      },
      educationCertificate: {
        certificateNumber: educationCertificate?.certificateNumber || 'N/A',
        courseName: educationCertificate?.courseName || 'Self-declared',
        issuingAuthority: educationCertificate?.issuingAuthority || 'Self-declared / Uploaded PDF',
        isVerifiedBySourceDept: false,
        verificationNote: 'Manual entry application requires physical verification and document scrutiny.'
      },
      interopAudit: null
    };

    this.applications.unshift(newApp);
    writeJson(APPLICATIONS_FILE, this.applications);
    return newApp;
  }

  submitSoapApplication(data, securityAudit) {
    const { jobId, citizen, educationVerification, applicationSource } = data;
    const job = this.getJobById(jobId);
    if (!job) {
      throw new Error(`Requested Job ID '${jobId}' is not listed in the Employment Department.`);
    }

    const cleanAadhaar = String(citizen.aadhaarNumber || '').replace(/[^0-9]/g, '');
    const eligibility = this.checkEligibility(jobId, { ...citizen, aadhaarNumber: cleanAadhaar }, educationVerification);

    if (!eligibility.eligible) {
      const err = new Error(`Eligibility Verification Failed: ${eligibility.reasons.join('; ')}`);
      err.reasons = eligibility.reasons;
      throw err;
    }

    const isVerifiedByEduDept =
      educationVerification?.status === 'VERIFIED_BY_EDUCATION_DEPT' ||
      Boolean(educationVerification?.verifiedHash);

    const applicationNumber = `EMP-SSO-${Date.now().toString().slice(-6)}`;
    const certificateStoragePath = this.storeCertificatePdf(applicationNumber, educationVerification);
    const newApp = {
      applicationId: applicationNumber,
      jobId: job.id,
      jobTitle: job.title,
      submissionMode: 'SSO_INTEROPERABILITY_GATEWAY',
      sourceChannel: 'MASTER_WEBSITE_SOAP_WS_SECURITY',
      status: 'APPROVED_AND_REGISTERED',
      appliedAt: new Date().toISOString(),
      citizen: {
        aadhaarNumber: cleanAadhaar,
        maskedAadhaar: maskAadhaar(cleanAadhaar),
        fullName: citizen.fullName,
        fatherName: citizen.fatherName,
        dateOfBirth: citizen.dateOfBirth,
        gender: citizen.gender,
        email: citizen.email,
        phone: citizen.phone,
        address: citizen.address,
        pinCode: citizen.pinCode,
        highestQualification: citizen.highestQualification
      },
      educationCertificate: {
        certificateNumber: educationVerification?.certificateNumber,
        courseName: educationVerification?.courseName,
        issuingAuthority: educationVerification?.issuingAuthority || 'Ministry of Skill Development & Education',
        issueDate: educationVerification?.issueDate,
        grade: educationVerification?.grade,
        certificateFileName: educationVerification?.certificateFileName || 'skill-certificate.pdf',
        certificateMimeType: educationVerification?.certificateMimeType || 'application/pdf',
        certificateStoragePath,
        certificateSizeBytes: certificateStoragePath
          ? fs.statSync(path.join(__dirname, '../../', certificateStoragePath)).size
          : 0,
        isVerifiedBySourceDept: isVerifiedByEduDept,
        verificationNote: isVerifiedByEduDept
          ? 'Instantly verified via Interoperability Gateway from Department of Education registry.'
          : 'Pending Education Dept verification hash confirmation.'
      },
      interopAudit: {
        protocol: 'SOAP 1.1 with OASIS WS-Security',
        authenticatedServiceUser: securityAudit?.username || 'INTEROP_GATEWAY_SERVICE',
        wsseTokenTimestamp: securityAudit?.timestamp || new Date().toISOString(),
        applicationSource: applicationSource || 'SSO_INTEROPERABILITY_GATEWAY',
        sourceChannel: 'Master Website Gateway',
        instantEligibilityVerified: true
      }
    };

    this.applications.unshift(newApp);
    writeJson(APPLICATIONS_FILE, this.applications);
    return newApp;
  }

  getApplications(filter = {}) {
    let result = [...this.applications];
    if (filter.submissionMode) {
      result = result.filter((a) => a.submissionMode === filter.submissionMode);
    }
    if (filter.sourceChannel) {
      result = result.filter((a) => a.sourceChannel === filter.sourceChannel);
    }
    if (filter.jobId) {
      result = result.filter((a) => a.jobId.toLowerCase() === filter.jobId.toLowerCase());
    }
    if (filter.aadhaar) {
      const clean = String(filter.aadhaar).replace(/[^0-9]/g, '');
      result = result.filter((a) => a.citizen.aadhaarNumber === clean);
    }
    if (filter.status) {
      result = result.filter((a) => a.status === filter.status);
    }
    return result;
  }

  getApplicationById(applicationId) {
    return (
      this.applications.find(
        (a) => a.applicationId.toLowerCase() === String(applicationId).toLowerCase()
      ) || null
    );
  }

  updateApplicationStatus(applicationId, newStatus, adminNote = '') {
    const app = this.getApplicationById(applicationId);
    if (!app) {
      return null;
    }
    app.status = newStatus;
    if (adminNote) {
      app.adminReview = {
        updatedAt: new Date().toISOString(),
        note: adminNote
      };
    }
    writeJson(APPLICATIONS_FILE, this.applications);
    return app;
  }

  getAdminStats() {
    const totalApps = this.applications.length;
    const masterWebsiteApps = this.applications.filter(
      (a) => a.submissionMode === 'SSO_INTEROPERABILITY_GATEWAY'
    );
    const manualApps = this.applications.filter((a) => a.submissionMode === 'MANUAL_ENTRY');

    const latestMasterApp = masterWebsiteApps.length > 0 ? masterWebsiteApps[0] : null;

    const soapCalls = this.interopLogs.filter((l) => l.protocol.includes('SOAP'));
    const authorizedSoapCalls = soapCalls.filter((l) => l.authStatus === 'AUTHORIZED');

    return {
      overview: {
        totalApplicationsReceived: totalApps,
        pendingApplications: this.applications.filter((a) => a.status.includes('PENDING') || a.status === 'UNDER_REVIEW').length,
        approvedApplications: this.applications.filter((a) => a.status === 'APPROVED_AND_REGISTERED').length,
        interoperabilityApplications: masterWebsiteApps.length,
        receivedFromMasterWebsite: {
          count: masterWebsiteApps.length,
          percentage: totalApps > 0 ? `${Math.round((masterWebsiteApps.length / totalApps) * 100)}%` : '0%',
          protocol: 'SOAP 1.1 + WS-Security (UsernameToken)',
          verification: 'Automated 100% Instant Cross-Department Verification'
        },
        receivedViaManualEntry: {
          count: manualApps.length,
          percentage: totalApps > 0 ? `${Math.round((manualApps.length / totalApps) * 100)}%` : '0%',
          status: 'Requires Manual Paper Verification'
        },
        totalRegisteredCitizensInExchange: this.citizens.length,
        totalActiveJobVacancies: this.jobs.length
      },
      latestReceivedFromMasterWebsite: latestMasterApp,
      interoperabilityTelemetry: {
        totalInterDepartmentSoapCalls: soapCalls.length,
        authorizedCalls: authorizedSoapCalls.length,
        securityViolationsBlocked: soapCalls.length - authorizedSoapCalls.length,
        lastInteroperabilityInteraction: this.interopLogs.length > 0 ? this.interopLogs[0].timestamp : null
      },
      recentApplicationsSummary: this.applications.slice(0, 10).map((a) => ({
        applicationId: a.applicationId,
        jobTitle: a.jobTitle,
        candidateName: a.citizen.fullName,
        maskedAadhaar: a.citizen.maskedAadhaar,
        submissionMode: a.submissionMode,
        receivedFromMasterWebsite: a.submissionMode === 'SSO_INTEROPERABILITY_GATEWAY',
        status: a.status,
        appliedAt: a.appliedAt,
        skillVerified: a.educationCertificate.isVerifiedBySourceDept
      }))
    };
  }

  logInteropTransaction(logEntry) {
    const entry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    this.interopLogs.unshift(entry);
    if (this.interopLogs.length > 100) {
      this.interopLogs = this.interopLogs.slice(0, 100);
    }
    writeJson(LOGS_FILE, this.interopLogs);
    return entry;
  }

  getInteropLogs() {
    return this.interopLogs;
  }
}

export const employmentService = new EmploymentService();
