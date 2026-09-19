import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, '../data');
const certificatesDirectory = path.join(__dirname, '../../uploads/certificates');

const names = [
  ['Rahul Sharma', 'Mohan Sharma', 'Male', 'Delhi'],
  ['Priya Patel', 'Dinesh Patel', 'Female', 'Gujarat'],
  ['Amit Verma', 'Rajendra Verma', 'Male', 'Uttar Pradesh'],
  ['Sneha Iyer', 'Ramesh Iyer', 'Female', 'Maharashtra'],
  ['Arjun Nair', 'Suresh Nair', 'Male', 'Kerala'],
  ['Kavya Reddy', 'Venkatesh Reddy', 'Female', 'Telangana'],
  ['Rohan Singh', 'Harbhajan Singh', 'Male', 'Punjab'],
  ['Ananya Das', 'Subhash Das', 'Female', 'West Bengal'],
  ['Vivek Joshi', 'Mahesh Joshi', 'Male', 'Rajasthan'],
  ['Meera Kulkarni', 'Prakash Kulkarni', 'Female', 'Maharashtra'],
  ['Aditya Rao', 'Madhav Rao', 'Male', 'Karnataka'],
  ['Nisha Kapoor', 'Amit Kapoor', 'Female', 'Haryana'],
  ['Sanjay Yadav', 'Ramesh Yadav', 'Male', 'Bihar'],
  ['Pooja Mehta', 'Nitin Mehta', 'Female', 'Madhya Pradesh'],
  ['Karan Gupta', 'Rajiv Gupta', 'Male', 'Delhi'],
  ['Divya Menon', 'Krishnan Menon', 'Female', 'Kerala'],
  ['Manish Thakur', 'Vijay Thakur', 'Male', 'Himachal Pradesh'],
  ['Ishita Roy', 'Sanjay Roy', 'Female', 'West Bengal'],
  ['Naveen Pillai', 'Mohan Pillai', 'Male', 'Tamil Nadu'],
  ['Ritu Singh', 'Ajay Singh', 'Female', 'Uttar Pradesh'],
  ['Harish Babu', 'Ravi Babu', 'Male', 'Andhra Pradesh'],
  ['Simran Kaur', 'Balwinder Kaur', 'Female', 'Punjab'],
  ['Deepak Jain', 'Suresh Jain', 'Male', 'Rajasthan'],
  ['Ayesha Khan', 'Imran Khan', 'Female', 'Maharashtra'],
  ['Vikram Desai', 'Ramesh Desai', 'Male', 'Gujarat'],
  ['Neha Choudhary', 'Sunil Choudhary', 'Female', 'Haryana'],
  ['Siddharth Bose', 'Anil Bose', 'Male', 'West Bengal'],
  ['Lakshmi Prasad', 'Raghav Prasad', 'Female', 'Odisha'],
  ['Gaurav Mishra', 'Dinesh Mishra', 'Male', 'Uttar Pradesh'],
  ['Tanvi Shah', 'Ketan Shah', 'Female', 'Gujarat']
];

const jobTemplates = [
  ['District Data Operations Officer', 'Technology & Administrative', 'Department of Employment & e-Governance', 'B.Tech Computer Science or equivalent', 'Advanced Python & Data Processing'],
  ['Solar Energy Technical Associate', 'Technical & Renewable Energy', 'Renewable Energy & Employment Mission', 'Diploma in Electrical Engineering', 'Solar PV Installation & Maintenance'],
  ['Public Healthcare Digital Coordinator', 'Healthcare Support', 'Health & Family Welfare Mission', 'Higher Secondary with Science', 'Healthcare Informatics & Digital Health'],
  ['Gram Panchayat Digital Assistant', 'Rural e-Services', 'Panchayati Raj & Rural Employment Bureau', 'Higher Secondary in any discipline', 'Financial Accounting & e-Governance'],
  ['Employment Exchange Data Analyst', 'Data & Analytics', 'State Employment Directorate', 'Bachelor Degree in Statistics or IT', 'Data Analytics & Visualization'],
  ['Water Resources Survey Assistant', 'Environment & Infrastructure', 'Water Resources Department', 'Diploma in Civil Engineering', 'GIS Survey & Water Mapping'],
  ['Public Works Junior Engineer', 'Infrastructure', 'Public Works Department', 'Diploma in Civil Engineering', 'Construction Safety & Quality'],
  ['Agriculture Extension Coordinator', 'Agriculture & Rural Development', 'Department of Agriculture', 'B.Sc Agriculture or equivalent', 'Sustainable Agriculture Practices'],
  ['Forest Conservation Field Officer', 'Environment & Forestry', 'Forest Department', 'Bachelor Degree in Environmental Science', 'Biodiversity Conservation'],
  ['Municipal Revenue Assistant', 'Urban Administration', 'Urban Development Department', 'Bachelor Degree in Commerce', 'Digital Records & Tax Administration']
];

const writeJson = (fileName, value) => {
  fs.writeFileSync(path.join(dataDirectory, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const maskedAadhaar = (aadhaar) => `XXXX-XXXX-${aadhaar.slice(-4)}`;

const citizens = names.map(([fullName, fatherName, gender, state], index) => {
  const sequence = String(index + 1).padStart(2, '0');
  const aadhaar = `90000000${String(index + 1).padStart(4, '0')}`;
  const skill = jobTemplates[index % jobTemplates.length][4];
  const year = 1994 + (index % 9);
  return {
    id: `REG-EMP-${String(index + 1).padStart(3, '0')}`,
    aadhaarNumber: aadhaar,
    maskedAadhaar: maskedAadhaar(aadhaar),
    registrationNumber: `EMP-${state.slice(0, 2).toUpperCase()}-2026-${String(1000 + index).slice(-4)}`,
    registrationDate: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
    fullName,
    fatherName,
    dateOfBirth: `${year}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    gender,
    category: ['General', 'OBC', 'SC', 'ST'][index % 4],
    email: `${fullName.toLowerCase().replace(/ /g, '.')}@dummy.gov.in`,
    phone: `+91990000${String(index + 1).padStart(4, '0')}`,
    address: `${index + 10}, Government Colony, Sector ${index + 1}`,
    district: `${state} District`,
    state,
    pinCode: `400${String(100 + index)}`,
    highestQualification: jobTemplates[index % jobTemplates.length][3],
    institution: `Government Institute of ${state}`,
    passingYear: 2018 + (index % 8),
    skills: [skill, 'Digital Services', 'MS Office'],
    employmentStatus: index % 5 === 0 ? 'Active Jobseeker (Seeking Apprenticeship)' : 'Active Jobseeker (Unemployed)',
    educationCertificate: {
      certificateNumber: `EDU-DUMMY-2026-${String(index + 1).padStart(4, '0')}`,
      courseName: skill,
      issuingAuthority: 'State Skill Development Board',
      issueDate: `2025-${String((index % 12) + 1).padStart(2, '0')}-15`,
      status: 'VERIFIED_BY_EDUCATION_DEPT',
      grade: ['A+', 'A', 'B+'][index % 3],
      verifiedHash: `sha256-dummy-${sequence}-${String(index * 7919).padStart(8, '0')}`
    }
  };
});

const jobs = Array.from({ length: 30 }, (_, index) => {
  const sequence = index + 1;
  const template = jobTemplates[index % jobTemplates.length];
  const minAge = 18 + (index % 5);
  return {
    id: `JOB-GOV-2026-${String(sequence).padStart(2, '0')}`,
    title: `${template[0]} ${sequence > 10 ? `- Zone ${((index - 10) % 5) + 1}` : ''}`.trim(),
    department: template[2],
    category: template[1],
    vacancies: 25 + (index * 7) % 180,
    location: `${['Statewide', 'Regional', 'District'][index % 3]} Government Offices`,
    payScale: `INR ${21700 + (index % 5) * 2500} - ${69100 + (index % 5) * 6200} (Level ${3 + (index % 5)})`,
    description: `Support public service delivery, citizen records, departmental coordination, and employment program operations in assigned government offices.`,
    experienceRequiredYears: index % 4,
    eligibility: {
      minAge,
      maxAge: 30 + (index % 9),
      minEducation: template[3],
      mandatorySkillCertificate: {
        required: true,
        name: template[4],
        category: template[1],
        issuingAuthority: 'State Skill Development Board'
      },
      aadhaarRequired: true
    },
    postedDate: `2026-09-${String((index % 20) + 1).padStart(2, '0')}`,
    deadline: `2026-${index % 2 === 0 ? '11' : '12'}-${String((index % 25) + 1).padStart(2, '0')}`,
    status: 'ACTIVE'
  };
});

const applications = Array.from({ length: 40 }, (_, index) => {
  const citizen = citizens[index % citizens.length];
  const job = jobs[index % jobs.length];
  const isSso = index % 2 === 1;
  const status = isSso ? 'APPROVED_AND_REGISTERED' : index % 4 === 0 ? 'UNDER_REVIEW' : 'PENDING_MANUAL_VERIFICATION';
  return {
    applicationId: `${isSso ? 'EMP-SSO' : 'EMP-MANUAL'}-DUMMY-${String(index + 1).padStart(3, '0')}`,
    jobId: job.id,
    jobTitle: job.title,
    submissionMode: isSso ? 'SSO_INTEROPERABILITY_GATEWAY' : 'MANUAL_ENTRY',
    ...(isSso ? { sourceChannel: 'MASTER_WEBSITE_SOAP_WS_SECURITY' } : {}),
    status,
    appliedAt: `2026-09-${String((index % 19) + 1).padStart(2, '0')}T${String(9 + (index % 9)).padStart(2, '0')}:00:00.000Z`,
    citizen: {
      aadhaarNumber: citizen.aadhaarNumber,
      maskedAadhaar: citizen.maskedAadhaar,
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
      certificateNumber: citizen.educationCertificate.certificateNumber,
      courseName: citizen.educationCertificate.courseName,
      issuingAuthority: citizen.educationCertificate.issuingAuthority,
      issueDate: citizen.educationCertificate.issueDate,
      grade: citizen.educationCertificate.grade,
      ...(isSso ? { certificateFileName: 'not-uploaded-dummy.pdf', certificateMimeType: 'application/pdf' } : {}),
      isVerifiedBySourceDept: isSso,
      verificationNote: isSso
        ? 'Dummy application approved through SSO interoperability data synchronization.'
        : 'Dummy manual application requires physical verification and document scrutiny.'
    },
    interopAudit: isSso ? {
      protocol: 'SOAP 1.1 with OASIS WS-Security',
      authenticatedServiceUser: 'INTEROP_GATEWAY_SERVICE',
      wsseTokenTimestamp: `2026-09-${String((index % 19) + 1).padStart(2, '0')}T${String(9 + (index % 9)).padStart(2, '0')}:00:00.000Z`,
      applicationSource: 'SSO_INTEROPERABILITY_GATEWAY',
      sourceChannel: 'Master Website Gateway',
      instantEligibilityVerified: true
    } : null
  };
});

const logs = Array.from({ length: 20 }, (_, index) => ({
  id: `LOG-DUMMY-${String(index + 1).padStart(3, '0')}`,
  timestamp: `2026-09-${String((index % 19) + 1).padStart(2, '0')}T${String(10 + (index % 8)).padStart(2, '0')}:15:00.000Z`,
  operation: ['GetAvailableJobs', 'GetCitizenByAadhaar', 'ApplyForJob', 'CheckEligibility'][index % 4],
  protocol: 'SOAP 1.1 + OASIS WS-Security',
  authStatus: index % 7 === 0 ? 'FAILED' : 'AUTHORIZED',
  ...(index % 7 === 0 ? { authError: 'Dummy security validation failure for monitoring demonstration.' } : { authenticatedUser: 'INTEROP_GATEWAY_SERVICE' }),
  httpStatus: index % 7 === 0 ? 401 : 200,
  rawRequestSnippet: '<soapenv:Envelope><!-- dummy audit request --></soapenv:Envelope>',
  rawResponseSnippet: index % 7 === 0 ? '<soapenv:Fault><!-- dummy unauthorized request --></soapenv:Fault>' : '<soapenv:Envelope><!-- dummy successful response --></soapenv:Envelope>',
  latencyMs: 2 + (index % 9)
}));

fs.mkdirSync(dataDirectory, { recursive: true });
fs.rmSync(certificatesDirectory, { recursive: true, force: true });
fs.mkdirSync(certificatesDirectory, { recursive: true });
writeJson('jobs.json', jobs);
writeJson('registered-citizens.json', citizens);
writeJson('mock-citizens.json', citizens);
writeJson('applications.json', applications);
writeJson('interop-logs.json', logs);

console.log(JSON.stringify({ jobs: jobs.length, citizens: citizens.length, applications: applications.length, logs: logs.length }, null, 2));