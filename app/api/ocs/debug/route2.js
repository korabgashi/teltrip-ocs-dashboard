import { NextResponse } from "next/server";

const API_URL = "https://ocs-api.esimvault.cloud/v1";
const OCS_TOKEN = process.env.OCS_TOKEN;
const ALLOWED = (process.env.OCS_ALLOWED_ACCOUNTS || "3771")
  .split(",").map(a => Number(a.trim())).filter(Boolean);

export async function GET() {
  const out = {
    hasToken: Boolean(OCS_TOKEN),   // true/false (does not reveal the token)
    allowedAccounts: ALLOWED
  };

  if (OCS_TOKEN) {
    try {
      const r = await fetch(`${API_URL}?token=${OCS_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ping: true }),
        cache: "no-store"
      });
      out.ocsHTTP = r.status;
      out.ocsText = (await r.text()).slice(0, 200);
    } catch (e) {
      out.ocsError = String(e);
    }
  }

  return NextResponse.json(out);
}
