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
  Radio,
  FileCode,
  Fingerprint
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
    label: "Executive Wire & PAN",
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
        <div className="min-h-screen bg-[#0e0e11] text-zinc-100 flex items-center justify-center p-6">
          <div className="bg-[#1c1c1f] border border-white/[0.1] rounded-2xl p-6 text-center max-w-md w-full shadow-2xl">
            <AlertCircle className="w-8 h-8 text-[#fa2d48] mx-auto mb-3" />
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

// Apple-style Animated Number Counter
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

function MainApp() {
  const [prompt, setPrompt] = useState(PRESETS[0].text)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)
  const [copiedSdk, setCopiedSdk] = useState(false)
  
  // Navigation & Views
  const [activeTab, setActiveTab] = useState('gateway') // 'gateway' | 'diff' | 'sdk'
  const [inspectionView, setInspectionView] = useState('stream') // 'stream' | 'diff' | 'json'
  const [selectedSdkLang, setSelectedSdkLang] = useState('python')

  // Telemetry & Health State
  const [metrics, setMetrics] = useState({
    total_requests: 0,
    total_threats_blocked: 0,
    avg_processing_time_ms: 0,
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

  const handleSanitize = async (customPrompt) => {
    const textToSanitize = typeof customPrompt === 'string' ? customPrompt : prompt;
    if (!textToSanitize.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sanitize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'pryvwire-demo-secret-key'
        },
        body: JSON.stringify({ user_prompt: textToSanitize, client_id: 'pryvwire-web' })
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
          throw new Error(data.detail || 'Security Gateway Blocked Request');
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

  // Apple Dark Coral-Red Redacted Entity Badges
  const renderHighlightedText = (text, isDiff = false) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');
        
        let colorClass = "bg-[#fa2d48]/15 text-[#ff4b60] border-[#fa2d48]/30";
        let glyph = "◈";
        if (entity === "PERSON") {
          colorClass = "bg-amber-500/15 text-amber-300 border-amber-500/30";
          glyph = "◈";
        } else if (entity === "EMAIL_ADDRESS") {
          colorClass = "bg-sky-500/15 text-sky-300 border-sky-500/30";
          glyph = "◬";
        } else if (entity === "PHONE_NUMBER") {
          colorClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
          glyph = "▣";
        } else if (entity === "US_SSN" || entity === "CREDIT_CARD") {
          colorClass = "bg-[#fa2d48]/20 text-[#ff4b60] border-[#fa2d48]/40";
          glyph = "◬";
        }

        return (
          <span 
            key={index}
            className={`inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full border font-semibold mx-1 shadow-sm ${colorClass}`}
          >
            <span className="text-[9px] opacity-75">{glyph}</span>
            <span>{entity}</span>
          </span>
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

  // SDK Drop-in Snippet Generator
  const getSdkSnippet = (lang) => {
    if (lang === 'python') {
      return `import requests

# PryvWire Zero-Retention Security Gateway Client
url = "${API_BASE_URL}/api/v1/sanitize"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-pryvwire-api-key"
}
payload = {
    "user_prompt": "${prompt.trim() ? prompt.replace(/"/g, '\\"') : 'Authorize wire for John Doe (SSN: 000-11-2222)'}",
    "client_id": "production-backend"
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
    "client_id": "curl-client"
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
    <div className="min-h-screen bg-[#0e0e11] text-[#f5f5f7] flex flex-col antialiased selection:bg-[#fa2d48]/30 selection:text-white relative justify-between">
      
      {/* Ambient Crimson/Coral Top Lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-[#fa2d48]/12 via-[#fa2d48]/3 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite">
        {loading ? "Sanitizing payload..." : result ? `Sanitization complete. ${result.metrics.threats_intercepted} threats intercepted.` : error ? `Error: ${error}` : "Ready"}
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">

        {/* --- Apple Dark Navigation Header --- */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1c1c1f] border border-white/[0.1] flex items-center justify-center text-[#fa2d48] font-bold shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  PryvWire
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.08]">
                  v1.0-prod
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Zero-Retention Security Gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            
            {/* View Tabs */}
            <div className="flex items-center bg-[#1c1c1f] p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('gateway')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'gateway' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ◈ Gateway Studio
              </button>
              <button
                onClick={() => setActiveTab('sdk')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'sdk' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⚙️ Developer SDK
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c1f] border border-white/[0.08]">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-[#14D086]' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? 'bg-[#14D086]' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-medium text-zinc-300">
                {isHealthy ? 'Gateway Operational' : healthStatus ? 'Degraded' : 'Connecting...'}
              </span>
            </div>

            <a 
              href={`${API_BASE_URL}/docs`}
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-white px-3 py-1.5 rounded-full bg-[#1c1c1f] hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.2] transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Swagger</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

          </div>

        </header>

        {/* --- High-Contrast Telemetry Console (Apple Dark Palette) --- */}
        <section className="bg-[#1c1c1f] border border-white/[0.08] rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] shadow-lg">
          
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-medium">Threats Intercepted</span>
              <ShieldAlert className="w-4 h-4 text-[#fa2d48]" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              <AnimatedCounter value={result ? result.metrics.threats_intercepted : metrics.total_threats_blocked} />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">◈ Zero PII Leaked</span>
          </div>

          <div className="flex flex-col justify-between md:pl-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-medium">Pipeline Latency</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              <AnimatedCounter 
                value={result ? result.metrics.processing_time_ms : Math.round(metrics.avg_processing_time_ms)} 
                suffix=" ms" 
              />
            </div>
            <span className="text-[10px] text-[#14D086] font-mono mt-0.5">◬ Sub-50ms Target</span>
          </div>

          <div className="flex flex-col justify-between md:pl-4 pt-3 md:pt-0">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-medium">Audit Telemetry</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              <AnimatedCounter value={metrics.total_requests} />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">▣ Async Non-Blocking</span>
          </div>

          <div className="flex flex-col justify-between md:pl-4 pt-3 md:pt-0">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-medium">Inference Engine</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-semibold font-mono text-white truncate">
              llama-3.1-8b-instant
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Groq LPU Isolated</span>
          </div>

        </section>

        {/* --- MAIN VIEW 1: GATEWAY STUDIO --- */}
        {activeTab === 'gateway' && (
          <div className="flex flex-col gap-6">
            
            {/* Quick Test Vectors Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Test Vectors:
              </span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setPrompt(preset.text);
                    handleSanitize(preset.text);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#1c1c1f] hover:bg-zinc-800 border border-white/[0.08] hover:border-[#fa2d48]/50 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-2 shrink-0 shadow-sm"
                >
                  <span>{preset.icon}</span>
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-[9px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04]">
                    {preset.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Main Interactive Studio Grid */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left Column: Raw Payload Editor */}
              <section className="lg:col-span-5 bg-[#1c1c1f] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#fa2d48]" />
                    Inbound Ingestion Payload
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {prompt.length} / 50,000 bytes
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter or paste text containing sensitive identifiers (Names, SSNs, Credit Cards, Emails, Phone Numbers)..."
                    rows={9}
                    className="w-full bg-[#141416] text-zinc-200 placeholder-zinc-500 text-xs font-mono rounded-xl p-4 border border-white/[0.06] focus:border-[#fa2d48]/60 focus:outline-none transition-all resize-none leading-relaxed"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#fa2d48]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Presidio NLP Interception Active...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Action Button (Apple Coral-Crimson) */}
                <button
                  onClick={() => handleSanitize()}
                  disabled={loading || !prompt.trim()}
                  className={`w-full py-3 px-5 rounded-xl font-semibold text-xs tracking-tight transition-all flex items-center justify-center gap-2 shadow-lg ${
                    loading || !prompt.trim()
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-[#fa2d48] hover:bg-[#e0263f] text-white shadow-[#fa2d48]/25 active:scale-[0.985]'
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
              </section>

              {/* Right Column: Output Stream & LLM Reasoning */}
              <section className="lg:col-span-7 flex flex-col gap-4">

                {/* Inspection Console */}
                <div className="bg-[#1c1c1f] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 shadow-xl">
                  
                  {/* Tab Navigation Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#fa2d48]" />
                      <h3 className="text-xs font-semibold text-white tracking-tight">
                        Dispatched Vector (Safe Payload)
                      </h3>
                    </div>

                    <div className="flex items-center bg-[#141416] p-0.5 rounded-lg border border-white/[0.08]">
                      <button
                        onClick={() => setInspectionView('stream')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          inspectionView === 'stream' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        ◈ Stream View
                      </button>

                      <button
                        onClick={() => setInspectionView('diff')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          inspectionView === 'diff' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        ◬ Token Diff
                      </button>

                      <button
                        onClick={() => setInspectionView('json')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          inspectionView === 'json' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        ▣ Audit JSON
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Stream View */}
                  {inspectionView === 'stream' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[11px] text-zinc-400">
                        <span>Dispatched to external LLM without sensitive tokens:</span>
                        {result && (
                          <button
                            onClick={() => copyText(result.sanitized_prompt, 'prompt')}
                            className="px-2.5 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                          >
                            {copiedPrompt ? <Check className="w-2.5 h-2.5 text-[#14D086]" /> : <Copy className="w-2.5 h-2.5" />}
                            {copiedPrompt ? "Copied" : "Copy Vector"}
                          </button>
                        )}
                      </div>

                      <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-4 font-mono text-xs text-zinc-200 min-h-[85px] leading-relaxed flex items-center">
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
                          <span className="text-zinc-500 italic text-xs">
                            Sanitized payload with redacted tokens will appear here...
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Side-by-Side Diff Inspector */}
                  {inspectionView === 'diff' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
                          ◈ Pre-Sanitization Stream
                        </span>
                        <div className="bg-[#141416] border border-rose-500/20 rounded-xl p-3 font-mono text-xs text-rose-200/90 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed">
                          {result ? result.original_prompt : prompt}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-[#14D086] font-semibold uppercase">
                          ◬ Masked Vector (Dispatched)
                        </span>
                        <div className="bg-[#141416] border border-emerald-500/20 rounded-xl p-3 font-mono text-xs text-emerald-200/90 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed">
                          {result ? renderHighlightedText(result.sanitized_prompt, true) : "Awaiting dispatch..."}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Raw Audit JSON */}
                  {inspectionView === 'json' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                        <span>Structured Telemetry Audit Record:</span>
                        {result && (
                          <button
                            onClick={() => copyText(JSON.stringify(result, null, 2), 'prompt')}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1"
                          >
                            {copiedPrompt ? "Copied" : "Copy JSON"}
                          </button>
                        )}
                      </div>
                      <pre className="bg-[#141416] border border-white/[0.06] rounded-xl p-3.5 font-mono text-[11px] text-zinc-300 max-h-[140px] overflow-y-auto leading-normal">
                        {JSON.stringify(result || { status: "ready", model: "llama-3.1-8b", zero_retention: true }, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Granular Latency Breakdown Waterfall Bar */}
                  {result && (
                    <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">Microsecond SLA Breakdown:</span>
                        <span className="text-zinc-300 font-medium">{result.metrics.processing_time_ms} ms</span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#141416] flex overflow-hidden border border-white/[0.06]">
                        <div style={{ width: `${nerPct}%` }} className="h-full bg-sky-400" title={`NER: ${breakdown.ner_analyzer_ms}ms`} />
                        <div style={{ width: `${anonPct}%` }} className="h-full bg-amber-400" title={`Anonymizer: ${breakdown.anonymizer_ms}ms`} />
                        <div style={{ width: `${llmPct}%` }} className="h-full bg-[#fa2d48]" title={`Groq: ${breakdown.llm_inference_ms}ms`} />
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
                        <span className="text-sky-300">NER: {breakdown.ner_analyzer_ms}ms</span>
                        <span className="text-amber-300">Anonymizer: {breakdown.anonymizer_ms}ms</span>
                        <span className="text-[#ff4b60]">Groq LPU: {breakdown.llm_inference_ms}ms</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Stage 2: Groq LLaMA 3.1 Synthesis */}
                <div className="bg-[#1c1c1f] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <h3 className="text-xs font-semibold text-white tracking-tight">
                        Groq LLaMA 3.1 Synthesis (Safe Inference)
                      </h3>
                    </div>

                    {result && (
                      <button
                        onClick={() => copyText(result.llm_response, 'response')}
                        className="px-2.5 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        {copiedResponse ? <Check className="w-2.5 h-2.5 text-[#14D086]" /> : <Copy className="w-2.5 h-2.5" />}
                        {copiedResponse ? "Copied" : "Copy Output"}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-4 font-mono text-xs text-zinc-200 min-h-[100px] max-h-[190px] overflow-y-auto leading-relaxed">
                    {loading ? (
                      <div className="w-full space-y-2 animate-pulse">
                        <div className="h-3 bg-zinc-800 rounded w-full"></div>
                        <div className="h-3 bg-zinc-800 rounded w-4/5"></div>
                        <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                      </div>
                    ) : displayedLlmResponse ? (
                      <div className="whitespace-pre-wrap">{displayedLlmResponse}</div>
                    ) : (
                      <span className="text-zinc-500 italic text-xs">
                        Inference output from Groq will stream here...
                      </span>
                    )}
                  </div>
                </div>

              </section>

            </main>

          </div>
        )}

        {/* --- MAIN VIEW 2: DEVELOPER SDK DROPDOWN --- */}
        {activeTab === 'sdk' && (
          <section className="bg-[#1c1c1f] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#fa2d48]" />
                  <span>Developer Drop-In SDK Integration</span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Route your existing application LLM calls through PryvWire with zero infrastructure overhead.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center bg-[#141416] p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setSelectedSdkLang('python')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedSdkLang === 'python' ? 'bg-[#fa2d48] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSelectedSdkLang('curl')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedSdkLang === 'curl' ? 'bg-[#fa2d48] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setSelectedSdkLang('node')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedSdkLang === 'node' ? 'bg-[#fa2d48] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Node.js
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-[#141416] border border-white/[0.06] rounded-xl p-5 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
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
              <div className="p-3 bg-[#141416] border border-white/[0.04] rounded-xl">
                <span className="text-[#fa2d48] font-bold">Header:</span> X-API-Key auth
              </div>
              <div className="p-3 bg-[#141416] border border-white/[0.04] rounded-xl">
                <span className="text-[#14D086] font-bold">Threshold:</span> 50KB payload ceiling
              </div>
              <div className="p-3 bg-[#141416] border border-white/[0.04] rounded-xl">
                <span className="text-purple-400 font-bold">Resilience:</span> Automatic Circuit Breaker
              </div>
            </div>
          </section>
        )}

        {/* --- Minimalist Compliance Footer --- */}
        <footer className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-xs gap-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Zero-Retention Architecture • No raw PII persisted to database</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-500">
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
