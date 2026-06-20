import { BrowserUse } from "browser-use-sdk";

let _client: BrowserUse | undefined;

export function getBrowserUseClient(): BrowserUse {
  if (!_client) {
    const apiKey = process.env.BROWSER_USE_API_KEY;
    if (!apiKey) {
      throw new Error("BROWSER_USE_API_KEY environment variable is not set");
    }
    _client = new BrowserUse({ apiKey });
  }
  return _client;
}
