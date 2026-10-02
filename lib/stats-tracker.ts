import { getBucketsCount, resetRateLimitBuckets } from "./request-guards";

type StatsData = {
  environment: string;
  isLocalhost: boolean;
  serverHost: string;
  geminiApiKeyConfigured: boolean;
  geminiModel: string;
  totalCredits: number;
  creditsUsed: number;
  creditsRemaining: number;
  totalSessionsRequested: number;
  totalKnowledgeQueries: number;
  perMinuteLimitPerIp: number;
  perHourLimitPerIp: number;
  activeRateLimitBuckets: number;
  clientIp: string;
  uptimeSeconds: number;
};

const startTime = Date.now();
let totalSessionsRequested = 0;
let creditsUsed = 0;
let totalKnowledgeQueries = 0;

export function recordSessionRequest() {
  totalSessionsRequested += 1;
}

export function recordSessionGranted() {
  creditsUsed += 1;
}

export function recordKnowledgeQuery() {
  totalKnowledgeQueries += 1;
}

export function resetCredits() {
  creditsUsed = 0;
}

export function getTotalCredits(): number {
  const envLimit = process.env.DEMO_CREDIT_LIMIT;
  if (envLimit && !isNaN(Number(envLimit))) {
    return Number(envLimit);
  }
  return 100;
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "admin123";
}

export function verifyAdminPassword(input: string): boolean {
  if (typeof input !== "string") return false;
  return input.trim() === getAdminPassword();
}

export function getAdminStats(request: Request): StatsData {
  const totalCredits = getTotalCredits();
  const creditsRemaining = Math.max(0, totalCredits - creditsUsed);
  const host = request.headers.get("host") || "localhost:3000";
  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("0.0.0.0") ||
    process.env.NODE_ENV !== "production";

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1";

  return {
    environment: process.env.NODE_ENV || "development",
    isLocalhost,
    serverHost: host,
    geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    geminiModel: process.env.GEMINI_LIVE_MODEL?.trim() || "gemini-3.8-live",
    totalCredits,
    creditsUsed,
    creditsRemaining,
    totalSessionsRequested,
    totalKnowledgeQueries,
    perMinuteLimitPerIp: 8,
    perHourLimitPerIp: 32,
    activeRateLimitBuckets: getBucketsCount(),
    clientIp,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
  };
}
