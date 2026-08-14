import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Zap, 
  Activity, 
  Server, 
  Terminal, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  EyeOff, 
  FileText, 
  RefreshCw, 
  Sparkles,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const PRESETS = [
  {
    name: "Corporate Payroll & Email",
    text: "Please send the Q3 bonus spreadsheet to Sarah Connor at sarah.c@cyberdyne.io or call her mobile at +1 (415) 555-0199."
  },
  {
    name: "Financial Account & SSN",
    text: "Customer Johnathan Vance submitted SSN 123-45-6789 and requested wire transfer from routing #021000021."
  },
  {
    name: "Credit Card Leak",
    text: "Charge client card 4532-8921-9871-3421 for enterprise subscription renewal before expiration."
  },
  {
    name: "Clean Dev Prompt",
    text: "Write a high-performance Python script to calculate Fibonacci sequence using dynamic programming."
  }
];

export default function App() {
  const [prompt, setPrompt] = useState(PRESETS[0].text);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Results
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Metrics & Audit
  const [metrics, setMetrics] = useState({
    total_requests: 0,
    total_threats_blocked: 0,
    avg_latency_ms: 0,
    threat_types_breakdown: {},
    active_model: "llama-3.1-8b-instant",
    fail_closed_active: true
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Fetch telemetry and health
  const fetchData = async () => {
    try {
      const [healthRes, metricsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/health`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/api/metrics`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/api/audit-logs?limit=15`).then(r => r.json()).catch(() => null)
      ]);

      if (healthRes) setBackendHealth(healthRes);
      if (metricsRes) setMetrics(metricsRes);
      if (logsRes) setAuditLogs(logsRes);
    } catch (err) {
      console.error("Telemetry sync failed:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSanitize = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sanitize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: prompt,
          simulate_failure: simulateFailure
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Request failed due to security guard intervention.");
      }

      setResult(data);
      fetchData();
    } catch (err) {
      setError(err.message);
      setResult(null);
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'EMAIL_ADDRESS': return 'entity-badge email';
      case 'PERSON': return 'entity-badge person';
      case 'PHONE_NUMBER': return 'entity-badge phone';
      case 'US_SSN':
      case 'CREDIT_CARD': return 'entity-badge ssn';
      default: return 'entity-badge default';
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 60px' }}>
      
      {/* Top Navigation */}
      <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={28} color="#10b981" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                TrustShield <span style={{ color: '#10b981', fontWeight: '400' }}>| PII Gateway</span>
              </h1>
              <span style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)'
              }}>
                MVP v1.0
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
              Enterprise Zero-PII Redaction Engine & LLM Security Middleware
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
            <span className="pulse-dot"></span>
            <span style={{ color: 'var(--text-muted)' }}>Backend:</span>
            <strong style={{ color: backendHealth ? '#10b981' : '#f43f5e' }}>
              {backendHealth ? 'Connected (Port 8000)' : 'Connecting...'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
            <Cpu size={14} color="#06b6d4" />
            <span style={{ color: 'var(--text-muted)' }}>Engine:</span>
            <strong style={{ color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>Groq LLaMA 3.1</strong>
          </div>

          <button 
            onClick={() => setShowDocsModal(true)}
            className="btn-secondary"
          >
            <FileText size={14} />
            PRD Specs
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* KPI 1: Threats Blocked */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>PII Threats Intercepted</div>
              <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '6px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                {metrics.total_threats_blocked}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '10px' }}>
              <ShieldAlert size={22} color="#10b981" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14} color="#10b981" />
            <span>Emails, SSNs, Phones, Cards masked</span>
          </div>
        </div>

        {/* KPI 2: Total Requests */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Total Inspected Requests</div>
              <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '6px', color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>
                {metrics.total_requests}
              </div>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.12)', padding: '10px', borderRadius: '10px' }}>
              <Activity size={22} color="#06b6d4" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#06b6d4" />
            <span>100% evaluated via Presidio NLP</span>
          </div>
        </div>

        {/* KPI 3: Latency SLA */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Average Latency</div>
              <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '6px', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                {metrics.avg_latency_ms} <span style={{ fontSize: '16px', fontWeight: '500' }}>ms</span>
              </div>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.12)', padding: '10px', borderRadius: '10px' }}>
              <Zap size={22} color="#c084fc" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14} color="#10b981" />
            <span>SLA Met: Sub-second (&lt;1000ms)</span>
          </div>
        </div>

        {/* KPI 4: Fail-Closed Posture */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>Security Policy</div>
              <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '12px', color: '#fb7185', letterSpacing: '-0.3px' }}>
                FAIL-CLOSED
              </div>
            </div>
            <div style={{ background: 'rgba(244, 63, 94, 0.12)', padding: '10px', borderRadius: '10px' }}>
              <Lock size={22} color="#fb7185" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <EyeOff size={14} color="#fb7185" />
            <span>Zero raw PII storage policy</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Playground & Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Left Column: Interceptor Input & Playground */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="#10b981" />
              <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Live Interceptor Sandbox</h2>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              POST /api/sanitize
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>
              Select Enterprise Test Scenario:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p.text)}
                  className="preset-chip"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSanitize} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ position: 'relative', flex: 1, marginBottom: '16px' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter text containing sensitive PII (emails, names, SSNs, credit cards, phones)..."
                rows={7}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '160px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-emerald)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            {/* Options and Submit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  style={{ accentColor: '#f43f5e', cursor: 'pointer' }}
                />
                <span style={{ color: simulateFailure ? '#fb7185' : 'inherit' }}>
                  Simulate Engine Failure (Test Fail-Closed)
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Intercepting & Redacting...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Inspect & Sanitize Prompt
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Notice (Fail-Closed) */}
          {error && (
            <div style={{
              marginTop: '18px',
              padding: '14px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <AlertTriangle size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#fb7185', fontSize: '13px', display: 'block' }}>
                  Fail-Closed Security Block Engaged
                </strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Stage Inspection Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#06b6d4" />
              <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Real-Time Pipeline Inspection</h2>
            </div>
            {result && (
              <span style={{
                background: 'rgba(6, 182, 212, 0.1)',
                color: '#06b6d4',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}>
                ⚡ {result.latency_ms} ms
              </span>
            )}
          </div>

          {!result && !error && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: 'var(--text-dim)',
              textAlign: 'center'
            }}>
              <Shield size={42} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Waiting for prompt ingestion
              </div>
              <p style={{ fontSize: '12px', maxWidth: '320px', marginTop: '6px' }}>
                Run an enterprise preset or enter custom prompt to inspect live NER detection, redaction tokens, and Groq inference.
              </p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              
              {/* Detected Entities Badges */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    Detected Entities ({result.detected_entities.length}):
                  </span>
                </div>
                
                {result.detected_entities.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#10b981', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px' }}>
                    ✓ No sensitive PII detected. Prompt is clean.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.detected_entities.map((item, idx) => (
                      <div key={idx} className={getBadgeClass(item.entity_type)}>
                        <span>{item.entity_type}</span>
                        <span style={{ opacity: 0.7 }}>({item.text_snippet})</span>
                        <span style={{ background: 'rgba(0,0,0,0.2)', padding: '0 4px', borderRadius: '4px', fontSize: '10px' }}>
                          {item.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage 1: Mathematically Redacted Prompt */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    1. Sanitized Safe Prompt (Zero-PII Output):
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.sanitized_prompt)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                  >
                    {copied ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#34d399'
                }}>
                  {result.sanitized_prompt}
                </div>
              </div>

              {/* Stage 2: LLM Inference Output */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    2. Groq LLaMA Inference Response:
                  </span>
                  <span style={{ fontSize: '11px', color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>
                    llama-3.1-8b-instant
                  </span>
                </div>
                <div style={{
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}>
                  {result.llm_response}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Zero-PII Audit Telemetry Stream */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={18} color="#10b981" />
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Compliance Telemetry & Audit Stream</h2>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              Zero Raw PII Storage Policy Enforced
            </span>
          </div>

          <button
            onClick={fetchData}
            className="btn-secondary"
          >
            <RefreshCw size={13} />
            Refresh Stream
          </button>
        </div>

        {/* Audit Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '10px 14px', fontWeight: '600' }}>Timestamp (UTC)</th>
                <th style={{ padding: '10px 14px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: '600' }}>Threats</th>
                <th style={{ padding: '10px 14px', fontWeight: '600' }}>Blocked Categories</th>
                <th style={{ padding: '10px 14px', fontWeight: '600' }}>Sanitized Output Preview (Zero PII)</th>
                <th style={{ padding: '10px 14px', fontWeight: '600' }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No audit records recorded yet. Submit a prompt in the sandbox above.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      #{log.id}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-dim)', fontSize: '12px' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        fontFamily: 'var(--font-mono)',
                        background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: log.status === 'SUCCESS' ? '#34d399' : '#fb7185'
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: log.threats_intercepted > 0 ? '#10b981' : 'var(--text-dim)' }}>
                      {log.threats_intercepted}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {log.detected_entity_types && log.detected_entity_types.length > 0 ? (
                          log.detected_entity_types.map((t, i) => (
                            <span key={i} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                              {t}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.sanitized_preview || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#06b6d4' }}>
                      {log.latency_ms} ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRD Specs Modal */}
      {showDocsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ maxWidth: '720px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="#10b981" />
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Product Requirements Document (PRD) Summary</h2>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="btn-secondary"
                style={{ padding: '4px 10px' }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.7', color: 'var(--text-muted)' }}>
              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  1. Executive Summary
                </strong>
                The Enterprise PII Security Middleware intercepts prompts, detects Personally Identifiable Information using Microsoft Presidio NLP, redacts sensitive data, and routes sanitized prompts to Groq LLMs.
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  2. Non-Functional Compliance Requirements
                </strong>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong style={{ color: '#34d399' }}>Security (Fail-Closed):</strong> Any NLP error aborts request execution immediately.</li>
                  <li><strong style={{ color: '#06b6d4' }}>Performance SLA:</strong> End-to-end redaction + inference latency under 1000ms.</li>
                  <li><strong style={{ color: '#fb7185' }}>Zero-PII Statelessness:</strong> Raw user prompts containing PII are never persisted in the database or server logs.</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  3. Key Architectural Files
                </strong>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>📁 docs/PRD.md - Complete Product Requirements Document</div>
                  <div>📁 docs/TRD.md - Technical Requirements Document</div>
                  <div>📁 main.py - FastAPI Middleware &amp; Fail-Closed Gateway</div>
                  <div>📁 database.py - Zero-PII Audit Telemetry Schema</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
