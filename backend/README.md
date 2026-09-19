# SOAP API Operations

<<<<<<< HEAD
## Run Locally or Across a LAN

Copy `backend/.env-example` to `backend/.env` and choose any free backend port. Copy `frontend/.env-example` to `frontend/.env` and choose any free frontend port plus the matching backend URL.

Start the backend in one terminal with `npm install` followed by `npm start`, then start the frontend in another terminal with `npm install` followed by `npm run dev`.

With the example values, open `http://localhost:5173` and verify the backend at `http://localhost:3000/api/jobs`. If you change the values, use those selected ports in the URLs.

When the frontend is opened from another laptop, set `VITE_API_TARGET=http://<BACKEND-LAN-IP>:<BACKEND-PORT>`. Use the backend laptop's LAN IP instead of `localhost`, and allow both selected ports through its firewall.

A `404` from `http://localhost:3000/api/jobs` means the backend process or route is not running on that machine. A `404` only from `http://localhost:5173/api/jobs` means the frontend proxy or frontend startup mode is wrong.

=======
>>>>>>> cd9cdf984cb5635a9c39228831ac99cd99639a60
The Employment Department exposes the following SOAP 1.1 operations through:

```text
POST http://localhost:3000/soap/employment
```

WSDL:

```text
http://localhost:3000/soap/employment?wsdl
```

All SOAP requests must include the required WS-Security `UsernameToken` in the SOAP header.

---

## 1. GetAvailableJobs

Retrieves employment opportunities matching the supplied filters.

### Request

Copy and send the following SOAP envelope:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:emp="http://employment.gov.in/interop/v1">

    <soapenv:Header>
        <!-- WS-Security UsernameToken -->
    </soapenv:Header>

    <soapenv:Body>
        <emp:GetAvailableJobsRequest>
            <emp:Category>Technology</emp:Category>
            <emp:Status>ACTIVE</emp:Status>
            <emp:AgeGreaterThan>18</emp:AgeGreaterThan>
            <emp:ExperienceLessThan>3</emp:ExperienceLessThan>
        </emp:GetAvailableJobsRequest>
    </soapenv:Body>

</soapenv:Envelope>
```

### Request Fields

| Field                | Required | Description                                                            |
| -------------------- | -------- | ---------------------------------------------------------------------- |
| `Category`           | No       | Job category                                                           |
| `Status`             | No       | Job status                                                             |
| `AgeGreaterThan`     | No       | Returns jobs where `MaxAge > value`                                    |
| `ExperienceLessThan` | No       | Returns jobs where required experience is less than the supplied value |

### Example Response

```xml
<soap:Envelope>
    <soap:Body>
        <GetAvailableJobsResponse>
            <TotalCount>2</TotalCount>

            <JobsList>
                <Job>
                    <JobId>JOB001</JobId>
                    <Title>Software Developer</Title>
                    <Category>Technology</Category>
                    <Department>State IT Department</Department>
                    <Status>ACTIVE</Status>
                    <RequiredExperienceYears>2</RequiredExperienceYears>
                    <MinAge>18</MinAge>
                    <MaxAge>30</MaxAge>
                </Job>

                <Job>
                    <JobId>JOB002</JobId>
                    <Title>Data Analyst</Title>
                    <Category>Technology</Category>
                    <Department>State Planning Department</Department>
                    <Status>ACTIVE</Status>
                    <RequiredExperienceYears>1</RequiredExperienceYears>
                    <MinAge>18</MinAge>
                    <MaxAge>28</MaxAge>
                </Job>
            </JobsList>
        </GetAvailableJobsResponse>
    </soap:Body>
</soap:Envelope>
```

---

# 2. CheckEligibility

Checks whether a citizen satisfies the eligibility requirements for a particular job.

### Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:emp="http://employment.gov.in/interop/v1">

    <soapenv:Header>
        <!-- WS-Security UsernameToken -->
    </soapenv:Header>

    <soapenv:Body>
        <emp:CheckEligibilityRequest>

            <emp:JobId>JOB001</emp:JobId>

            <emp:Citizen>
                <emp:AadhaarNumber>999988887777</emp:AadhaarNumber>
                <emp:Name>Rahul Kumar</emp:Name>
                <emp:DateOfBirth>2001-05-15</emp:DateOfBirth>
                <emp:Gender>MALE</emp:Gender>
                <emp:MobileNumber>9876543210</emp:MobileNumber>
                <emp:Email>rahul@example.com</emp:Email>
                <emp:Address>Hyderabad, Telangana</emp:Address>
            </emp:Citizen>

            <emp:EducationDeptVerification>
                <emp:Verified>true</emp:Verified>
                <emp:CertificateNumber>EDU-2026-00123</emp:CertificateNumber>
                <emp:Course>Full Stack Development</emp:Course>
                <emp:Grade>A</emp:Grade>
                <emp:IssuingAuthority>State Education Department</emp:IssuingAuthority>
            </emp:EducationDeptVerification>

        </emp:CheckEligibilityRequest>
    </soapenv:Body>

</soapenv:Envelope>
```

### Required Fields

| Field                       | Required |
| --------------------------- | -------- |
| `JobId`                     | Yes      |
| `Citizen`                   | Yes      |
| `EducationDeptVerification` | No       |

### Example Response

```xml
<soap:Envelope>
    <soap:Body>
        <CheckEligibilityResponse>
            <JobId>JOB001</JobId>
            <Eligible>true</Eligible>
            <CalculatedAge>25</CalculatedAge>
            <Remarks>Candidate satisfies all eligibility requirements.</Remarks>
        </CheckEligibilityResponse>
    </soap:Body>
</soap:Envelope>
```

---

# 3. ApplyForJob

Submits an employment application.

This operation can receive verified citizen information and Education Department verification data from an interoperating government system.

If a certificate PDF is supplied, the actual PDF must be Base64 encoded and placed in `CertificatePdfBase64`.

### Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:emp="http://employment.gov.in/interop/v1">

    <soapenv:Header>
        <!-- WS-Security UsernameToken -->
    </soapenv:Header>

    <soapenv:Body>
        <emp:ApplyForJobRequest>

            <emp:JobId>JOB001</emp:JobId>

            <emp:Citizen>
                <emp:AadhaarNumber>999988887777</emp:AadhaarNumber>
                <emp:Name>Rahul Kumar</emp:Name>
                <emp:DateOfBirth>2001-05-15</emp:DateOfBirth>
                <emp:Gender>MALE</emp:Gender>
                <emp:MobileNumber>9876543210</emp:MobileNumber>
                <emp:Email>rahul@example.com</emp:Email>
                <emp:Address>Hyderabad, Telangana</emp:Address>
            </emp:Citizen>

            <emp:EducationDeptVerification>
                <emp:Verified>true</emp:Verified>
                <emp:CertificateNumber>EDU-2026-00123</emp:CertificateNumber>
                <emp:Course>Full Stack Development</emp:Course>
                <emp:Grade>A</emp:Grade>
                <emp:IssuingAuthority>State Education Department</emp:IssuingAuthority>

                <emp:CertificatePdfBase64>
                    BASE64_ENCODED_PDF_CONTENT
                </emp:CertificatePdfBase64>

                <emp:CertificateFileName>
                    skill-certificate.pdf
                </emp:CertificateFileName>

                <emp:CertificateMimeType>
                    application/pdf
                </emp:CertificateMimeType>
            </emp:EducationDeptVerification>

            <emp:ApplicationSource>
                MASTER_WEBSITE
            </emp:ApplicationSource>

        </emp:ApplyForJobRequest>
    </soapenv:Body>

</soapenv:Envelope>
```

### Required Fields

| Field                       | Required |
| --------------------------- | -------- |
| `JobId`                     | Yes      |
| `Citizen`                   | Yes      |
| `EducationDeptVerification` | Yes      |
| `ApplicationSource`         | No       |
| `CertificatePdfBase64`      | No       |

### Important

`CertificatePdfBase64` must contain the Base64 representation of the **actual PDF file**.

The backend decodes the Base64 data, validates the PDF, stores the certificate under:

```text
uploads/certificates/
```

Maximum supported PDF size:

```text
4 MB
```

### Example Response

```xml
<soap:Envelope>
    <soap:Body>
        <ApplyForJobResponse>
            <ApplicationNumber>APP-2026-00001</ApplicationNumber>
            <Status>APPROVED_AND_REGISTERED</Status>
            <MaskedAadhaar>XXXX-XXXX-7777</MaskedAadhaar>
            <CertificateVerified>true</CertificateVerified>
            <CertificatePdfReceived>true</CertificatePdfReceived>
            <Timestamp>2026-09-19T10:30:00Z</Timestamp>
        </ApplyForJobResponse>
    </soap:Body>
</soap:Envelope>
```

---

# 4. GetApplicationStatus

Retrieves the current status of an employment application.

### Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:emp="http://employment.gov.in/interop/v1">

    <soapenv:Header>
        <!-- WS-Security UsernameToken -->
    </soapenv:Header>

    <soapenv:Body>
        <emp:GetApplicationStatusRequest>
            <emp:ApplicationNumber>
                APP-2026-00001
            </emp:ApplicationNumber>
        </emp:GetApplicationStatusRequest>
    </soapenv:Body>

</soapenv:Envelope>
```

### Example Response

```xml
<soap:Envelope>
    <soap:Body>
        <GetApplicationStatusResponse>
            <Found>true</Found>
            <ApplicationNumber>APP-2026-00001</ApplicationNumber>
            <Status>APPROVED_AND_REGISTERED</Status>
            <JobTitle>Software Developer</JobTitle>
            <CandidateName>Rahul Kumar</CandidateName>
            <SubmissionMode>SSO_INTEROPERABILITY</SubmissionMode>
            <SubmissionTime>2026-09-19T10:30:00Z</SubmissionTime>
        </GetApplicationStatusResponse>
    </soap:Body>
</soap:Envelope>
```

For an unknown application number:

```xml
<Found>false</Found>
<Status>NOT_FOUND</Status>
```

---

# 5. GetCitizenByAadhaar

Retrieves a registered citizen record using the Aadhaar number.

### Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:emp="http://employment.gov.in/interop/v1">

    <soapenv:Header>
        <!-- WS-Security UsernameToken -->
    </soapenv:Header>

    <soapenv:Body>
        <emp:GetCitizenByAadhaarRequest>
            <emp:AadhaarNumber>
                999988887777
            </emp:AadhaarNumber>
        </emp:GetCitizenByAadhaarRequest>
    </soapenv:Body>

</soapenv:Envelope>
```

### Example Response

```xml
<soap:Envelope>
    <soap:Body>
        <GetCitizenByAadhaarResponse>
            <Found>true</Found>

            <Citizen>
                <AadhaarNumber>XXXX-XXXX-7777</AadhaarNumber>
                <Name>Rahul Kumar</Name>
                <DateOfBirth>2001-05-15</DateOfBirth>
                <Gender>MALE</Gender>
                <MobileNumber>9876543210</MobileNumber>
                <Email>rahul@example.com</Email>
                <Address>Hyderabad, Telangana</Address>
            </Citizen>

            <SkillCertificate>
                <CertificateNumber>EDU-2026-00123</CertificateNumber>
                <Course>Full Stack Development</Course>
                <Grade>A</Grade>
                <Status>VERIFIED</Status>
            </SkillCertificate>

        </GetCitizenByAadhaarResponse>
    </soap:Body>
</soap:Envelope>
```

---

# WS-Security Header

Every protected SOAP operation requires an OASIS WS-Security `UsernameToken`.

The following header can be inserted into the `<soapenv:Header>` of the requests above:

```xml
<soapenv:Header>
    <wsse:Security
        soapenv:mustUnderstand="1"
        xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
        xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">

        <wsse:UsernameToken>
            <wsse:Username>
                INTEROP_GATEWAY_SERVICE
            </wsse:Username>

            <wsse:Password
                Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">
                GovInterop@Secret#2026
            </wsse:Password>

            <wsse:Nonce>
                BASE64_NONCE
            </wsse:Nonce>

            <wsu:Created>
                2026-09-19T10:30:00Z
            </wsu:Created>
        </wsse:UsernameToken>

    </wsse:Security>
</soapenv:Header>
```

> **Note:** The credentials above are demonstration credentials for the local SIH prototype. Production deployments must use environment variables or a secure secret-management system.

---

# cURL Example

For example, `GetAvailableJobs` can be called using:

```bash
curl -X POST "http://localhost:3000/soap/employment" \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H 'SOAPAction: "GetAvailableJobs"' \
  --data-binary @get-available-jobs.xml
```

Where `get-available-jobs.xml` contains the complete SOAP envelope shown above.

---

# SOAP Error Handling

Invalid or missing WS-Security credentials result in a SOAP Fault.

Example:

```xml
<soap:Fault>
    <faultcode>soap:Client</faultcode>
    <faultstring>Unauthorized: Invalid WS-Security credentials</faultstring>
</soap:Fault>
```

Other validation errors, unknown operations, malformed requests, and invalid business data are returned as SOAP faults with an appropriate HTTP status.
