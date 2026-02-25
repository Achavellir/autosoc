import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://localhost:8000/api/v1";
const CLIENT_ID = "demo-client-001";

// ─── Design System ───────────────────────────────────────────
const colors = {
  bg: "#050B14",
  surface: "#0A1628",
  border: "#0F2544",
  accent: "#00D4FF",
  accentDim: "#0099BB",
  critical: "#FF3B30",
  high: "#FF9F0A",
  medium: "#FFD60A",
  low: "#30D158",
  text: "#E8F4FD",
  textDim: "#6B8CAE",
  grid: "#0D1F3A",
};

const SEVERITY_COLORS = {
  critical: colors.critical,
  high: colors.high,
  medium: colors.medium,
  low: colors.low,
  info: colors.textDim,
};

// ─── Mock Data (Simulates API responses) ─────────────────────
const MOCK_OVERVIEW = {
  risk_score: 24,
  risk_level: "low",
  summary: {
    total_events_today: 2847,
    threats_detected_today: 3,
    threats_auto_blocked: 2,
    endpoints_monitored: 47,
    uptime_percent: 99.9,
  },
  compliance: { hipaa: "compliant", soc2: "compliant", pci_dss: "action_needed" },
  daily_trend: [
    { date: "Mon", events: 2100, threats: 2, blocked: 2 },
    { date: "Tue", events: 1850, threats: 0, blocked: 0 },
    { date: "Wed", events: 2400, threats: 5, blocked: 4 },
    { date: "Thu", events: 1920, threats: 1, blocked: 1 },
    { date: "Fri", events: 2780, threats: 3, blocked: 2 },
    { date: "Sat", events: 980, threats: 0, blocked: 0 },
    { date: "Sun", events: 1240, threats: 1, blocked: 1 },
  ],
  recent_alerts: [
    { id: "a1", time: "2 min ago", type: "Brute Force Attack", severity: "critical", source_ip: "185.220.101.45", status: "blocked" },
    { id: "a2", time: "14 min ago", type: "Port Scan Detected", severity: "high", source_ip: "91.195.240.117", status: "blocked" },
    { id: "a3", time: "1 hr ago", type: "Phishing Email", severity: "medium", source_ip: "N/A", status: "quarantined" },
    { id: "a4", time: "2 hrs ago", type: "Suspicious Login", severity: "medium", source_ip: "192.168.1.45", status: "investigating" },
    { id: "a5", time: "3 hrs ago", type: "Failed SSH Attempts", severity: "low", source_ip: "45.33.32.156", status: "resolved" },
    { id: "a6", time: "5 hrs ago", type: "Malware Signature", severity: "high", source_ip: "10.0.0.142", status: "blocked" },
  ],
  top_attack_sources: [
    { country: "Russia", count: 847, flag: "🇷🇺" },
    { country: "China", count: 623, flag: "🇨🇳" },
    { country: "North Korea", count: 312, flag: "🇰🇵" },
    { country: "Iran", count: 201, flag: "🇮🇷" },
    { country: "Unknown", count: 156, flag: "🏴" },
  ],
  threat_categories: [
    { name: "Brute Force", count: 523, percent: 42 },
    { name: "Port Scan", count: 312, percent: 25 },
    { name: "Phishing", count: 187, percent: 15 },
    { name: "Malware", count: 112, percent: 9 },
    { name: "Other", count: 111, percent: 9 },
  ],
};

// ─── Components ───────────────────────────────────────────────

function RiskGauge({ score, level }) {
  const angle = (score / 100) * 180 - 90;
  const levelColors = { low: colors.low, medium: colors.medium, high: colors.high, critical: colors.critical };
  const color = levelColors[level] || colors.low;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="160" height="90" viewBox="0 0 160 90">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.low} />
            <stop offset="50%" stopColor={colors.medium} />
            <stop offset="100%" stopColor={colors.critical} />
          </linearGradient>
        </defs>
        <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke={colors.border} strokeWidth="12" strokeLinecap="round" />
        <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
        <g transform={`rotate(${angle}, 80, 80)`}>
          <line x1="80" y1="80" x2="80" y2="20" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="80" cy="80" r="6" fill={color} />
        </g>
        <text x="80" y="72" textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="monospace">{score}</text>
      </svg>
      <span style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
        {level} risk
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, color = colors.accent, icon }) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: "20px 24px",
      flex: 1,
      minWidth: 160,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ color: colors.textDim, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ color, fontSize: 28, fontWeight: 800, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: colors.textDim, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function AlertRow({ alert }) {
  const sev = alert.severity;
  const c = SEVERITY_COLORS[sev] || colors.textDim;

  const statusBg = {
    blocked: `${colors.low}22`,
    quarantined: `${colors.medium}22`,
    investigating: `${colors.high}22`,
    resolved: `${colors.textDim}22`,
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "12px 16px",
      borderBottom: `1px solid ${colors.border}`,
      transition: "background 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => e.currentTarget.style.background = colors.grid}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: colors.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {alert.type}
        </div>
        <div style={{ color: colors.textDim, fontSize: 11, marginTop: 2 }}>
          {alert.source_ip !== "N/A" ? `Source: ${alert.source_ip}` : "Email-based"} · {alert.time}
        </div>
      </div>
      <div style={{
        padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 1,
        background: statusBg[alert.status] || `${colors.textDim}22`,
        color: alert.status === "blocked" ? colors.low : alert.status === "quarantined" ? colors.medium : alert.status === "investigating" ? colors.high : colors.textDim,
        border: `1px solid ${alert.status === "blocked" ? colors.low : alert.status === "quarantined" ? colors.medium : colors.textDim}44`,
      }}>
        {alert.status}
      </div>
    </div>
  );
}

function ComplianceBadge({ name, status }) {
  const isOk = status === "compliant";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 14px",
      background: isOk ? `${colors.low}11` : `${colors.high}11`,
      border: `1px solid ${isOk ? colors.low : colors.high}44`,
      borderRadius: 8, marginBottom: 8,
    }}>
      <span style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{name}</span>
      <span style={{
        color: isOk ? colors.low : colors.high,
        fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase"
      }}>
        {isOk ? "✓ Compliant" : "⚠ Action Needed"}
      </span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function AutoSOCDashboard() {
  const [data, setData] = useState(MOCK_OVERVIEW);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [time, setTime] = useState(new Date());
  const [pulseOn, setPulseOn] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const p = setInterval(() => setPulseOn(v => !v), 1200);
    return () => { clearInterval(t); clearInterval(p); };
  }, []);

  const PIE_COLORS = [colors.critical, colors.high, colors.medium, colors.accentDim, colors.textDim];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "alerts", label: "Alerts", icon: "◈" },
    { id: "compliance", label: "Compliance", icon: "◎" },
    { id: "reports", label: "Reports", icon: "≡" },
  ];

  return (
    <div style={{
      background: colors.bg,
      minHeight: "100vh",
      color: colors.text,
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Header ── */}
      <header style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, flexShrink: 0,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accent}, #0055AA)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🛡️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, color: colors.accent }}>AutoSOC</div>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase" }}>AI Security Operations</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 4 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? `${colors.accent}22` : "transparent",
              border: activeTab === tab.id ? `1px solid ${colors.accent}44` : "1px solid transparent",
              color: activeTab === tab.id ? colors.accent : colors.textDim,
              padding: "6px 16px", borderRadius: 6, cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: colors.low,
              boxShadow: pulseOn ? `0 0 8px ${colors.low}` : "none",
              transition: "box-shadow 0.6s",
            }} />
            <span style={{ color: colors.low, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>PROTECTED</span>
          </div>
          <div style={{ color: colors.textDim, fontSize: 12, fontFamily: "monospace" }}>
            {time.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Client banner */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.surface}, ${colors.grid})`,
              border: `1px solid ${colors.border}`,
              borderRadius: 12, padding: "16px 24px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Active Client</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>Sunrise Dental Practice</div>
                <div style={{ fontSize: 12, color: colors.textDim }}>Growth Plan · 47 endpoints monitored</div>
              </div>
              <RiskGauge score={data.risk_score} level={data.risk_level} />
            </div>

            {/* Stat Cards */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <StatCard label="Events Today" value={data.summary.total_events_today.toLocaleString()} sub="All analyzed by AI" color={colors.accent} icon="📊" />
              <StatCard label="Threats Detected" value={data.summary.threats_detected_today} sub="Past 24 hours" color={colors.high} icon="⚠️" />
              <StatCard label="Auto-Blocked" value={data.summary.threats_auto_blocked} sub="No human needed" color={colors.low} icon="🛡️" />
              <StatCard label="Endpoints" value={data.summary.endpoints_monitored} sub="All online" color={colors.accentDim} icon="💻" />
              <StatCard label="Uptime" value={`${data.summary.uptime_percent}%`} sub="30-day average" color={colors.low} icon="⚡" />
            </div>

            {/* Charts Row */}
            <div style={{ display: "flex", gap: 20 }}>

              {/* Event Trend */}
              <div style={{
                flex: 2, background: colors.surface,
                border: `1px solid ${colors.border}`, borderRadius: 12, padding: "20px 24px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                  7-Day Event Trend
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.daily_trend}>
                    <defs>
                      <linearGradient id="eventsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="threatsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.critical} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors.critical} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: colors.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: colors.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text }} />
                    <Area type="monotone" dataKey="events" stroke={colors.accent} fill="url(#eventsGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="threats" stroke={colors.critical} fill="url(#threatsGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Threat Categories Pie */}
              <div style={{
                flex: 1, background: colors.surface,
                border: `1px solid ${colors.border}`, borderRadius: 12, padding: "20px 24px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                  Threat Types
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.threat_categories} dataKey="count" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {data.threat_categories.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {data.threat_categories.slice(0, 4).map((cat, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: colors.textDim }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], display: "inline-block" }} />
                        {cat.name}
                      </span>
                      <span style={{ color: colors.text, fontFamily: "monospace" }}>{cat.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: "flex", gap: 20 }}>

              {/* Recent Alerts */}
              <div style={{
                flex: 2, background: colors.surface,
                border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase" }}>Recent Alerts</span>
                  <span style={{
                    background: `${colors.critical}22`, color: colors.critical,
                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    border: `1px solid ${colors.critical}44`,
                  }}>
                    {data.recent_alerts.filter(a => a.severity === "critical" || a.severity === "high").length} HIGH+
                  </span>
                </div>
                {data.recent_alerts.map(alert => <AlertRow key={alert.id} alert={alert} />)}
              </div>

              {/* Attack Sources + Compliance */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Attack Sources */}
                <div style={{
                  background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "20px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                    Top Attack Sources
                  </div>
                  {data.top_attack_sources.map((src, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>{src.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: colors.text }}>{src.country}</span>
                          <span style={{ fontSize: 11, color: colors.textDim, fontFamily: "monospace" }}>{src.count}</span>
                        </div>
                        <div style={{ height: 4, background: colors.border, borderRadius: 2 }}>
                          <div style={{
                            height: "100%", borderRadius: 2,
                            width: `${(src.count / data.top_attack_sources[0].count) * 100}%`,
                            background: `linear-gradient(90deg, ${colors.critical}, ${colors.high})`,
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compliance */}
                <div style={{
                  background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "20px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                    Compliance
                  </div>
                  <ComplianceBadge name="HIPAA" status={data.compliance.hipaa} />
                  <ComplianceBadge name="SOC 2" status={data.compliance.soc2} />
                  <ComplianceBadge name="PCI DSS" status={data.compliance.pci_dss} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Alerts Tab ── */}
        {activeTab === "alerts" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, color: colors.text }}>
              Alert Management
            </div>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 13, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
                  All Alerts — Last 24 Hours
                </span>
              </div>
              {data.recent_alerts.map(alert => <AlertRow key={alert.id} alert={alert} />)}
            </div>
          </div>
        )}

        {/* ── Compliance Tab ── */}
        {activeTab === "compliance" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, color: colors.text }}>Compliance Dashboard</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { name: "HIPAA", score: 88, status: "compliant", checks: ["Access Controls ✓", "Audit Logs ✓", "Encryption ✓", "Backups ✓"] },
                { name: "SOC 2", score: 92, status: "compliant", checks: ["Security ✓", "Availability ✓", "Integrity ✓", "Privacy ✓"] },
                { name: "PCI DSS", score: 67, status: "action_needed", checks: ["Network ✓", "Cardholder Data ⚠", "Vuln Mgmt ⚠", "Access ✓"] },
              ].map(f => (
                <div key={f.name} style={{
                  flex: 1, minWidth: 240,
                  background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{f.name}</div>
                    <div style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: f.status === "compliant" ? `${colors.low}22` : `${colors.high}22`,
                      color: f.status === "compliant" ? colors.low : colors.high,
                      border: `1px solid ${f.status === "compliant" ? colors.low : colors.high}44`,
                    }}>
                      {f.status === "compliant" ? "✓ Compliant" : "⚠ Action Needed"}
                    </div>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: f.score >= 80 ? colors.low : colors.high, marginBottom: 16 }}>
                    {f.score}%
                  </div>
                  <div style={{ height: 6, background: colors.border, borderRadius: 3, marginBottom: 16 }}>
                    <div style={{
                      height: "100%", width: `${f.score}%`, borderRadius: 3,
                      background: f.score >= 80 ? colors.low : colors.high,
                    }} />
                  </div>
                  {f.checks.map((c, i) => (
                    <div key={i} style={{ color: c.includes("⚠") ? colors.high : colors.textDim, fontSize: 12, marginBottom: 6 }}>{c}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reports Tab ── */}
        {activeTab === "reports" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, color: colors.text }}>Security Reports</div>
            <div style={{
              background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32, maxWidth: 720,
            }}>
              <div style={{ fontSize: 13, color: colors.textDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                Weekly Report · Week of Feb 17–24, 2026
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Your Security Update</div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: `${colors.low}11`, border: `1px solid ${colors.low}44`, borderRadius: 10, marginBottom: 24 }}>
                <span style={{ fontSize: 28 }}>🟢</span>
                <div>
                  <div style={{ fontWeight: 700, color: colors.low, marginBottom: 2 }}>Your business is well protected this week.</div>
                  <div style={{ color: colors.textDim, fontSize: 13 }}>Risk Score: 24/100 — No major incidents occurred.</div>
                </div>
              </div>

              {[
                { title: "What We Found", icon: "🔍", content: "We analyzed 14,382 security events this week. Our AI detected 7 potential threats, of which 5 were automatically blocked before they could cause any harm. Two events required our manual review — both were confirmed as low risk." },
                { title: "What We Did About It", icon: "🛡️", content: "Blocked 3 brute force attacks from Russian IP addresses trying to guess your admin password. Quarantined 2 phishing emails before they reached your inbox. Blocked 2 suspicious file downloads on endpoint WIN-DESKTOP-03." },
                { title: "Your Security Tip This Week", icon: "💡", content: "Enable multi-factor authentication (MFA) on your email accounts. This single step blocks 99% of automated hacking attempts. It takes 5 minutes to set up and we can walk you through it on our next call." },
              ].map((section, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{section.icon}</span> {section.title}
                  </div>
                  <div style={{ color: colors.textDim, fontSize: 13, lineHeight: 1.7, paddingLeft: 28 }}>{section.content}</div>
                </div>
              ))}

              <div style={{ marginTop: 24, padding: "14px 20px", background: colors.grid, borderRadius: 8, fontSize: 12, color: colors.textDim }}>
                <span style={{ color: colors.accent }}>Next report:</span> February 24, 2026 · Questions? Reply to this email anytime.
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${colors.border}`,
        padding: "12px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: colors.surface,
      }}>
        <div style={{ fontSize: 11, color: colors.textDim }}>
          AutoSOC v1.0.0 · AI-Powered Security Operations
        </div>
        <div style={{ fontSize: 11, color: colors.textDim }}>
          Monitoring: <span style={{ color: colors.low }}>ACTIVE</span> · Events processed today: <span style={{ color: colors.accent, fontFamily: "monospace" }}>2,847</span>
        </div>
      </footer>
    </div>
  );
}
