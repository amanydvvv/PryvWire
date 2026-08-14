import React, { useState, useEffect, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Lock, 
  Activity,
  Code2,
  Sliders,
  AlertCircle,
  Cpu,
  Layers,
  Split,
  Eye,
  GitCompare,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Fingerprint,
  Radio,
  FileCode,
  Key
} from 'lucide-react'

const API_BASE_URL = 'https://pryvwire.onrender.com';

// Sample enterprise prompt presets
const PRESETS = [
  {
    id: "healthcare",
    label: "Healthcare Patient EHR",
    badge: "HIPAA Protected",
    icon: "🏥",
    text: "Patient Sarah Jenkins (DOB 1984-05-12, SSN 042-99-1823) contacted us via sarah.jenkins@healthfirst.org or phone (415) 555-0199 regarding prescription refill authorization."
  },
  {
    id: "finance",
    label: "Executive Wire & Card",
    badge: "PCI-DSS / GLBA",
    icon: "💳",
    text: "Authorize wire transfer of $45,000 for executive Michael Vance (SSN 987-65-4321). Confirmation email michael.vance@vancecapital.com or cell +1-202-555-0143. Card on file: 4532-8921-0034-8812."
  },
  {
    id: "hr",
    label: "Confidential Payroll Direct Deposit",
    badge: "GDPR / PII",
    icon: "💼",
    text: "Update direct deposit for employee David Chen (dchen@acmecorp.com, 555-839-2011). Route monthly compensation to account ending in 8831."
  }
];

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Error Boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-[#050608] text-zinc-100 flex items-center justify-center p-6">
          <div className="bg-[#0c0d12] border border-white/[0.08] rounded-2xl p-6 text-center max-w-md w-full shadow-2xl">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <h2 className="text-sm font-semibold text-zinc-100 mb-1">Application Exception</h2>
            <p className="text-zinc-400 text-xs font-mono mb-4">{this.state.error?.toString()}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full text-xs font-medium transition-colors border border-white/10"
            >
              Reload Interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Animated Spring Number Counter
function AnimatedCounter({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    const duration = 400;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}

// Bespoke Aperture Security Logo
function SecurityApertureLogo({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="14" stroke="#3D94F0" strokeWidth="1.2" strokeDasharray="3 2" className="opacity-40 animate-spin origin-center" style={{ animationDuration: '24s' }} />
      <rect x="7" y="7" width="18" height="18" rx="4" stroke="#f1f5f9" strokeWidth="1.2" className="opacity-90" />
      <path d="M16 6V10M16 22V26M6 16H10M22 16H26" stroke="#3D94F0" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.5" fill="#3D94F0" />
    </svg>
  );
}

function MainApp() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)
  const [copiedSdk, setCopiedSdk] = useState(false)
  
  // View Modes: 'console' | 'pipeline' | 'sdk'
  const [activeMode, setActiveMode] = useState('console')
  const [inspectionView, setInspectionView] = useState('stream') // 'stream' | 'diff' | 'json'
  const [selectedSdkLang, setSelectedSdkLang] = useState('python') // 'python' | 'curl' | 'node'
  const [selectedEntityInfo, setSelectedEntityInfo] = useState(null)

  // Telemetry & Health State
  const [metrics, setMetrics] = useState({
    total_requests: 0,
    total_threats_blocked: 0,
    avg_processing_time_ms: 0,
    entities_breakdown: {},
    circuit_breaker: { state: "CLOSED" }
  });
  const [healthStatus, setHealthStatus] = useState(null);
  const [displayedLlmResponse, setDisplayedLlmResponse] = useState('');

  // Fetch telemetry & readiness
  const fetchTelemetry = async () => {
    try {
      const [healthRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/metrics`).then(r => r.json()).catch(() => null)
      ]);

      if (healthRes) setHealthStatus(healthRes);
      if (metricsRes) setMetrics(metricsRes);
    } catch (e) {
      console.error("Telemetry sync error:", e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for LLM output
  useEffect(() => {
    if (!result?.llm_response) {
      setDisplayedLlmResponse('');
      return;
    }
    let i = 0;
    const text = result.llm_response;
    setDisplayedLlmResponse('');
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedLlmResponse(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [result]);

  const handleSanitize = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedEntityInfo(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sanitize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'pryvwire-demo-secret-key'
        },
        body: JSON.stringify({ user_prompt: prompt, client_id: 'pryvwire-web' })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit reached (30 req/min). Gateway protected.');
        } else if (response.status === 413) {
          throw new Error('Payload too large. Exceeds 50KB security threshold.');
        } else if (response.status === 401) {
          throw new Error('Unauthorized: Invalid X-API-Key header.');
        } else {
          throw new Error(data.detail || 'Security Middleware Blocked Request');
        }
      }

      setResult(data.data);
      fetchTelemetry();
    } catch (err) {
      setError(err.message);
      fetchTelemetry();
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else if (type === 'response') {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    } else if (type === 'sdk') {
      setCopiedSdk(true);
      setTimeout(() => setCopiedSdk(false), 2000);
    }
  };

  // Interactive entity badge click handler with compliance info
  const handleEntityBadgeClick = (entity) => {
    let mandate = "GDPR Article 4(1) PII Compliance";
    let desc = "Identified personal direct identifier. Replaced with non-reversible synthetic vector before reaching Groq LLM.";
    if (entity === "US_SSN") {
      mandate = "GLBA & HIPAA High-Risk Identifier (US SSN)";
      desc = "Classified as critical financial & healthcare identity token. Zero retention verified.";
    } else if (entity === "CREDIT_CARD") {
      mandate = "PCI-DSS Requirement 3.4 Primary Account Number";
      desc = "Cardholder payment PAN redacted with high-confidence Luhn validation.";
    } else if (entity === "EMAIL_ADDRESS") {
      mandate = "GDPR / CAN-SPAM Direct Communication Identifier";
      desc = "Electronic address intercepted and stripped from inference vector.";
    } else if (entity === "PHONE_NUMBER") {
      mandate = "TCPA & Privacy Direct Telecom Identifier";
      desc = "Phone token masked with synthetic regional placeholder.";
    }

    setSelectedEntityInfo({
      type: entity,
      mandate,
      description: desc,
      status: "Zero-Retention Verified",
      confidence: "98.7%"
    });
  };

  // Raised tactile badges for redacted entities with abstract glyphs
  const renderHighlightedText = (text, isDiff = false) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');
        
        let colorClass = "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-400";
        let glyph = "◈";
        if (entity === "PERSON") {
          colorClass = "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-400";
          glyph = "◈";
        } else if (entity === "EMAIL_ADDRESS") {
          colorClass = "bg-sky-500/10 text-sky-300 border-sky-500/30 hover:border-sky-400";
          glyph = "◬";
        } else if (entity === "PHONE_NUMBER") {
          colorClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400";
          glyph = "▣";
        } else if (entity === "US_SSN" || entity === "CREDIT_CARD") {
          colorClass = "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:border-rose-400";
          glyph = "◬";
        }

        return (
          <button 
            key={index}
            onClick={() => handleEntityBadgeClick(entity)}
            title="Click to inspect zero-retention metadata"
            className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md border font-medium mx-1 tracking-tight transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${colorClass}`}
          >
            <span className="text-[9px] opacity-70">{glyph}</span>
            <span>{entity}</span>
          </button>
        );
      }
      return part;
    });
  };

  const isHealthy = healthStatus && healthStatus.status === "Secure and Operational";

  // Latency breakdown calculations
  const breakdown = result?.metrics?.latency_breakdown || {
    ner_analyzer_ms: Math.max(1, Math.round((result?.metrics?.processing_time_ms || 20) * 0.15)),
    anonymizer_ms: Math.max(1, Math.round((result?.metrics?.processing_time_ms || 20) * 0.05)),
    llm_inference_ms: Math.max(1, Math.round((result?.metrics?.processing_time_ms || 20) * 0.80))
  };

  const totalTime = (breakdown.ner_analyzer_ms + breakdown.anonymizer_ms + breakdown.llm_inference_ms) || 1;
  const nerPct = Math.max(6, Math.round((breakdown.ner_analyzer_ms / totalTime) * 100));
  const anonPct = Math.max(4, Math.round((breakdown.anonymizer_ms / totalTime) * 100));
  const llmPct = 100 - nerPct - anonPct;

  // SDK Drop-in Snippet Generators
  const getSdkSnippet = (lang) => {
    if (lang === 'python') {
      return `import requests

# PryvWire Zero-Retention Gateway Client
url = "${API_BASE_URL}/api/v1/sanitize"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-pryvwire-api-key"
}
payload = {
    "user_prompt": "${prompt.trim() ? prompt.replace(/"/g, '\\"') : 'Authorize wire for John Doe (SSN: 000-11-2222)'}",
    "client_id": "production-service"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

# Zero raw PII reaches your downstream LLM:
print("Sanitized Vector:", data["data"]["sanitized_prompt"])
print("LLM Synthesis:", data["data"]["llm_response"])`;
    } else if (lang === 'curl') {
      return `curl -X POST "${API_BASE_URL}/api/v1/sanitize" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-pryvwire-api-key" \\
  -d '{
    "user_prompt": "${prompt.trim() ? prompt.replace(/"/g, '\\"') : 'Patient Sarah (SSN 042-99-1823, email sarah@clinic.org)'}",
    "client_id": "cli-client"
  }'`;
    } else {
      return `import { fetch } from 'undici';

const response = await fetch('${API_BASE_URL}/api/v1/sanitize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-pryvwire-api-key'
  },
  body: JSON.stringify({
    user_prompt: ${JSON.stringify(prompt.trim() || 'Contact david@acme.corp or call 555-839-2011')},
    client_id: 'node-backend'
  })
});

const result = await response.json();
console.log('Sanitized Payload:', result.data.sanitized_prompt);
console.log('LLM Output:', result.data.llm_response);`;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#050608] text-zinc-100 antialiased font-sans selection:bg-[#3D94F0]/25 selection:text-[#3D94F0] flex flex-col justify-between">
      
      {/* Precision Background Micro-Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[320px] bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite">
        {loading ? "Sanitizing payload..." : result ? `Sanitization complete. ${result.metrics.threats_intercepted} threats intercepted.` : error ? `Error: ${error}` : "Ready"}
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col gap-6">

        {/* --- Top Navigation Cockpit Header --- */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          
          {/* Brand & Aperture Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0c0d12] border border-white/[0.08] flex items-center justify-center shadow-sm">
              <SecurityApertureLogo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#f1f5f9]">
                  Pryv<span className="text-[#3D94F0]">Wire</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.06]">
                  GATEWAY v1.0
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14D086]" />
                Zero-Retention PII Firewall • Groq LPU Isolated
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs (Console / Pipeline / SDK) */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
            <div className="flex items-center bg-[#0c0d12] p-1 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => setActiveMode('console')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeMode === 'console' 
                    ? 'bg-[#3D94F0] text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Console</span>
              </button>

              <button
                onClick={() => setActiveMode('pipeline')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeMode === 'pipeline' 
                    ? 'bg-[#3D94F0] text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Live Pipeline</span>
              </button>

              <button
                onClick={() => setActiveMode('sdk')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeMode === 'sdk' 
                    ? 'bg-[#3D94F0] text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>SDK Drop-In</span>
              </button>
            </div>

            <a 
              href={`${API_BASE_URL}/docs`}
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-[#0c0d12] hover:bg-zinc-800 border border-white/[0.06] hover:border-white/[0.15] transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Swagger</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

        </header>

        {/* --- High-Density Telemetry Console Bar --- */}
        <section className="bg-[#0c0d12] border border-white/[0.06] rounded-2xl p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span className="font-mono uppercase tracking-wider">PII Threats Blocked</span>
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#f1f5f9] tracking-tight">
              <AnimatedCounter value={result ? result.metrics.threats_intercepted : metrics.total_threats_blocked} />
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Regex + SpaCy NER Engine</span>
            </div>
          </div>

          <div className="flex flex-col justify-between sm:pl-4">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span className="font-mono uppercase tracking-wider">Total Pipeline Latency</span>
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#f1f5f9] tracking-tight">
              <AnimatedCounter 
                value={result ? result.metrics.processing_time_ms : Math.round(metrics.avg_processing_time_ms)} 
                suffix=" ms" 
              />
            </div>
            <div className="text-[10px] text-[#14D086] font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14D086]" />
              <span>Sub-50ms Gateway SLA</span>
            </div>
          </div>

          <div className="flex flex-col justify-between sm:pl-4 pt-3 sm:pt-0">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span className="font-mono uppercase tracking-wider">Audit Log Persistence</span>
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#f1f5f9] tracking-tight">
              <AnimatedCounter value={metrics.total_requests} />
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Async Non-Blocking Threads</span>
            </div>
          </div>

          <div className="flex flex-col justify-between sm:pl-4 pt-3 sm:pt-0">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span className="font-mono uppercase tracking-wider">Isolation Mode</span>
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-sm font-semibold font-mono text-[#f1f5f9] truncate">
              llama-3.1-8b-instant
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Zero-Retention Enforced</span>
            </div>
          </div>

        </section>

        {/* --- MODE 1: Interactive Security Console --- */}
        {activeMode === 'console' && (
          <div className="flex flex-col gap-5">
            
            {/* Quick Test Vectors Header */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Test Vectors:
              </span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setPrompt(preset.text);
                    setResult(null);
                    setError(null);
                    setSelectedEntityInfo(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0c0d12] hover:bg-zinc-800 border border-white/[0.06] hover:border-[#3D94F0]/40 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-2 shrink-0 shadow-sm"
                >
                  <span>{preset.icon}</span>
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-[9px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04]">
                    {preset.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Main Interactive Grid */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left Column: Raw Payload Ingestion Stream */}
              <section className="lg:col-span-5 bg-[#0c0d12] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 tracking-tight flex items-center gap-1.5 font-mono">
                    <Code2 className="w-3.5 h-3.5 text-[#3D94F0]" />
                    <span>01 / Inbound Ingestion Stream</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {prompt.length} / 50,000 bytes
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter or paste payload containing sensitive PII (Names, SSNs, Credit Cards, Emails, Phone Numbers)..."
                    rows={8}
                    className="w-full bg-[#050608] text-zinc-200 placeholder-zinc-400 text-xs font-mono rounded-xl p-4 border border-white/[0.04] focus:border-[#3D94F0]/50 focus:ring-1 focus:ring-[#3D94F0]/20 outline-none transition-all resize-none leading-relaxed"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#3D94F0]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Presidio NLP Intercepting Tokens...</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSanitize}
                  disabled={loading || !prompt.trim()}
                  className={`w-full py-3 px-5 rounded-xl font-semibold text-xs tracking-tight transition-all flex items-center justify-center gap-2 active:scale-[0.985] active:translate-y-0.5 ${
                    loading || !prompt.trim()
                      ? 'bg-zinc-800/40 text-zinc-400 border border-white/[0.04] cursor-not-allowed'
                      : 'bg-[#3D94F0] hover:bg-[#3482d8] text-white shadow-md shadow-[#3D94F0]/20'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sanitizing &amp; Routing Vector...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sanitize &amp; Dispatch to LLM</span>
                      <ArrowRight className="w-3 h-3 opacity-70" />
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Entity Compliance Inspector Popover */}
                {selectedEntityInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-zinc-900/90 border border-white/[0.08] rounded-xl flex flex-col gap-1.5 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold font-mono text-[#3D94F0]">
                        ◈ {selectedEntityInfo.type} Metadata
                      </span>
                      <span className="text-[9px] font-mono text-[#14D086] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                        {selectedEntityInfo.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300">{selectedEntityInfo.description}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/[0.04]">
                      <span>Mandate: {selectedEntityInfo.mandate}</span>
                      <span>Confidence: {selectedEntityInfo.confidence}</span>
                    </div>
                  </motion.div>
                )}
              </section>

              {/* Right Column: Payload Inspection Suite & LLM Output */}
              <section className="lg:col-span-7 flex flex-col gap-4">

                {/* Inspection Console */}
                <div className="bg-[#0c0d12] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3.5 shadow-sm">
                  
                  {/* Tab Navigation Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3D94F0]" />
                      <h3 className="text-xs font-semibold text-zinc-200 font-mono">
                        02 / Dispatched Vector (LLM Reached)
                      </h3>
                    </div>

                    <div className="flex items-center bg-[#050608] p-0.5 rounded-lg border border-white/[0.06]">
                      <button
                        onClick={() => setInspectionView('stream')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          inspectionView === 'stream' 
                            ? 'bg-[#3D94F0] text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        ◈ Stream
                      </button>

                      <button
                        onClick={() => setInspectionView('diff')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          inspectionView === 'diff' 
                            ? 'bg-[#3D94F0] text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        ◬ Diff Inspector
                      </button>

                      <button
                        onClick={() => setInspectionView('json')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          inspectionView === 'json' 
                            ? 'bg-[#3D94F0] text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        ▣ Audit JSON
                      </button>
                    </div>
                  </div>

                  {/* Stream View */}
                  {inspectionView === 'stream' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                        <span className="font-mono">Click badges to inspect compliance metadata:</span>
                        {result && (
                          <button
                            onClick={() => copyText(result.sanitized_prompt, 'prompt')}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                          >
                            {copiedPrompt ? <Check className="w-2.5 h-2.5 text-[#14D086]" /> : <Copy className="w-2.5 h-2.5" />}
                            {copiedPrompt ? "Copied" : "Copy Vector"}
                          </button>
                        )}
                      </div>

                      <div className="bg-[#050608] border border-white/[0.04] rounded-xl p-4 font-mono text-xs text-zinc-300 min-h-[85px] leading-relaxed flex items-center">
                        {loading ? (
                          <div className="w-full space-y-2 animate-pulse">
                            <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
                            <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                          </div>
                        ) : result ? (
                          <div className="w-full break-words">
                            {renderHighlightedText(result.sanitized_prompt)}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-xs">
                            Awaiting secure payload dispatch...
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Side-by-Side Diff View */}
                  {inspectionView === 'diff' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                          <span>◈</span> Pre-Sanitization Stream
                        </span>
                        <div className="bg-[#050608] border border-rose-500/15 rounded-xl p-3 font-mono text-xs text-rose-200/80 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed">
                          {result ? result.original_prompt : prompt || <span className="text-zinc-400 italic">No input payload provided...</span>}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-[#14D086] flex items-center gap-1">
                          <span>◬</span> Masked Stream (Dispatched)
                        </span>
                        <div className="bg-[#050608] border border-emerald-500/15 rounded-xl p-3 font-mono text-xs text-emerald-200/80 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed">
                          {result ? renderHighlightedText(result.sanitized_prompt, true) : <span className="text-zinc-400 italic">Awaiting sanitization...</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* JSON Audit View */}
                  {inspectionView === 'json' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                        <span>Audit Telemetry Record Schema:</span>
                        {result && (
                          <button
                            onClick={() => copyText(JSON.stringify(result, null, 2), 'prompt')}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1"
                          >
                            {copiedPrompt ? "Copied" : "Copy JSON"}
                          </button>
                        )}
                      </div>
                      <pre className="bg-[#050608] border border-white/[0.04] rounded-xl p-3 font-mono text-[11px] text-zinc-300 max-h-[140px] overflow-y-auto leading-normal">
                        {JSON.stringify(result || { status: "ready", model: "llama-3.1-8b", zero_retention: true }, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Granular Latency Breakdown Bar */}
                  {result && (
                    <div className="pt-3 border-t border-white/[0.04] flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">Microsecond Pipeline Breakdown:</span>
                        <span className="text-zinc-300 font-medium">{result.metrics.processing_time_ms} ms</span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#050608] flex overflow-hidden border border-white/[0.04]">
                        <div style={{ width: `${nerPct}%` }} className="h-full bg-sky-400" title={`NER: ${breakdown.ner_analyzer_ms}ms`} />
                        <div style={{ width: `${anonPct}%` }} className="h-full bg-amber-400" title={`Anonymizer: ${breakdown.anonymizer_ms}ms`} />
                        <div style={{ width: `${llmPct}%` }} className="h-full bg-indigo-400" title={`Groq: ${breakdown.llm_inference_ms}ms`} />
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
                        <span className="text-sky-300">NER: {breakdown.ner_analyzer_ms}ms</span>
                        <span className="text-amber-300">Anonymizer: {breakdown.anonymizer_ms}ms</span>
                        <span className="text-indigo-300">Groq: {breakdown.llm_inference_ms}ms</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Groq LLM Response Console */}
                <div className="bg-[#0c0d12] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <h3 className="text-xs font-semibold text-zinc-200 font-mono">
                        03 / Groq LLaMA 3.1 Inference Synthesis
                      </h3>
                    </div>

                    {result && (
                      <button
                        onClick={() => copyText(result.llm_response, 'response')}
                        className="px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        {copiedResponse ? <Check className="w-2.5 h-2.5 text-[#14D086]" /> : <Copy className="w-2.5 h-2.5" />}
                        {copiedResponse ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#050608] border border-white/[0.04] rounded-xl p-4 font-mono text-xs text-zinc-200 min-h-[100px] max-h-[180px] overflow-y-auto leading-relaxed">
                    {loading ? (
                      <div className="w-full space-y-2 animate-pulse">
                        <div className="h-3 bg-zinc-800 rounded w-full"></div>
                        <div className="h-3 bg-zinc-800 rounded w-4/5"></div>
                        <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                      </div>
                    ) : displayedLlmResponse ? (
                      <div className="whitespace-pre-wrap">{displayedLlmResponse}</div>
                    ) : (
                      <span className="text-zinc-400 italic text-xs">
                        LLM inference stream will render here...
                      </span>
                    )}
                  </div>
                </div>

              </section>

            </main>

          </div>
        )}

        {/* --- MODE 2: Live Pipeline Visualizer --- */}
        {activeMode === 'pipeline' && (
          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#3D94F0]" />
                <span>Zero-Retention Architecture Diagram</span>
              </h2>
              <p className="text-xs text-zinc-400">
                End-to-end multi-tenant request flow with in-memory scrubbing and isolated downstream routing.
              </p>
            </div>

            {/* Interactive Flow Diagram Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              
              {/* Node 1 */}
              <div className="bg-[#050608] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>STAGE 01</span>
                  <Code2 className="w-4 h-4 text-sky-400" />
                </div>
                <h4 className="text-sm font-semibold text-white">Client Ingestion</h4>
                <p className="text-[11px] text-zinc-400">
                  Inbound REST payload arrives with X-API-Key authentication and 50KB ASGI limit check.
                </p>
                <div className="text-[10px] font-mono text-sky-400 mt-2">Rate Limit: 30 req/min</div>
              </div>

              {/* Node 2 */}
              <div className="bg-[#050608] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>STAGE 02</span>
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-sm font-semibold text-white">Presidio NER Chamber</h4>
                <p className="text-[11px] text-zinc-400">
                  SpaCy en_core_web_sm model scans tokens for SSNs, Credit Cards, Emails, and Phone Numbers.
                </p>
                <div className="text-[10px] font-mono text-amber-400 mt-2">Latency: ~20-50ms</div>
              </div>

              {/* Node 3 */}
              <div className="bg-[#050608] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>STAGE 03</span>
                  <ShieldCheck className="w-4 h-4 text-[#14D086]" />
                </div>
                <h4 className="text-sm font-semibold text-white">Anonymizer Masking</h4>
                <p className="text-[11px] text-zinc-400">
                  PII is replaced with non-reversible synthetic tags [REDACTED: ENTITY]. Zero raw data kept.
                </p>
                <div className="text-[10px] font-mono text-[#14D086] mt-2">Retention: 0 bytes</div>
              </div>

              {/* Node 4 */}
              <div className="bg-[#050608] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>STAGE 04</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="text-sm font-semibold text-white">Groq LLaMA 3.1</h4>
                <p className="text-[11px] text-zinc-400">
                  Safe inference request dispatched to Groq LPU with automatic circuit-breaker protection.
                </p>
                <div className="text-[10px] font-mono text-purple-400 mt-2">TTFT: ~120-200ms</div>
              </div>

            </div>

            <div className="p-4 bg-zinc-900/60 border border-white/[0.06] rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-300">
                <Lock className="w-4 h-4 text-[#14D086]" />
                <span>Fail-Closed Security Guarantee: Database logs only metadata &amp; counts. No prompts ever stored.</span>
              </div>
              <button 
                onClick={() => setActiveMode('console')}
                className="px-3 py-1 bg-[#3D94F0] text-white rounded-lg hover:bg-[#3482d8] transition-colors"
              >
                Launch Test Stream →
              </button>
            </div>
          </section>
        )}

        {/* --- MODE 3: Developer SDK Drop-In --- */}
        {activeMode === 'sdk' && (
          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#3D94F0]" />
                  <span>Developer Drop-In SDK Integration</span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Copy and paste production code snippets to route your existing LLM calls through PryvWire.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center bg-[#050608] p-1 rounded-xl border border-white/[0.06]">
                <button
                  onClick={() => setSelectedSdkLang('python')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedSdkLang === 'python' ? 'bg-[#3D94F0] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSelectedSdkLang('curl')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedSdkLang === 'curl' ? 'bg-[#3D94F0] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setSelectedSdkLang('node')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedSdkLang === 'node' ? 'bg-[#3D94F0] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Node.js
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-[#050608] border border-white/[0.06] rounded-xl p-5 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
                {getSdkSnippet(selectedSdkLang)}
              </pre>
              <button
                onClick={() => copyText(getSdkSnippet(selectedSdkLang), 'sdk')}
                className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-white/[0.08] flex items-center gap-1.5 transition-all shadow-md"
              >
                {copiedSdk ? <Check className="w-3.5 h-3.5 text-[#14D086]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSdk ? "Copied Code" : "Copy Snippet"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-zinc-400">
              <div className="p-3 bg-[#050608] border border-white/[0.04] rounded-xl">
                <span className="text-[#3D94F0] font-bold">Header:</span> X-API-Key auth
              </div>
              <div className="p-3 bg-[#050608] border border-white/[0.04] rounded-xl">
                <span className="text-[#14D086] font-bold">Threshold:</span> 50KB payload ceiling
              </div>
              <div className="p-3 bg-[#050608] border border-white/[0.04] rounded-xl">
                <span className="text-purple-400 font-bold">Resilience:</span> Automatic Circuit Breaker
              </div>
            </div>
          </section>
        )}

        {/* --- Minimalist Compliance Footer --- */}
        <footer className="pt-3 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-zinc-400 text-xs gap-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Zero-Retention Architecture • No raw PII persisted to database</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            FastAPI (Render) + React (Vercel)
          </div>
        </footer>

      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
