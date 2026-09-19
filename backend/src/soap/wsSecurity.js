/**
 * WS-Security (OASIS Web Services Security 1.0)
 * Handles parsing, extracting, and validating WS-Security UsernameToken credentials.
 */

// Permitted Service Identities for the Interoperability Framework
const AUTHORIZED_CLIENTS = new Map([
  [
    process.env.WSSE_USERNAME || 'INTEROP_GATEWAY_SERVICE',
    process.env.WSSE_PASSWORD || 'GovInterop@Secret#2026'
  ],
  ['MASTER_SSO_PORTAL', 'GovMaster@SSO#2026'],
  ['SIH_EGOV_INTEROP_HUB', 'GovInterop@Secret#2026']
]);

/**
 * Extract a single tag's text content from XML string using robust regex (ignoring namespaces)
 */
export function extractTagContent(xml, tagName) {
  if (!xml) return null;
  // Match e.g. <wsse:Username ...>val</wsse:Username> or <Username>val</Username>
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Validates WS-Security header from a SOAP XML envelope string.
 */
export function validateWSSecurity(xmlContent) {
  if (!xmlContent || typeof xmlContent !== 'string') {
    return {
      isValid: false,
      faultCode: 'wsse:InvalidSecurity',
      faultString: 'Empty or malformed SOAP envelope received.'
    };
  }

  // Check if Header exists
  const headerMatch = xmlContent.match(/<(?:[a-zA-Z0-9_]+:)?Header(?:\s+[^>]*)?>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?Header>/i);
  if (!headerMatch) {
    return {
      isValid: false,
      faultCode: 'wsse:SecurityHeaderMissing',
      faultString: 'Missing required SOAP:Header with OASIS wsse:Security credentials.'
    };
  }

  const headerContent = headerMatch[1];

  // Check if Security block exists
  const securityMatch = headerContent.match(/<(?:[a-zA-Z0-9_]+:)?Security(?:\s+[^>]*)?>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?Security>/i);
  if (!securityMatch) {
    return {
      isValid: false,
      faultCode: 'wsse:SecurityHeaderMissing',
      faultString: 'OASIS wsse:Security element not found in SOAP Header.'
    };
  }

  const securityContent = securityMatch[1];

  // Extract UsernameToken
  const username = extractTagContent(securityContent, 'Username');
  const password = extractTagContent(securityContent, 'Password');
  const nonce = extractTagContent(securityContent, 'Nonce');
  const created = extractTagContent(securityContent, 'Created');

  if (!username || !password) {
    return {
      isValid: false,
      faultCode: 'wsse:FailedAuthentication',
      faultString: 'Missing Username or Password in wsse:UsernameToken.'
    };
  }

  const expectedPassword = AUTHORIZED_CLIENTS.get(username);
  if (!expectedPassword || expectedPassword !== password) {
    return {
      isValid: false,
      faultCode: 'wsse:FailedAuthentication',
      faultString: `Authentication failed for service principal '${username}'. Invalid credentials or unauthorized department gateway.`
    };
  }

  return {
    isValid: true,
    username,
    nonce: nonce || 'N/A',
    created: created || new Date().toISOString(),
    authMethod: 'UsernameToken Profile 1.0 (PasswordText)',
    authorizedAt: new Date().toISOString()
  };
}

export function buildWSSecurityHeader(username = 'INTEROP_GATEWAY_SERVICE', password = 'GovInterop@Secret#2026') {
  const nonce = Buffer.from(Math.random().toString()).toString('base64');
  const created = new Date().toISOString();

  return `
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                   xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
                   soapenv:mustUnderstand="1">
      <wsse:UsernameToken wsu:Id="UsernameToken-Interop-1">
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
        <wsu:Created>${created}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>`;
}
