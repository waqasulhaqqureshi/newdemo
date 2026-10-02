import { isSameOriginRequest, NO_STORE_HEADERS, resetRateLimitBuckets } from "@/lib/request-guards";
import { getAdminStats, resetCredits, verifyAdminPassword } from "@/lib/stats-tracker";

export const runtime = "nodejs";

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return Response.json(data, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: "Unauthorized access" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "JSON payload required" }, 400);
  }

  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const password = typeof payload.password === "string" ? payload.password : "";
  const action = typeof payload.action === "string" ? payload.action : "get";

  if (!verifyAdminPassword(password)) {
    return jsonResponse({ error: "Incorrect admin password" }, 401);
  }

  if (action === "reset_limits") {
    resetRateLimitBuckets();
  } else if (action === "reset_credits") {
    resetCredits();
  }

  const stats = getAdminStats(request);

  return jsonResponse({
    authenticated: true,
    stats,
  });
}
