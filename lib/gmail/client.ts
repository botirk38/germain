import { google } from "googleapis";

export function createGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });

  return google.gmail({ version: "v1", auth });
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
}

export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults = 10
): Promise<ParsedEmail[]> {
  const gmail = createGmailClient(accessToken);

  const listResult = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  const messageIds = listResult.data.messages ?? [];
  if (messageIds.length === 0) return [];

  const emails: ParsedEmail[] = [];

  for (const msg of messageIds) {
    if (!msg.id) continue;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date"],
    });

    const headers = detail.data.payload?.headers ?? [];
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
    const from = headers.find((h) => h.name === "From")?.value ?? "";
    const date = headers.find((h) => h.name === "Date")?.value ?? "";

    emails.push({
      id: msg.id,
      threadId: detail.data.threadId ?? "",
      subject,
      from,
      date,
      snippet: detail.data.snippet ?? "",
      body: detail.data.snippet ?? "",
    });
  }

  return emails;
}
