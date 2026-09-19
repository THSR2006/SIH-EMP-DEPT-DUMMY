import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateWSSecurity, extractTagContent } from './wsSecurity.js';
import { employmentService } from '../services/employmentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WSDL_FILE = path.join(__dirname, 'employment.wsdl');

/**
 * Builds a standard SOAP 1.1 Fault envelope
 */
export function buildSoapFault(faultCode, faultString, detail = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Body>
    <soapenv:Fault>
      <faultcode>${faultCode}</faultcode>
      <faultstring>${faultString}</faultstring>
      ${detail ? `<detail><message>${detail}</message></detail>` : ''}
    </soapenv:Fault>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Wraps payload inside SOAP 1.1 Envelope
 */
export function wrapInSoapEnvelope(bodyXml) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header/>
  <soapenv:Body>
${bodyXml}
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Extracts a sub-object block e.g. <emp:Citizen>...</emp:Citizen>
 */
function extractBlock(xml, blockName) {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${blockName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${blockName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

/**
 * Parse XML block to Citizen object
 */
function parseCitizenXml(xml) {
  const block = extractBlock(xml, 'Citizen') || xml;
  return {
    aadhaarNumber: extractTagContent(block, 'AadhaarNumber') || '',
    fullName: extractTagContent(block, 'FullName') || '',
    fatherName: extractTagContent(block, 'FatherName') || '',
    dateOfBirth: extractTagContent(block, 'DateOfBirth') || '',
    gender: extractTagContent(block, 'Gender') || '',
    email: extractTagContent(block, 'Email') || '',
    phone: extractTagContent(block, 'Phone') || '',
    address: extractTagContent(block, 'Address') || '',
    pinCode: extractTagContent(block, 'PinCode') || '',
    highestQualification: extractTagContent(block, 'HighestQualification') || ''
  };
}

/**
 * Parse XML block to Education Dept Certificate Verification object
 */
function parseEducationVerificationXml(xml) {
  const block = extractBlock(xml, 'EducationDeptVerification') || xml;
  if (!block) return null;
  const certificatePdfBase64 = extractTagContent(block, 'CertificatePdfBase64') || '';
  const certificateMimeType = extractTagContent(block, 'CertificateMimeType') || 'application/pdf';
  const certificateFileName = extractTagContent(block, 'CertificateFileName') || 'skill-certificate.pdf';

  if (certificatePdfBase64 && certificateMimeType !== 'application/pdf') {
    throw new Error('CertificateMimeType must be application/pdf.');
  }
  if (certificatePdfBase64 && !/^[A-Za-z0-9+/\s]+=*$/.test(certificatePdfBase64)) {
    throw new Error('CertificatePdfBase64 must contain a valid Base64-encoded PDF.');
  }

  return {
    certificateNumber: extractTagContent(block, 'CertificateNumber') || '',
    courseName: extractTagContent(block, 'CourseName') || '',
    issuingAuthority: extractTagContent(block, 'IssuingAuthority') || 'Ministry of Skill Development & Education',
    issueDate: extractTagContent(block, 'IssueDate') || '',
    grade: extractTagContent(block, 'Grade') || 'Pass',
    status: extractTagContent(block, 'Status') || 'VERIFIED_BY_EDUCATION_DEPT',
    verifiedHash: extractTagContent(block, 'VerifiedHash') || '',
    certificateFileName,
    certificateMimeType,
    certificatePdfBase64: certificatePdfBase64.replace(/\s/g, '')
  };
}

/**
 * Detect which SOAP operation is requested
 */
function detectOperation(xml, soapAction = '') {
  if (soapAction.includes('GetAvailableJobs') || /<[^:]*:?GetAvailableJobsRequest/i.test(xml)) {
    return 'GetAvailableJobs';
  }
  if (soapAction.includes('CheckEligibility') || /<[^:]*:?CheckEligibilityRequest/i.test(xml)) {
    return 'CheckEligibility';
  }
  if (soapAction.includes('ApplyForJob') || /<[^:]*:?ApplyForJobRequest/i.test(xml)) {
    return 'ApplyForJob';
  }
  if (soapAction.includes('GetApplicationStatus') || /<[^:]*:?GetApplicationStatusRequest/i.test(xml)) {
    return 'GetApplicationStatus';
  }
  if (soapAction.includes('GetCitizenByAadhaar') || /<[^:]*:?GetCitizenByAadhaarRequest/i.test(xml)) {
    return 'GetCitizenByAadhaar';
  }
  return 'UNKNOWN';
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Core SOAP Request Dispatcher
 */
export async function handleSoapRequest(req, res) {
  const startTime = Date.now();
  const rawXml = req.body ? req.body.toString('utf-8') : '';
  const soapAction = req.headers['soapaction'] || '';

  // 1. Check if request body is empty
  if (!rawXml.trim()) {
    const fault = buildSoapFault('Client', 'Empty SOAP Request Body received.');
    return res.status(400).set('Content-Type', 'text/xml; charset=utf-8').send(fault);
  }

  // 2. Validate OASIS WS-Security Header
  const secResult = validateWSSecurity(rawXml);
  if (!secResult.isValid) {
    const fault = buildSoapFault(secResult.faultCode, secResult.faultString);
    employmentService.logInteropTransaction({
      operation: detectOperation(rawXml, soapAction),
      protocol: 'SOAP 1.1 + WS-Security',
      authStatus: 'FAILED',
      authError: secResult.faultString,
      clientIp: req.ip || req.socket.remoteAddress,
      rawRequestSnippet: rawXml.substring(0, 500),
      rawResponseSnippet: fault,
      latencyMs: Date.now() - startTime
    });
    return res.status(401).set('Content-Type', 'text/xml; charset=utf-8').send(fault);
  }

  // 3. Dispatch operation
  const operation = detectOperation(rawXml, soapAction);
  let responseXml = '';
  let httpStatus = 200;

  try {
    switch (operation) {
      case 'GetAvailableJobs': {
        const jobs = employmentService.searchJobs({
          category: extractTagContent(rawXml, 'Category'),
          status: extractTagContent(rawXml, 'Status'),
          ageGreaterThan: extractTagContent(rawXml, 'AgeGreaterThan'),
          experienceLessThan: extractTagContent(rawXml, 'ExperienceLessThan')
        });
        const jobsXml = jobs
          .map(
            (j) => `
        <emp:JobItem>
          <emp:JobId>${escapeXml(j.id)}</emp:JobId>
          <emp:Title>${escapeXml(j.title)}</emp:Title>
          <emp:Department>${escapeXml(j.department)}</emp:Department>
          <emp:Category>${escapeXml(j.category)}</emp:Category>
          <emp:Vacancies>${j.vacancies}</emp:Vacancies>
          <emp:MinAge>${j.eligibility.minAge}</emp:MinAge>
          <emp:MaxAge>${j.eligibility.maxAge}</emp:MaxAge>
          <emp:ExperienceRequiredYears>${j.experienceRequiredYears}</emp:ExperienceRequiredYears>
          <emp:MinEducation>${j.eligibility.minEducation}</emp:MinEducation>
          <emp:MandatorySkill>${j.eligibility.mandatorySkillCertificate?.name || 'None'}</emp:MandatorySkill>
          <emp:Deadline>${j.deadline}</emp:Deadline>
        </emp:JobItem>`
          )
          .join('');

        responseXml = wrapInSoapEnvelope(`
    <emp:GetAvailableJobsResponse>
      <emp:TotalCount>${jobs.length}</emp:TotalCount>
      <emp:AppliedFilters>
        <emp:Category>${escapeXml(extractTagContent(rawXml, 'Category') || '')}</emp:Category>
        <emp:Status>${escapeXml(extractTagContent(rawXml, 'Status') || '')}</emp:Status>
        <emp:AgeGreaterThan>${escapeXml(extractTagContent(rawXml, 'AgeGreaterThan') || '')}</emp:AgeGreaterThan>
        <emp:ExperienceLessThan>${escapeXml(extractTagContent(rawXml, 'ExperienceLessThan') || '')}</emp:ExperienceLessThan>
      </emp:AppliedFilters>
      <emp:JobsList>${jobsXml}
      </emp:JobsList>
    </emp:GetAvailableJobsResponse>`);
        break;
      }

      case 'CheckEligibility': {
        const jobId = extractTagContent(rawXml, 'JobId') || '';
        const citizen = parseCitizenXml(rawXml);
        const eduCert = parseEducationVerificationXml(rawXml);

        const check = employmentService.checkEligibility(jobId, citizen, eduCert);

        responseXml = wrapInSoapEnvelope(`
    <emp:CheckEligibilityResponse>
      <emp:JobId>${jobId}</emp:JobId>
      <emp:Eligible>${check.eligible}</emp:Eligible>
      <emp:CalculatedAge>${check.calculatedAge !== null ? check.calculatedAge : 'N/A'}</emp:CalculatedAge>
      <emp:Remarks>${check.eligible ? 'Candidate meets all age, education, and skill certificate criteria.' : check.reasons.join('; ')}</emp:Remarks>
    </emp:CheckEligibilityResponse>`);
        break;
      }

      case 'ApplyForJob': {
        const jobId = extractTagContent(rawXml, 'JobId') || '';
        const citizen = parseCitizenXml(rawXml);
        const educationVerification = parseEducationVerificationXml(rawXml);
        const applicationSource = extractTagContent(rawXml, 'ApplicationSource') || 'SSO_INTEROPERABILITY_GATEWAY';

        const application = employmentService.submitSoapApplication(
          {
            jobId,
            citizen,
            educationVerification,
            applicationSource
          },
          {
            username: secResult.username,
            timestamp: secResult.created
          }
        );

        responseXml = wrapInSoapEnvelope(`
    <emp:ApplyForJobResponse>
      <emp:Status>APPROVED_AND_REGISTERED</emp:Status>
      <emp:ApplicationNumber>${application.applicationId}</emp:ApplicationNumber>
      <emp:JobId>${application.jobId}</emp:JobId>
      <emp:JobTitle>${application.jobTitle}</emp:JobTitle>
      <emp:CandidateName>${application.citizen.fullName}</emp:CandidateName>
      <emp:MaskedAadhaar>${application.citizen.maskedAadhaar}</emp:MaskedAadhaar>
      <emp:SkillCertificateVerified>${application.educationCertificate.isVerifiedBySourceDept}</emp:SkillCertificateVerified>
      <emp:CertificatePdfReceived>${Boolean(application.educationCertificate.certificateStoragePath)}</emp:CertificatePdfReceived>
      <emp:CertificateFileName>${escapeXml(application.educationCertificate.certificateFileName || '')}</emp:CertificateFileName>
      <emp:SubmissionTimestamp>${application.appliedAt}</emp:SubmissionTimestamp>
      <emp:Mode>${application.submissionMode}</emp:Mode>
      <emp:Message>Job application successfully received and verified over SOAP with WS-Security via Interoperability Gateway.</emp:Message>
    </emp:ApplyForJobResponse>`);
        break;
      }

      case 'GetApplicationStatus': {
        const appNo = extractTagContent(rawXml, 'ApplicationNumber') || '';
        const app = employmentService.getApplicationById(appNo);

        if (!app) {
          responseXml = wrapInSoapEnvelope(`
    <emp:GetApplicationStatusResponse>
      <emp:Found>false</emp:Found>
      <emp:ApplicationNumber>${appNo}</emp:ApplicationNumber>
      <emp:Status>NOT_FOUND</emp:Status>
      <emp:Message>No application found with the specified reference number.</emp:Message>
    </emp:GetApplicationStatusResponse>`);
        } else {
          responseXml = wrapInSoapEnvelope(`
    <emp:GetApplicationStatusResponse>
      <emp:Found>true</emp:Found>
      <emp:ApplicationNumber>${app.applicationId}</emp:ApplicationNumber>
      <emp:Status>${app.status}</emp:Status>
      <emp:JobTitle>${app.jobTitle}</emp:JobTitle>
      <emp:CandidateName>${app.citizen.fullName}</emp:CandidateName>
      <emp:SubmissionMode>${app.submissionMode}</emp:SubmissionMode>
      <emp:AppliedAt>${app.appliedAt}</emp:AppliedAt>
      <emp:VerificationNote>${app.educationCertificate.verificationNote}</emp:VerificationNote>
    </emp:GetApplicationStatusResponse>`);
        }
        break;
      }

      case 'GetCitizenByAadhaar': {
        const aadhaarNo = extractTagContent(rawXml, 'AadhaarNumber') || '';
        const citizen = employmentService.getCitizenByAadhaar(aadhaarNo);

        if (!citizen) {
          responseXml = wrapInSoapEnvelope(`
    <emp:GetCitizenByAadhaarResponse>
      <emp:Found>false</emp:Found>
      <emp:AadhaarNumber>${aadhaarNo}</emp:AadhaarNumber>
      <emp:Message>No citizen registered with the provided Aadhaar number.</emp:Message>
    </emp:GetCitizenByAadhaarResponse>`);
        } else {
          responseXml = wrapInSoapEnvelope(`
    <emp:GetCitizenByAadhaarResponse>
      <emp:Found>true</emp:Found>
      <emp:AadhaarNumber>${citizen.aadhaarNumber}</emp:AadhaarNumber>
      <emp:RegistrationNumber>${citizen.registrationNumber}</emp:RegistrationNumber>
      <emp:FullName>${citizen.fullName}</emp:FullName>
      <emp:FatherName>${citizen.fatherName}</emp:FatherName>
      <emp:DateOfBirth>${citizen.dateOfBirth}</emp:DateOfBirth>
      <emp:Gender>${citizen.gender}</emp:Gender>
      <emp:Category>${citizen.category}</emp:Category>
      <emp:HighestQualification>${citizen.highestQualification}</emp:HighestQualification>
      <emp:EmploymentStatus>${citizen.employmentStatus}</emp:EmploymentStatus>
      <emp:SkillCertificateNumber>${citizen.educationCertificate?.certificateNumber || 'N/A'}</emp:SkillCertificateNumber>
      <emp:SkillCertificateCourse>${citizen.educationCertificate?.courseName || 'N/A'}</emp:SkillCertificateCourse>
      <emp:SkillCertificateVerified>${citizen.educationCertificate?.status === 'VERIFIED_BY_EDUCATION_DEPT'}</emp:SkillCertificateVerified>
    </emp:GetCitizenByAadhaarResponse>`);
        }
        break;
      }

      default: {
        httpStatus = 400;
        responseXml = buildSoapFault(
          'Client.UnknownOperation',
          `Unknown SOAP Operation. Supported actions: GetAvailableJobs, CheckEligibility, ApplyForJob, GetApplicationStatus, GetCitizenByAadhaar.`
        );
      }
    }
  } catch (err) {
    httpStatus = 400;
    responseXml = buildSoapFault('Server.ProcessingError', err.message, err.reasons ? err.reasons.join(', ') : '');
  }

  // 4. Log the Interop SOAP exchange for real-time audit and demo screen
  employmentService.logInteropTransaction({
    operation,
    protocol: 'SOAP 1.1 + OASIS WS-Security',
    authStatus: 'AUTHORIZED',
    authenticatedUser: secResult.username,
    httpStatus,
    rawRequestSnippet: rawXml.length > 2000 ? rawXml.substring(0, 2000) + '...[truncated]' : rawXml,
    rawResponseSnippet: responseXml.length > 2000 ? responseXml.substring(0, 2000) + '...[truncated]' : responseXml,
    latencyMs: Date.now() - startTime
  });

  res.status(httpStatus).set('Content-Type', 'text/xml; charset=utf-8').send(responseXml);
}

/**
 * Serves WSDL file for GET /soap/employment?wsdl
 */
export function serveWsdl(req, res) {
  try {
    const wsdlContent = fs.readFileSync(WSDL_FILE, 'utf-8');
    res.status(200).set('Content-Type', 'text/xml; charset=utf-8').send(wsdlContent);
  } catch (err) {
    res.status(500).send(`Error reading WSDL: ${err.message}`);
  }
}
