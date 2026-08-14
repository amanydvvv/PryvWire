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
  ArrowUpRight, 
  RefreshCw, 
  Lock, 
  Activity,
  Code2,
  Sliders,
  AlertCircle,
  Cpu,
  Layers,
  Database
} from 'lucide-react'

const API_BASE_URL = 'https://pryvwire.onrender.com';

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
        <div className="min-h-[100dvh] bg-[#06070a] text-zinc-100 flex items-center justify-center p-6">
          <div className="p-2 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] shadow-2xl max-w-md w-full">
            <div className="bg-[#0b0c10] border border-white/[0.06] rounded-[calc(2rem-0.5rem)] p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
              <AlertCircle className="w-9 h-9 text-rose-400 mx-auto mb-3" />
              <h2 className="text-base font-semibold text-zinc-100 mb-1">Application Exception</h2>
              <p className="text-zinc-400 text-xs font-mono mb-4">{this.state.error?.toString()}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-full text-xs font-medium transition-colors border border-white/10"
              >
                Reload Interface
              </button>
            </div>
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
    const duration = 500;
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

  // Color-coded entity badges with tactile spring
  const renderHighlightedText = (text) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');
        
        let colorClass = "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
        if (entity === "PERSON") colorClass = "bg-amber-500/10 text-amber-300 border-amber-500/30";
        if (entity === "EMAIL_ADDRESS") colorClass = "bg-sky-500/10 text-sky-300 border-sky-500/30";
        if (entity === "PHONE_NUMBER") colorClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
        if (entity === "US_SSN" || entity === "CREDIT_CARD") colorClass = "bg-rose-500/10 text-rose-300 border-rose-500/30";

        return (
          <motion.span 
            key={index}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className={`inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full border font-semibold mx-1 shadow-sm ${colorClass}`}
          >
            <Lock className="w-2.5 h-2.5 opacity-70" />
            {entity}
          </motion.span>
        );
      }
      return part;
    });
  };

  const isHealthy = healthStatus && healthStatus.status === "Secure and Operational";

  return (
    <div className="min-h-[100dvh] bg-[#06070a] text-zinc-100 antialiased font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden flex flex-col items-center justify-between">
      
      {/* Background Ambient Radial Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-indigo-500/12 via-violet-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite">
        {loading ? "Sanitizing payload..." : result ? `Sanitization complete. ${result.metrics.threats_intercepted} threats intercepted.` : error ? `Error: ${error}` : "Ready"}
      </div>

      <div className="w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">

        {/* --- Fluid Island Header --- */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                  Pryv<span className="text-indigo-400">Wire</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                  v1.0-prod
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium tracking-tight">Zero-Retention PII Sanitization Gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/[0.08] shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-[11px] font-semibold text-zinc-300">
                {isHealthy ? 'Gateway Active' : healthStatus ? 'Degraded Mode' : 'Connecting...'}
              </span>
            </div>

            <a 
              href={`${API_BASE_URL}/docs`}
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-mono text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.2] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              API Docs
            </a>
          </div>
        </header>

        {/* --- Asymmetrical Bento Stat Cards (Double-Bezel Architecture) --- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          
          {/* Card 1: Threats Blocked */}
          <div className="p-1 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/30 transition-all duration-300 shadow-xl">
            <div className="bg-[#0b0c10] border border-white/[0.04] rounded-[calc(1.5rem-0.25rem)] p-4 flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-semibold tracking-wider uppercase">Threats Intercepted</span>
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                <AnimatedCounter value={result ? result.metrics.threats_intercepted : metrics.total_threats_blocked} />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-1">Zero PII Leaked</span>
            </div>
          </div>

          {/* Card 2: Pipeline Latency */}
          <div className="p-1 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.07] hover:border-amber-500/30 transition-all duration-300 shadow-xl">
            <div className="bg-[#0b0c10] border border-white/[0.04] rounded-[calc(1.5rem-0.25rem)] p-4 flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-semibold tracking-wider uppercase">Pipeline Latency</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                <AnimatedCounter 
                  value={result ? result.metrics.processing_time_ms : Math.round(metrics.avg_processing_time_ms)} 
                  suffix="ms" 
                />
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1">Sub-50ms NER Target</span>
            </div>
          </div>

          {/* Card 3: Total Requests */}
          <div className="p-1 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.07] hover:border-emerald-500/30 transition-all duration-300 shadow-xl">
            <div className="bg-[#0b0c10] border border-white/[0.04] rounded-[calc(1.5rem-0.25rem)] p-4 flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-semibold tracking-wider uppercase">Audit Requests</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                <AnimatedCounter value={metrics.total_requests} />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-1">Async Non-Blocking</span>
            </div>
          </div>

          {/* Card 4: Model Engine */}
          <div className="p-1 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.07] hover:border-purple-500/30 transition-all duration-300 shadow-xl">
            <div className="bg-[#0b0c10] border border-white/[0.04] rounded-[calc(1.5rem-0.25rem)] p-4 flex flex-col justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-semibold tracking-wider uppercase">LLM Engine</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-base font-semibold font-mono text-white truncate">
                llama-3.1-8b
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-1">Groq LPUs • Isolated</span>
            </div>
          </div>

        </section>

        {/* --- Quick Scenario Presets --- */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-zinc-400 scrollbar-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
            <Sliders className="w-3 h-3" /> Quick Presets:
          </span>
          {PRESETS.map((preset, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              onClick={() => {
                setPrompt(preset.text);
                setResult(null);
                setError(null);
              }}
              className="px-3.5 py-1.5 rounded-full bg-zinc-900/70 hover:bg-zinc-800 border border-white/[0.08] hover:border-indigo-500/40 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </motion.button>
          ))}
        </div>

        {/* --- Main Interactive Console Grid --- */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Input Payload Editor (Double Bezel) */}
          <section className="lg:col-span-5 p-1 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] shadow-2xl">
            <div className="bg-[#0b0c10] border border-white/[0.04] rounded-[calc(2rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  Inbound Payload
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {prompt.length} / 50,000 bytes
                </span>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter prompt containing personal identifiers (e.g. Names, SSNs, Emails, Phone Numbers, Credit Cards)..."
                  rows={9}
                  className="w-full bg-[#07080b] text-zinc-200 placeholder-zinc-400 text-xs sm:text-sm font-mono rounded-xl p-4 border border-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Nested CTA Button-in-Button Architecture */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                onClick={handleSanitize}
                disabled={loading || !prompt.trim()}
                className={`group w-full py-2.5 pl-5 pr-2.5 rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-between shadow-lg ${
                  loading || !prompt.trim()
                    ? 'bg-zinc-800/40 text-zinc-400 border border-white/[0.04] cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25 ring-1 ring-white/20'
                }`}
              >
                <span className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white/80" />
                      <span>Sanitizing & Routing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sanitize & Dispatch to LLM</span>
                    </>
                  )}
                </span>

                {/* Button-in-Button nested icon pill */}
                <span className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </span>
              </motion.button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>
          </section>

          {/* Right Column: Sanitized Stream & LLM Reasoning */}
          <section className="lg:col-span-7 flex flex-col gap-5">

            {/* Stage 1: Sanitized Vector */}
            <div className="p-1 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] shadow-2xl">
              <div className="bg-[#0b0c10] border border-white/[0.04] rounded-[calc(2rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Sanitized Vector (Dispatched to Groq)
                    </h3>
                  </div>

                  {result && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyText(result.sanitized_prompt, 'prompt')}
                      className="px-3 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-white/[0.08] text-zinc-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedPrompt ? "Copied" : "Copy"}
                    </motion.button>
                  )}
                </div>

                <div className="bg-[#07080b] border border-white/[0.06] rounded-xl p-4 font-mono text-xs sm:text-sm text-zinc-300 min-h-[90px] leading-relaxed flex items-center">
                  {loading ? (
                    <div className="w-full space-y-2 animate-pulse">
                      <div className="h-3.5 bg-zinc-800/60 rounded-md w-3/4"></div>
                      <div className="h-3.5 bg-zinc-800/60 rounded-md w-1/2"></div>
                    </div>
                  ) : result ? (
                    <div className="w-full break-words">
                      {renderHighlightedText(result.sanitized_prompt)}
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic text-xs">
                      Payload will appear here with redacted PII tokens once sanitized...
                    </span>
                  )}
                </div>

                {result && (
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-400 pt-2 border-t border-white/[0.04]">
                    <span className="font-mono text-indigo-400 font-semibold">
                      {result.metrics.threats_intercepted} threats intercepted:
                    </span>
                    {result.metrics.entities_blocked.map((e, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-zinc-800/80 border border-white/5 text-zinc-300 font-mono text-[10px]">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stage 2: Groq LLaMA 3.1 Inference Output */}
            <div className="p-1 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] shadow-2xl">
              <div className="bg-[#0b0c10] border border-white/[0.04] rounded-[calc(2rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Groq LLaMA 3.1 Response (Safe Inference)
                    </h3>
                  </div>

                  {result && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyText(result.llm_response, 'response')}
                      className="px-3 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-white/[0.08] text-zinc-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                    >
                      {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedResponse ? "Copied" : "Copy"}
                    </motion.button>
                  )}
                </div>

                <div className="bg-[#07080b] border border-white/[0.06] rounded-xl p-4 font-mono text-xs sm:text-sm text-zinc-200 min-h-[120px] max-h-[220px] overflow-y-auto leading-relaxed">
                  {loading ? (
                    <div className="w-full space-y-2 animate-pulse">
                      <div className="h-3.5 bg-zinc-800/60 rounded-md w-full"></div>
                      <div className="h-3.5 bg-zinc-800/60 rounded-md w-4/5"></div>
                      <div className="h-3.5 bg-zinc-800/60 rounded-md w-2/3"></div>
                    </div>
                  ) : displayedLlmResponse ? (
                    <div className="whitespace-pre-wrap">{displayedLlmResponse}</div>
                  ) : (
                    <span className="text-zinc-400 italic text-xs">
                      LLM response from Groq LLaMA 3.1 will stream here...
                    </span>
                  )}
                </div>
              </div>
            </div>

          </section>

        </main>

        {/* --- Bottom Compliance Footer --- */}
        <footer className="pt-4 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between text-zinc-400 text-xs gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Zero-Retention Architecture • No raw PII persisted to database</span>
          </div>
          <div className="font-mono text-[11px] text-zinc-400 flex items-center gap-2">
            <span>FastAPI (Render)</span>
            <span>•</span>
            <span>React + Vite (Vercel)</span>
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
