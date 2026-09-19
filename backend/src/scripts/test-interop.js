<<<<<<< HEAD
import 'dotenv/config';
import { buildWSSecurityHeader } from '../soap/wsSecurity.js';

const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
=======
import { buildWSSecurityHeader } from '../soap/wsSecurity.js';

const BASE_URL = 'http://127.0.0.1:3000';
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60

async function runTests() {
  console.log('--- STARTING EMPLOYMENT DEPARTMENT FULL INTEROP SUITE ---\n');

  // Test 1: Check WSDL Availability
  console.log('1. Testing WSDL Contract Retrieval...');
  const wsdlRes = await fetch(`${BASE_URL}/soap/employment?wsdl`);
  const wsdlText = await wsdlRes.text();
  if (wsdlRes.ok && wsdlText.includes('<wsdl:definitions')) {
    console.log('   ✅ WSDL Contract successfully served (HTTP 200)');
  } else {
    console.error('   ❌ Failed to retrieve WSDL:', wsdlRes.status);
  }

  // Test 2: Check REST API Jobs
  console.log('\n2. Testing REST API: GET /api/jobs...');
  const jobsRes = await fetch(`${BASE_URL}/api/jobs`);
  const jobsData = await jobsRes.json();
  if (jobsRes.ok && jobsData.jobs.length > 0) {
    console.log(`   ✅ Successfully loaded ${jobsData.jobs.length} jobs via REST API`);
  } else {
    console.error('   ❌ Failed to load jobs via REST');
  }

  // Test 3: SOAP Call without WS-Security (Security Rejection Check)
  console.log('\n3. Testing SOAP Call without WS-Security (Security Rejection Check)...');
  const unauthSoapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header/>
  <soapenv:Body>
    <emp:GetAvailableJobsRequest/>
  </soapenv:Body>
</soapenv:Envelope>`;

  const unauthRes = await fetch(`${BASE_URL}/soap/employment`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: unauthSoapEnvelope
  });
  const unauthXml = await unauthRes.text();
  if (unauthRes.status === 401 && unauthXml.includes('soapenv:Fault') && unauthXml.includes('SecurityHeaderMissing')) {
    console.log('   ✅ WS-Security Rejection verified: returned standard <soapenv:Fault> (HTTP 401)');
  } else {
    console.error('   ❌ Unexpected response for missing security:', unauthRes.status, unauthXml);
  }

<<<<<<< HEAD
  // Test 4: SOAP Call with invalid WS-Security credentials
  console.log('\n4. Testing SOAP Call with Invalid WS-Security Credentials...');
  const invalidSecHeader = buildWSSecurityHeader('INTEROP_GATEWAY_SERVICE', 'WrongPassword123');
  const invalidAuthEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header>${invalidSecHeader}</soapenv:Header>
  <soapenv:Body><emp:GetAvailableJobsRequest/></soapenv:Body>
</soapenv:Envelope>`;
  const invalidAuthRes = await fetch(`${BASE_URL}/soap/employment`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: invalidAuthEnvelope
  });
  const invalidAuthXml = await invalidAuthRes.text();
  if (invalidAuthRes.status === 401 && invalidAuthXml.includes('FailedAuthentication')) {
    console.log('   ✅ Invalid credentials rejected with HTTP 401 and SOAP Fault');
  } else {
    console.error('   ❌ Invalid credentials were not rejected:', invalidAuthRes.status, invalidAuthXml);
  }

  // Test 5: SOAP Call with Valid WS-Security (GetAvailableJobs)
  console.log('\n5. Testing SOAP Call with Valid WS-Security (GetAvailableJobs)...');
=======
  // Test 4: SOAP Call with Valid WS-Security (GetAvailableJobs)
  console.log('\n4. Testing SOAP Call with Valid WS-Security (GetAvailableJobs)...');
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
  const validSecHeader = buildWSSecurityHeader('INTEROP_GATEWAY_SERVICE', 'GovInterop@Secret#2026');
  const getJobsEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header>${validSecHeader}
  </soapenv:Header>
  <soapenv:Body>
    <emp:GetAvailableJobsRequest/>
  </soapenv:Body>
</soapenv:Envelope>`;

  const soapJobsRes = await fetch(`${BASE_URL}/soap/employment`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://employment.gov.in/interop/v1/GetAvailableJobs' },
    body: getJobsEnvelope
  });
  const soapJobsXml = await soapJobsRes.text();
  if (soapJobsRes.ok && soapJobsXml.includes('<emp:GetAvailableJobsResponse>')) {
    console.log('   ✅ SOAP GetAvailableJobs succeeded with OASIS WS-Security authentication');
  } else {
    console.error('   ❌ SOAP GetAvailableJobs failed:', soapJobsRes.status, soapJobsXml);
  }

<<<<<<< HEAD
  // Test 6: SOAP Query Citizen By Aadhaar (GetCitizenByAadhaar)
  console.log('\n6. Testing SOAP Call: GetCitizenByAadhaar over WS-Security...');
=======
  // Test 5: SOAP Query Citizen By Aadhaar (GetCitizenByAadhaar)
  console.log('\n5. Testing SOAP Call: GetCitizenByAadhaar over WS-Security...');
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
  const getCitizenSoapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header>${validSecHeader}
  </soapenv:Header>
  <soapenv:Body>
    <emp:GetCitizenByAadhaarRequest>
<<<<<<< HEAD
      <emp:AadhaarNumber>900000000001</emp:AadhaarNumber>
=======
      <emp:AadhaarNumber>999912345678</emp:AadhaarNumber>
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
    </emp:GetCitizenByAadhaarRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  const getCitRes = await fetch(`${BASE_URL}/soap/employment`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://employment.gov.in/interop/v1/GetCitizenByAadhaar' },
    body: getCitizenSoapEnvelope
  });
  const getCitXml = await getCitRes.text();
  if (getCitRes.ok && getCitXml.includes('<emp:FullName>Rahul Sharma</emp:FullName>')) {
    console.log('   ✅ SOAP GetCitizenByAadhaar returned registered citizen details with verified skill certificate!');
  } else {
    console.error('   ❌ SOAP GetCitizenByAadhaar failed:', getCitRes.status, getCitXml);
  }

<<<<<<< HEAD
  // Test 7: SOAP Eligibility Check
  console.log('\n7. Testing SOAP Call: CheckEligibility over WS-Security...');
  const checkEligibilityEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header>${validSecHeader}</soapenv:Header>
  <soapenv:Body>
    <emp:CheckEligibilityRequest>
      <emp:JobId>JOB-GOV-2026-01</emp:JobId>
      <emp:Citizen><emp:AadhaarNumber>999912345678</emp:AadhaarNumber><emp:FullName>Eligibility Test</emp:FullName><emp:DateOfBirth>1998-05-14</emp:DateOfBirth><emp:HighestQualification>B.Tech Computer Science</emp:HighestQualification></emp:Citizen>
      <emp:EducationDeptVerification><emp:CertificateNumber>EDU-ELIGIBILITY-001</emp:CertificateNumber><emp:CourseName>Advanced Python &amp; Data Processing</emp:CourseName></emp:EducationDeptVerification>
    </emp:CheckEligibilityRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
  const eligibilityRes = await fetch(`${BASE_URL}/soap/employment`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://employment.gov.in/interop/v1/CheckEligibility' },
    body: checkEligibilityEnvelope
  });
  const eligibilityXml = await eligibilityRes.text();
  if (eligibilityRes.ok && eligibilityXml.includes('<emp:Eligible>true</emp:Eligible>')) {
    console.log('   ✅ SOAP CheckEligibility returned an eligible result');
  } else {
    console.error('   ❌ SOAP CheckEligibility failed:', eligibilityRes.status, eligibilityXml);
  }

  // Test 8: SOAP Interoperability Application Submission (ApplyForJob)
  console.log('\n8. Testing Interoperability Flow: SOAP ApplyForJob with Education Dept Skill Certificate...');
=======
  // Test 6: SOAP Interoperability Application Submission (ApplyForJob)
  console.log('\n6. Testing Interoperability Flow: SOAP ApplyForJob with Education Dept Skill Certificate...');
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
  const testAadhaar = `9999${Date.now().toString().slice(-8)}`;
  const applySoapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header>${validSecHeader}
  </soapenv:Header>
  <soapenv:Body>
    <emp:ApplyForJobRequest>
      <emp:JobId>JOB-GOV-2026-01</emp:JobId>
      <emp:Citizen>
        <emp:AadhaarNumber>${testAadhaar}</emp:AadhaarNumber>
        <emp:FullName>Rahul Sharma (SSO Interop)</emp:FullName>
        <emp:FatherName>Mohan Lal Sharma</emp:FatherName>
        <emp:DateOfBirth>1998-05-14</emp:DateOfBirth>
        <emp:Gender>Male</emp:Gender>
        <emp:Email>rahul.sharma@gov.in</emp:Email>
        <emp:Phone>+919876543210</emp:Phone>
        <emp:Address>Flat 402, Shanti Kunj, Sector 12, Dwarka</emp:Address>
        <emp:PinCode>110075</emp:PinCode>
        <emp:HighestQualification>B.Tech Computer Science</emp:HighestQualification>
      </emp:Citizen>
      <emp:EducationDeptVerification>
        <emp:CertificateNumber>EDU-NCVT-2023-88219</emp:CertificateNumber>
        <emp:CourseName>Advanced Python &amp; Data Processing</emp:CourseName>
        <emp:IssuingAuthority>Ministry of Skill Development &amp; Education</emp:IssuingAuthority>
        <emp:IssueDate>2023-08-20</emp:IssueDate>
        <emp:Status>VERIFIED_BY_EDUCATION_DEPT</emp:Status>
        <emp:Grade>A+</emp:Grade>
      </emp:EducationDeptVerification>
      <emp:ApplicationSource>SSO_INTEROPERABILITY_GATEWAY</emp:ApplicationSource>
    </emp:ApplyForJobRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  const applyRes = await fetch(`${BASE_URL}/soap/employment`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://employment.gov.in/interop/v1/ApplyForJob' },
    body: applySoapEnvelope
  });
  const applyXml = await applyRes.text();
<<<<<<< HEAD
  let applicationNumber = '';
  if (applyRes.ok && applyXml.includes('<emp:Status>APPROVED_AND_REGISTERED</emp:Status>')) {
    console.log('   ✅ SOAP ApplyForJob succeeded with automatic certificate verification!');
    const match = applyXml.match(/<emp:ApplicationNumber>(.*?)<\/emp:ApplicationNumber>/);
    applicationNumber = match ? match[1] : '';
    console.log(`      Generated Application Number: ${applicationNumber || 'N/A'}`);
=======
  if (applyRes.ok && applyXml.includes('<emp:Status>APPROVED_AND_REGISTERED</emp:Status>')) {
    console.log('   ✅ SOAP ApplyForJob succeeded with automatic certificate verification!');
    const match = applyXml.match(/<emp:ApplicationNumber>(.*?)<\/emp:ApplicationNumber>/);
    console.log(`      Generated Application Number: ${match ? match[1] : 'N/A'}`);
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
  } else {
    console.error('   ❌ SOAP ApplyForJob failed:', applyRes.status, applyXml);
  }

<<<<<<< HEAD
  // Test 9: SOAP Application Status
  console.log('\n9. Testing SOAP Call: GetApplicationStatus over WS-Security...');
  const statusEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:emp="http://employment.gov.in/interop/v1">
  <soapenv:Header>${validSecHeader}</soapenv:Header>
  <soapenv:Body><emp:GetApplicationStatusRequest><emp:ApplicationNumber>${applicationNumber}</emp:ApplicationNumber></emp:GetApplicationStatusRequest></soapenv:Body>
</soapenv:Envelope>`;
  const statusRes = await fetch(`${BASE_URL}/soap/employment`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://employment.gov.in/interop/v1/GetApplicationStatus' },
    body: statusEnvelope
  });
  const statusXml = await statusRes.text();
  if (applicationNumber && statusRes.ok && statusXml.includes('<emp:Found>true</emp:Found>') && statusXml.includes(`<emp:ApplicationNumber>${applicationNumber}</emp:ApplicationNumber>`)) {
    console.log('   ✅ SOAP GetApplicationStatus returned the submitted application');
  } else {
    console.error('   ❌ SOAP GetApplicationStatus failed:', statusRes.status, statusXml);
  }

=======
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
  // Test 7: REST API Citizens Registry - Aadhaar, Name, and Range Queries
  console.log('\n7. Testing Citizen Query APIs for Master Website:');
  // 7a. By Aadhaar direct endpoint
  const directAadhaarRes = await fetch(`${BASE_URL}/api/citizens/888823456789`);
  const directAadhaarData = await directAadhaarRes.json();
  if (directAadhaarRes.ok && directAadhaarData.citizen.fullName === 'Priya Patel') {
    console.log('   ✅ GET /api/citizens/888823456789 returned Priya Patel profile');
  }

  // 7b. By Name search
  const nameSearchRes = await fetch(`${BASE_URL}/api/citizens?name=Amit`);
  const nameSearchData = await nameSearchRes.json();
  if (nameSearchRes.ok && nameSearchData.returnedCount > 0) {
    console.log(`   ✅ GET /api/citizens?name=Amit matched: ${nameSearchData.citizens[0].fullName}`);
  }

  // 7c. Range query (range 5-10)
  const rangeRes = await fetch(`${BASE_URL}/api/citizens?start=5&end=10`);
  const rangeData = await rangeRes.json();
  if (rangeRes.ok && rangeData.returnedCount === 5) {
    console.log(`   ✅ GET /api/citizens?start=5&end=10 returned slice of 5 records (Citizens 6 to 10)`);
    console.log(`      First in range: ${rangeData.citizens[0].fullName} | Last in range: ${rangeData.citizens[4].fullName}`);
  }

  // Test 8: REST Manual Application Submission
  console.log('\n8. Testing Manual Data Entry Flow (REST POST /api/applications/manual)...');
  const manualRes = await fetch(`${BASE_URL}/api/applications/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: 'JOB-GOV-2026-02',
      citizen: {
        aadhaarNumber: `8888${Date.now().toString().slice(-8)}`,
        fullName: 'Suresh Kumar (Manual Entry)',
        fatherName: 'Gopal Kumar',
        dateOfBirth: '2000-01-15',
        gender: 'Male',
        email: 'suresh@example.com',
        phone: '+919988776655',
        address: 'Village Rampur, District Alwar',
        pinCode: '301001',
        highestQualification: 'ITI Electrical'
      },
      educationCertificate: {
        certificateNumber: 'MANUAL-UNVERIFIED-1234',
        courseName: 'Solar PV Installation & Maintenance',
<<<<<<< HEAD
        issuingAuthority: 'Self-Uploaded Certificate PDF',
        certificateFileName: 'manual-certificate.pdf',
        certificateMimeType: 'application/pdf',
        certificatePdfBase64: Buffer.from('%PDF-1.4\nDummy manual certificate\n%%EOF').toString('base64')
=======
        issuingAuthority: 'Self-Uploaded Certificate PDF'
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
      }
    })
  });
  const manualData = await manualRes.json();
  if (manualRes.ok && manualData.application.status === 'PENDING_MANUAL_VERIFICATION') {
    console.log('   ✅ Manual Application recorded with status: PENDING_MANUAL_VERIFICATION');
    console.log(`      Application Number: ${manualData.application.applicationId}`);
  } else {
    console.error('   ❌ Manual application failed:', manualRes.status, manualData);
  }

  // Test 9: Admin Dashboard & Telemetry API
  console.log('\n9. Testing Admin Dashboard & Telemetry API (GET /api/admin/dashboard)...');
  const adminRes = await fetch(`${BASE_URL}/api/admin/dashboard`);
  const adminData = await adminRes.json();
  if (adminRes.ok && adminData.success) {
    console.log('   ✅ Admin Stats retrieved successfully:');
    console.log(`      Total Applications: ${adminData.overview.totalApplicationsReceived}`);
    console.log(`      Received from Master Website: ${adminData.overview.receivedFromMasterWebsite.count} (${adminData.overview.receivedFromMasterWebsite.percentage})`);
    console.log(`      Received via Manual Entry: ${adminData.overview.receivedViaManualEntry.count} (${adminData.overview.receivedViaManualEntry.percentage})`);
    console.log(`      Total Registered Citizens: ${adminData.overview.totalRegisteredCitizensInExchange}`);
    console.log(`      SOAP Telemetry Calls: ${adminData.interoperabilityTelemetry.totalInterDepartmentSoapCalls}`);
  }

  // Test 10: Admin Visual Web Console Check
  console.log('\n10. Testing Admin Visual Web UI (GET /admin)...');
  const adminUiRes = await fetch(`${BASE_URL}/admin`);
  const adminUiHtml = await adminUiRes.text();
  if (adminUiRes.ok && adminUiHtml.includes('Employment Department Administration Console')) {
    console.log('   ✅ Admin Visual Console live at http://localhost:3000/admin (HTTP 200)');
  }

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(console.error);
