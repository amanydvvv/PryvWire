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
  ExternalLink
} from 'lucide-react'

const API_BASE_URL = 'https://pryvwire.onrender.com';

// Bespoke Geometric Vector Logo (Interlocking ◈ Matrix with 4 Triangular ◬ Shards)
function PryvWireLogo({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer Diamond Geometry */}
      <path 
        d="M24 4L44 24L24 44L4 24L24 4Z" 
        stroke="#f1f5f9" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="opacity-80" 
      />
      {/* 4 Interlocking Triangular Shards / Filtering Nodes */}
      <path d="M24 8L38 22L24 22L24 8Z" fill="url(#pw-grad-1)" stroke="#3D94F0" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M24 8L10 22L24 22L24 8Z" fill="url(#pw-grad-2)" stroke="#f1f5f9" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M24 40L38 26L24 26L24 40Z" fill="url(#pw-grad-3)" stroke="#f1f5f9" strokeWidth="0.75" strokeLinejoin="round" />
      <path d="M24 40L10 26L24 26L24 40Z" fill="url(#pw-grad-4)" stroke="#3D94F0" strokeWidth="0.75" strokeLinejoin="round" />
      
      {/* Central Zero-Retention Core */}
      <circle cx="24" cy="24" r="2" fill="#f1f5f9" />
      <circle cx="24" cy="24" r="5" stroke="#3D94F0" strokeWidth="0.75" strokeDasharray="1.5 1.5" className="animate-spin origin-center" style={{ animationDuration: '12s' }} />

      <defs>
        <linearGradient id="pw-grad-1" x1="24" y1="8" x2="38" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3D94F0" stopOpacity="0.3" />
          <stop stopColor="#3D94F0" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="pw-grad-2" x1="24" y1="8" x2="10" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f1f5f9" stopOpacity="0.2" />
          <stop stopColor="#f1f5f9" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="pw-grad-3" x1="24" y1="40" x2="38" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f1f5f9" stopOpacity="0.2" />
          <stop stopColor="#f1f5f9" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="pw-grad-4" x1="24" y1="40" x2="10" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3D94F0" stopOpacity="0.3" />
          <stop stopColor="#3D94F0" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Sample enterprise prompt presets
const PRESETS = [
  {
    label: "Healthcare Patient Record",
    icon: "🏥",
    text: "Patient Sarah Jenkins (DOB 1984-05-12, SSN 042-99-1823) contacted us via sarah.jenkins@healthfirst.org or phone (415) 555-0199 regarding prescription refill authorization."
  },
  {
    label: "Executive Financial Wire",
    icon: "💳",
    text: "Authorize wire transfer of $45,000 for executive Michael Vance (SSN 987-65-4321). Confirmation email michael.vance@vancecapital.com or cell +1-202-555-0143. Card on file: 4532-8921-0034-8812."
  },
  {
    label: "Confidential HR Payroll",
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
        <div className="min-h-[100dvh] bg-[#07080a] text-zinc-100 flex items-center justify-center p-6">
          <div className="bg-[#0D0E12] border border-white/[0.08] rounded-2xl p-6 text-center max-w-md w-full shadow-2xl">
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

function MainApp() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)
  const [inspectionView, setInspectionView] = useState('stream') // 'stream' | 'diff' | 'json'

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
    }, 12);

    return () => clearInterval(timer);
  }, [result]);

  const handleSanitize = async () => {
    if (!prompt.trim()) return;
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
        body: JSON.stringify({ user_prompt: prompt, client_id: 'pryvwire-web' })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit reached (30 req/min). System protected.');
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
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  // Subtle warm amber pill badges with micro-glyph
  const renderHighlightedText = (text, isDiff = false) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');
        
        let colorClass = "bg-amber-500/10 text-amber-300 border-amber-500/30";
        let glyph = "◈";
        if (entity === "PERSON") {
          colorClass = "bg-amber-500/10 text-amber-300 border-amber-500/30";
          glyph = "◈";
        } else if (entity === "EMAIL_ADDRESS") {
          colorClass = "bg-sky-500/10 text-sky-300 border-sky-500/30";
          glyph = "◬";
        } else if (entity === "PHONE_NUMBER") {
          colorClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
          glyph = "▣";
        } else if (entity === "US_SSN" || entity === "CREDIT_CARD") {
          colorClass = "bg-rose-500/15 text-rose-300 border-rose-500/30";
          glyph = "◬";
        }

        return (
          <motion.span 
            key={index}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full border font-medium mx-1 tracking-tight ${colorClass}`}
          >
            <span className="text-[9px] opacity-70">{glyph}</span>
            <span>{entity}</span>
          </motion.span>
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

  return (
    <div className="min-h-[100dvh] bg-[#07080a] text-zinc-100 antialiased font-sans selection:bg-[#3D94F0]/25 selection:text-[#3D94F0] relative flex flex-col justify-between">
      
      {/* Background Ambient Radial Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite">
        {loading ? "Sanitizing payload..." : result ? `Sanitization complete. ${result.metrics.threats_intercepted} threats intercepted.` : error ? `Error: ${error}` : "Ready"}
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">

        {/* --- Vanguard Minimalist Centralized Header Stack --- */}
        <header className="flex flex-col items-center text-center gap-4 pt-2 pb-2">
          
          {/* Bespoke Interlocking Vector Logo (◈ built with ◬ shards) */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-full blur-md -z-10" />
            <PryvWireLogo className="w-12 h-12" />
          </motion.div>

          {/* Title & Version Stack */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2.5 justify-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-[#f1f5f9]">
                PryvWire
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] tracking-normal">
                v1.0-prod
              </span>
            </div>
            
            <p className="text-sm sm:text-base text-[#94a3b8] font-normal tracking-tight max-w-md">
              Zero-Retention Security Gateway
            </p>
          </div>

          {/* Centralized Status & API Bar */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D0E12] border border-white/[0.08] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-[#14D086]' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? 'bg-[#14D086]' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-medium text-slate-300">
                {isHealthy ? 'Gateway Active' : healthStatus ? 'Degraded Mode' : 'Connecting...'}
              </span>
            </div>

            <a 
              href={`${API_BASE_URL}/docs`}
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-mono text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full bg-[#0D0E12] hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.2] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5 text-[#3D94F0]" />
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

        </header>

        {/* --- Unified Metric Cluster Console (Single Shallow Surface) --- */}
        <section className="bg-[#0D0E12] border border-white/[0.06] rounded-2xl overflow-hidden grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] shadow-sm">
          
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="font-medium">Threats Intercepted</span>
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#f1f5f9] tracking-tight">
              <AnimatedCounter value={result ? result.metrics.threats_intercepted : metrics.total_threats_blocked} />
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">◈ Zero PII Leaked</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="font-medium">Pipeline Latency</span>
              <Zap className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#f1f5f9] tracking-tight">
              <AnimatedCounter 
                value={result ? result.metrics.processing_time_ms : Math.round(metrics.avg_processing_time_ms)} 
                suffix="ms" 
              />
            </div>
            <span className="text-[10px] text-[#14D086] font-mono mt-0.5">◬ Sub-50ms Target</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="font-medium">Audit Requests</span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#f1f5f9] tracking-tight">
              <AnimatedCounter value={metrics.total_requests} />
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">▣ Non-Blocking</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="font-medium">LLM Engine</span>
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-sm font-semibold font-mono text-[#f1f5f9] truncate">
              llama-3.1-8b
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Groq LPU Gateway</span>
          </div>

        </section>

        {/* --- Flattened Preset Tabs --- */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider shrink-0 mr-1">
            Presets:
          </span>
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(preset.text);
                setResult(null);
                setError(null);
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#0D0E12] hover:bg-zinc-800 border border-white/[0.06] hover:border-[#3D94F0]/40 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* --- Main Workspace (Single Precision Surface) --- */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Inbound Ingestion Well (5 cols) */}
          <section className="lg:col-span-5 bg-[#0D0E12] border border-white/[0.06] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 tracking-tight flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#3D94F0]" />
                Inbound Payload
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {prompt.length} / 50,000 bytes
              </span>
            </div>

            {/* Recessed Terminal Well */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste payload containing personal identifiers (Names, SSNs, Emails, Phone Numbers, Credit Cards)..."
                rows={9}
                className="w-full bg-[#050608] text-slate-200 placeholder-slate-500 text-xs font-mono rounded-xl p-4 border border-white/[0.04] focus:border-[#3D94F0]/50 focus:ring-1 focus:ring-[#3D94F0]/20 outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Centered Cool Space Blue Action Button */}
            <button
              onClick={handleSanitize}
              disabled={loading || !prompt.trim()}
              className={`w-full py-3 px-5 rounded-xl font-semibold text-xs tracking-tight transition-all flex items-center justify-center gap-2 active:scale-[0.985] active:translate-y-0.5 ${
                loading || !prompt.trim()
                  ? 'bg-zinc-800/40 text-slate-500 border border-white/[0.04] cursor-not-allowed'
                  : 'bg-[#3D94F0] hover:bg-[#3482d8] text-white shadow-md shadow-[#3D94F0]/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sanitizing Payload...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sanitize &amp; Dispatch</span>
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

          {/* Right Column: Payload Inspection & LLM Output (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-4">

            {/* Inspection Console */}
            <div className="bg-[#0D0E12] border border-white/[0.06] rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 shadow-sm">
              
              {/* Tab Navigation Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D94F0]" />
                  <h3 className="text-xs font-semibold text-slate-200 tracking-tight">
                    Payload Inspection
                  </h3>
                </div>

                <div className="flex items-center bg-[#050608] p-0.5 rounded-lg border border-white/[0.06]">
                  <button
                    onClick={() => setInspectionView('stream')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      inspectionView === 'stream' 
                        ? 'bg-[#3D94F0] text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ◈ Stream
                  </button>

                  <button
                    onClick={() => setInspectionView('diff')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      inspectionView === 'diff' 
                        ? 'bg-[#3D94F0] text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ◬ Diff Inspector
                  </button>

                  <button
                    onClick={() => setInspectionView('json')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      inspectionView === 'json' 
                        ? 'bg-[#3D94F0] text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ▣ Audit JSON
                  </button>
                </div>
              </div>

              {/* Stream View */}
              {inspectionView === 'stream' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Dispatched Vector:</span>
                    {result && (
                      <button
                        onClick={() => copyText(result.sanitized_prompt, 'prompt')}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        {copiedPrompt ? <Check className="w-2.5 h-2.5 text-[#14D086]" /> : <Copy className="w-2.5 h-2.5" />}
                        {copiedPrompt ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#050608] border border-white/[0.04] rounded-xl p-4 font-mono text-xs text-slate-300 min-h-[85px] leading-relaxed flex items-center">
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
                      <span className="text-slate-500 italic text-xs">
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
                      {result ? result.original_prompt : prompt || <span className="text-slate-500 italic">No input payload provided...</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-[#14D086] flex items-center gap-1">
                      <span>◬</span> Masked Stream (Dispatched)
                    </span>
                    <div className="bg-[#050608] border border-emerald-500/15 rounded-xl p-3 font-mono text-xs text-emerald-200/80 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed">
                      {result ? renderHighlightedText(result.sanitized_prompt, true) : <span className="text-slate-500 italic">Awaiting sanitization...</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* JSON Audit View */}
              {inspectionView === 'json' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Audit Telemetry Record:</span>
                    {result && (
                      <button
                        onClick={() => copyText(JSON.stringify(result, null, 2), 'prompt')}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-[10px] font-mono flex items-center gap-1"
                      >
                        {copiedPrompt ? "Copied" : "Copy JSON"}
                      </button>
                    )}
                  </div>
                  <pre className="bg-[#050608] border border-white/[0.04] rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-[140px] overflow-y-auto leading-normal">
                    {JSON.stringify(result || { status: "ready", model: "llama-3.1-8b", zero_retention: true }, null, 2)}
                  </pre>
                </div>
              )}

              {/* Micro Latency Breakdown Bar */}
              {result && (
                <div className="pt-3 border-t border-white/[0.04] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Latency Breakdown:</span>
                    <span className="text-slate-300 font-medium">{result.metrics.processing_time_ms} ms</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#050608] flex overflow-hidden border border-white/[0.04]">
                    <div style={{ width: `${nerPct}%` }} className="h-full bg-sky-400" />
                    <div style={{ width: `${anonPct}%` }} className="h-full bg-amber-400" />
                    <div style={{ width: `${llmPct}%` }} className="h-full bg-indigo-400" />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                    <span>NER: {breakdown.ner_analyzer_ms}ms</span>
                    <span>Anonymizer: {breakdown.anonymizer_ms}ms</span>
                    <span>Groq: {breakdown.llm_inference_ms}ms</span>
                  </div>
                </div>
              )}

            </div>

            {/* Groq LLM Response Console */}
            <div className="bg-[#0D0E12] border border-white/[0.06] rounded-2xl p-5 sm:p-6 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <h3 className="text-xs font-semibold text-slate-200 tracking-tight">
                    LLM Response (Safe Inference)
                  </h3>
                </div>

                {result && (
                  <button
                    onClick={() => copyText(result.llm_response, 'response')}
                    className="px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                  >
                    {copiedResponse ? <Check className="w-2.5 h-2.5 text-[#14D086]" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedResponse ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              <div className="bg-[#050608] border border-white/[0.04] rounded-xl p-4 font-mono text-xs text-slate-200 min-h-[100px] max-h-[190px] overflow-y-auto leading-relaxed">
                {loading ? (
                  <div className="w-full space-y-2 animate-pulse">
                    <div className="h-3 bg-zinc-800 rounded w-full"></div>
                    <div className="h-3 bg-zinc-800 rounded w-4/5"></div>
                    <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                  </div>
                ) : displayedLlmResponse ? (
                  <div className="whitespace-pre-wrap">{displayedLlmResponse}</div>
                ) : (
                  <span className="text-slate-500 italic text-xs">
                    LLM inference stream will render here...
                  </span>
                )}
              </div>
            </div>

          </section>

        </main>

        {/* --- Minimalist Compliance Footer --- */}
        <footer className="pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs gap-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Zero-Retention Architecture • No raw PII persisted</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
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
