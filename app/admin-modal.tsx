"use client";

import React, { useEffect, useState } from "react";

export type AdminStats = {
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

type AdminModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Every time the modal opens, reset authentication so it asks for password every time.
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setIsAuthenticated(false);
      setError("");
      setStats(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchStats = async (pwd: string, action: "get" | "reset_limits" | "reset_credits" = "get") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ password: pwd, action }),
      });

      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setError(data.error || "Invalid password");
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        setStats(data.stats);
        setError("");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter password");
      return;
    }
    void fetchStats(password);
  };

  const handleClose = () => {
    setPassword("");
    setIsAuthenticated(false);
    setStats(null);
    setError("");
    onClose();
  };

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) return `${mins}m ${secs}s`;
    return `${hrs}h ${remainingMins}m ${secs}s`;
  };

  return (
    <div
      className="admin-modal-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-title"
    >
      <div
        className="admin-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="admin-modal-title-group">
            <span className="admin-badge">SECRET ADMIN</span>
            <h2 id="admin-title" className="admin-modal-title">
              Raqmiva System Dashboard
            </h2>
          </div>
          <button
            type="button"
            className="admin-close-btn"
            onClick={handleClose}
            aria-label="Close Admin Modal"
          >
            ✕
          </button>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleLoginSubmit} className="admin-login-form">
            <p className="admin-login-desc">
              Please enter the admin password to access live credit limits, server stats, and localhost data.
            </p>

            <div className="admin-input-group">
              <label htmlFor="admin-password">Admin Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && <div className="admin-error-msg">{error}</div>}

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Unlock Dashboard"}
            </button>
          </form>
        ) : (
          <div className="admin-dashboard">
            {stats && (
              <>
                <div className="admin-status-banner">
                  <div className="admin-host-info">
                    <span className="admin-dot-online" />
                    <strong>Host:</strong> {stats.serverHost}
                    {stats.isLocalhost && <span className="admin-chip">Localhost</span>}
                  </div>
                  <div className="admin-uptime">
                    <strong>Uptime:</strong> {formatUptime(stats.uptimeSeconds)}
                  </div>
                </div>

                <div className="admin-grid">
                  {/* Credits & Usage Card */}
                  <div className="admin-card admin-card--highlight">
                    <h3 className="admin-card-title">Credit Limits & Usage</h3>
                    <div className="admin-metric-main">
                      <span className="admin-metric-value">{stats.creditsRemaining}</span>
                      <span className="admin-metric-label">Remaining Credits</span>
                    </div>
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            (stats.creditsUsed / Math.max(1, stats.totalCredits)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="admin-stats-row">
                      <span>Total Credit Limit: <strong>{stats.totalCredits}</strong></span>
                      <span>Credits Used: <strong>{stats.creditsUsed}</strong></span>
                    </div>
                  </div>

                  {/* Rate Limits Card */}
                  <div className="admin-card">
                    <h3 className="admin-card-title">Rate Limits (Per IP)</h3>
                    <ul className="admin-list">
                      <li>
                        <span>Client IP:</span>
                        <code>{stats.clientIp}</code>
                      </li>
                      <li>
                        <span>Minute Limit:</span>
                        <strong>{stats.perMinuteLimitPerIp} requests / min</strong>
                      </li>
                      <li>
                        <span>Hourly Limit:</span>
                        <strong>{stats.perHourLimitPerIp} requests / hr</strong>
                      </li>
                      <li>
                        <span>Active IP Rate Limit Buckets:</span>
                        <strong>{stats.activeRateLimitBuckets} entries</strong>
                      </li>
                    </ul>
                  </div>

                  {/* System & API Status */}
                  <div className="admin-card">
                    <h3 className="admin-card-title">Server & AI Config</h3>
                    <ul className="admin-list">
                      <li>
                        <span>Environment:</span>
                        <code className="admin-code">{stats.environment}</code>
                      </li>
                      <li>
                        <span>Gemini API Key:</span>
                        {stats.geminiApiKeyConfigured ? (
                          <span className="admin-status-ok">Configured</span>
                        ) : (
                          <span className="admin-status-err">Missing</span>
                        )}
                      </li>
                      <li>
                        <span>Live Model:</span>
                        <code className="admin-code">{stats.geminiModel}</code>
                      </li>
                      <li>
                        <span>Total Sessions Requested:</span>
                        <strong>{stats.totalSessionsRequested}</strong>
                      </li>
                      <li>
                        <span>Total Knowledge Searches:</span>
                        <strong>{stats.totalKnowledgeQueries}</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="admin-actions-bar">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => void fetchStats(password, "get")}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => void fetchStats(password, "reset_limits")}
                    disabled={loading}
                  >
                    Clear Rate Limits
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => void fetchStats(password, "reset_credits")}
                    disabled={loading}
                  >
                    Reset Credits Counter
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
