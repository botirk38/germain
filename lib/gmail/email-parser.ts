import type { ParsedEmail } from "./client";

// Embassy / VAC sender domains to monitor
const EMBASSY_DOMAINS = [
  "embassy", "consulate", "vac", "visa", "vfs", "tls",
  "gov", "mfa", "auswaertiges-amt",
];

// Email classification categories
type EmailCategory = "rfe" | "appointment" | "decision" | "biometrics" | "status_update" | "unknown";

interface ClassifiedEmail extends ParsedEmail {
  category: EmailCategory;
  referenceFound: string | undefined;
}

// Common reference number patterns
const REF_PATTERNS = [
  /\b[A-Z]{2,4}[-/]\d{4,}[-/]?\d{0,6}\b/,
  /\bref(?:erence)?[:\s#]+([A-Z0-9-]+)/i,
  /\bapplication[:\s#]+([A-Z0-9-]+)/i,
  /\b\d{10,14}\b/,
];

function extractReference(text: string): string | undefined {
  for (const pattern of REF_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1] ?? match[0];
  }
  return undefined;
}

function classifyEmail(email: ParsedEmail): EmailCategory {
  const combined = `${email.subject} ${email.snippet}`.toLowerCase();

  // RFE detection
  if (
    combined.includes("request for evidence") ||
    combined.includes("additional document") ||
    combined.includes("missing document") ||
    combined.includes("provide the following") ||
    combined.includes("rfe")
  ) {
    return "rfe";
  }

  // Decision detection
  if (
    combined.includes("decision") ||
    combined.includes("visa approved") ||
    combined.includes("visa refused") ||
    combined.includes("visa granted") ||
    combined.includes("collect your passport")
  ) {
    return "decision";
  }

  // Appointment / biometrics
  if (
    combined.includes("biometric") ||
    combined.includes("fingerprint")
  ) {
    return "biometrics";
  }

  if (
    combined.includes("appointment") ||
    combined.includes("slot") ||
    combined.includes("booking confirmation")
  ) {
    return "appointment";
  }

  // Status update
  if (
    combined.includes("status update") ||
    combined.includes("processing") ||
    combined.includes("under review") ||
    combined.includes("application received")
  ) {
    return "status_update";
  }

  return "unknown";
}

function isEmbassyEmail(email: ParsedEmail): boolean {
  const fromLower = email.from.toLowerCase();
  return EMBASSY_DOMAINS.some((domain) => fromLower.includes(domain));
}

export function classifyEmails(
  emails: ParsedEmail[],
  referenceNumber?: string
): ClassifiedEmail[] {
  return emails
    .filter(isEmbassyEmail)
    .map((email) => {
      const category = classifyEmail(email);
      const refFound = extractReference(`${email.subject} ${email.snippet}`);

      // If we have a reference number, only include matching emails
      if (referenceNumber && refFound && refFound !== referenceNumber) {
        return null;
      }

      return {
        ...email,
        category,
        referenceFound: refFound,
      };
    })
    .filter((e): e is ClassifiedEmail => e !== null);
}

export function buildGmailQuery(referenceNumber: string): string {
  const domainQueries = EMBASSY_DOMAINS
    .map((d) => `from:*${d}*`)
    .join(" OR ");
  return `(${domainQueries}) ${referenceNumber}`;
}
