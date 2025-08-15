import { NextResponse } from "next/server";

const API_URL = "https://ocs-api.esimvault.cloud/v1";
const OCS_TOKEN = process.env.OCS_TOKEN;
const DEFAULT_ACCOUNT = Number(process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT || 3771);

async function callOCS(body) {
  const r = await fetch(`${API_URL}?token=${OCS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`OCS ${r.status}: ${text.slice(0,300)}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export async function GET() {
  if (!OCS_TOKEN) {
    return NextResponse.json({ error: "Missing OCS_TOKEN (server env var)" }, { status: 500 });
  }

  // try several payload shapes that different OCS variants use
  const acct = DEFAULT_ACCOUNT;
  const attempts = [
    { listSubscriber:  { accountId: acct, limit: 200, offset: 0 } },
    { listSubscriber:  { accountid:  acct, limit: 200, offset: 0 } },
    { listSubscribers: { accountId: acct, limit: 200, offset: 0 } },
    { listSubscribers: { accountid:  acct, limit: 200, offset: 0 } }
  ];

  let lastErr = null;
  for (const body of attempts) {
    try {
      const data = await callOCS(body);
      const subs = data?.result?.subscribers || [];
      if (Array.isArray(subs) && subs.length >= 0) {
        // return whatever OCS gave us so we can see it in the browser
        return NextResponse.json({ tried: body, data });
      }
    } catch (e) {
      lastErr = String(e);
    }
  }

  return NextResponse.json({ error: lastErr || "No data", triedAll: true }, { status: 500 });
}
