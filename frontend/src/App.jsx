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
  Activity,
  Code2,
  AlertCircle,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react'

const API_BASE_URL = 'https://pryvwire.onrender.com';

// Sample enterprise prompt presets
const PRESETS = [
  {
    id: "healthcare",
    label: "Healthcare EHR",
    text: "Patient Sarah Jenkins (DOB 1984-05-12, SSN 042-99-1823) contacted us via sarah.jenkins@healthfirst.org or phone (415) 555-0199 regarding prescription refill authorization."
  },
  {
    id: "finance",
    label: "Executive Wire",
    text: "Authorize wire transfer of $45,000 for executive Michael Vance (SSN 987-65-4321). Confirmation email michael.vance@vancecapital.com or cell +1-202-555-0143. Card on file: 4532-8921-0034-8812."
  },
  {
    id: "hr",
    label: "Confidential Payroll",
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
        <div className="min-h-screen bg-[#090A0F] text-[#F8FAFC] flex items-center justify-center p-6">
          <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 text-center max-w-md w-full shadow-2xl">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-1">Application Exception</h2>
            <p className="text-[#94A3B8] text-xs font-mono mb-4">{this.state.error?.toString()}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[#F8FAFC] rounded-full text-xs font-medium transition-colors border border-white/10"
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
  
  // Inspection Tabs: 'stream' | 'diff' | 'json'
  const [inspectionTab, setInspectionTab] = useState('stream')

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
    }, 8);

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
          throw new Error('Payload too large. Exceeds 50KB threshold.');
        } else if (response.status === 401) {
          throw new Error('Unauthorized: Invalid API key.');
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
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  // Subtle warm amber pill badges with soft spring entry
  const renderHighlightedText = (text, isDiff = false) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');

        return (
          <motion.span 
            key={index}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium mx-1 tracking-tight shadow-sm"
          >
            <span className="text-[9px] opacity-70">◈</span>
            <span>{entity}</span>
          </motion.span>
        );
      }
      return part;
    });
  };

  const isHealthy = healthStatus && healthStatus.status === "Secure and Operational";

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F8FAFC] flex flex-col justify-between antialiased selection:bg-[#0A84FF]/30 selection:text-[#F8FAFC]">
      
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite">
        {loading ? "Sanitizing payload..." : result ? `Sanitization complete. ${result.metrics.threats_intercepted} threats intercepted.` : error ? `Error: ${error}` : "Ready"}
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">

        {/* --- Header --- */}
        <header className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
              PryvWire
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-[#94A3B8] bg-white/[0.04] border border-white/[0.08]">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111318] border border-white/[0.08]">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-[#34C759]' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? 'bg-[#34C759]' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-medium text-[#94A3B8]">
                {isHealthy ? 'Gateway Active' : healthStatus ? 'Degraded' : 'Connecting...'}
              </span>
            </div>

            <a 
              href={`${API_BASE_URL}/docs`}
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-mono text-[#94A3B8] hover:text-[#F8FAFC] px-3 py-1.5 rounded-full bg-[#111318] hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.2] transition-all flex items-center gap-1.5"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </header>

        {/* --- Metric Ribbon (Single 4-Segment Console) --- */}
        <section className="bg-[#111318] border border-white/[0.08] rounded-2xl overflow-hidden grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] shadow-sm">
          
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
              <span>Threats Intercepted</span>
              <ShieldAlert className="w-3.5 h-3.5 text-[#94A3B8]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC] tracking-tight">
              <AnimatedCounter value={result ? result.metrics.threats_intercepted : metrics.total_threats_blocked} />
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono mt-0.5">◈ Zero PII Leaked</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
              <span>Pipeline Latency</span>
              <Zap className="w-3.5 h-3.5 text-[#94A3B8]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC] tracking-tight">
              <AnimatedCounter 
                value={result ? result.metrics.processing_time_ms : Math.round(metrics.avg_processing_time_ms)} 
                suffix=" ms" 
              />
            </div>
            <span className="text-[10px] text-[#34C759] font-mono mt-0.5">◬ Sub-50ms SLA</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
              <span>Audit Requests</span>
              <Activity className="w-3.5 h-3.5 text-[#94A3B8]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F8FAFC] tracking-tight">
              <AnimatedCounter value={metrics.total_requests} />
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono mt-0.5">▣ Async Non-Blocking</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
              <span>LLM Engine</span>
              <Sparkles className="w-3.5 h-3.5 text-[#94A3B8]" />
            </div>
            <div className="text-sm font-semibold font-mono text-[#F8FAFC] truncate">
              llama-3.1-8b
            </div>
            <span className="text-[10px] text-[#94A3B8] font-mono mt-0.5">Groq LPU Gateway</span>
          </div>

        </section>

        {/* --- Test Presets Tabs --- */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[10px] uppercase font-semibold text-[#94A3B8] tracking-wider shrink-0 mr-1">
            Presets:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setPrompt(preset.text);
                setResult(null);
                setError(null);
              }}
              className="px-3 py-1 rounded-lg bg-[#111318] hover:bg-zinc-800 border border-white/[0.08] hover:border-[#0A84FF]/40 text-[#94A3B8] hover:text-[#F8FAFC] transition-all text-xs font-medium shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* --- Main 2-Column Workstation --- */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Inbound Ingestion Payload (5 cols) */}
          <section className="lg:col-span-5 bg-[#111318] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#F8FAFC] tracking-tight flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Inbound Ingestion Payload</span>
              </label>
              <span className="text-[11px] font-mono text-[#94A3B8]">
                {prompt.length} / 50,000 bytes
              </span>
            </div>

            {/* Recessed Monospace Terminal Well */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt containing sensitive identifiers (Names, SSNs, Credit Cards, Emails, Phone Numbers)..."
                rows={9}
                className="w-full bg-[#0A0C10] text-[#E2E8F0] placeholder-zinc-600 text-xs font-mono rounded-xl p-4 border border-white/[0.04] focus:border-[#0A84FF]/50 focus:ring-1 focus:ring-[#0A84FF]/20 outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Primary Action Button (Precision System Blue #0A84FF) */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSanitize()}
              disabled={loading || !prompt.trim()}
              className={`w-full py-3 px-5 rounded-xl font-semibold text-xs tracking-tight transition-all flex items-center justify-center gap-2 ${
                loading || !prompt.trim()
                  ? 'bg-zinc-800/40 text-zinc-600 border border-white/[0.04] cursor-not-allowed'
                  : 'bg-[#0A84FF] hover:bg-[#0071e3] text-white shadow-sm shadow-[#0A84FF]/20 active:scale-[0.98]'
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
            </motion.button>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
          </section>

          {/* Right Column: Sanitized Stream & Inspection (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-4">

            {/* Inspection Console */}
            <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 shadow-sm">
              
              {/* Tab Navigation Header with layoutId */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
                  <h3 className="text-xs font-semibold text-[#F8FAFC] tracking-tight">
                    Sanitized Stream &amp; Inspection
                  </h3>
                </div>

                <div className="flex items-center bg-[#0A0C10] p-1 rounded-lg border border-white/[0.06] relative">
                  {[
                    { key: 'stream', label: 'Sanitized Stream' },
                    { key: 'diff', label: 'Token Diff' },
                    { key: 'json', label: 'Raw JSON' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setInspectionTab(tab.key)}
                      className={`relative px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                        inspectionTab === tab.key 
                          ? 'text-white' 
                          : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {inspectionTab === tab.key && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-[#0A84FF] rounded-md -z-10 shadow-sm"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab 1: Sanitized Stream */}
              {inspectionTab === 'stream' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] text-[#94A3B8]">
                    <span>Dispatched Vector:</span>
                    {result && (
                      <button
                        onClick={() => copyText(result.sanitized_prompt, 'prompt')}
                        className="px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#E2E8F0] text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        {copiedPrompt ? <Check className="w-2.5 h-2.5 text-[#34C759]" /> : <Copy className="w-2.5 h-2.5" />}
                        {copiedPrompt ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#0A0C10] border border-white/[0.04] rounded-xl p-4 font-mono text-xs text-[#E2E8F0] min-h-[85px] leading-relaxed flex items-center">
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
                      <span className="text-zinc-600 italic text-xs">
                        Awaiting payload dispatch...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Token Diff */}
              {inspectionTab === 'diff' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-rose-400">
                      Pre-Sanitization Stream
                    </span>
                    <div className="bg-[#0A0C10] border border-rose-500/15 rounded-xl p-3 font-mono text-xs text-rose-200/80 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed">
                      {result ? result.original_prompt : prompt}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-[#34C759]">
                      Masked Stream (Dispatched)
                    </span>
                    <div className="bg-[#0A0C10] border border-emerald-500/15 rounded-xl p-3 font-mono text-xs text-emerald-200/80 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed">
                      {result ? renderHighlightedText(result.sanitized_prompt, true) : "Awaiting dispatch..."}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Raw JSON */}
              {inspectionTab === 'json' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] text-[#94A3B8] font-mono">
                    <span>Audit Telemetry Record:</span>
                    {result && (
                      <button
                        onClick={() => copyText(JSON.stringify(result, null, 2), 'prompt')}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#E2E8F0] text-[10px] font-mono flex items-center gap-1"
                      >
                        {copiedPrompt ? "Copied" : "Copy JSON"}
                      </button>
                    )}
                  </div>
                  <pre className="bg-[#0A0C10] border border-white/[0.04] rounded-xl p-3 font-mono text-[11px] text-[#E2E8F0] max-h-[140px] overflow-y-auto leading-normal">
                    {JSON.stringify(result || { status: "ready", model: "llama-3.1-8b", zero_retention: true }, null, 2)}
                  </pre>
                </div>
              )}

            </div>

            {/* Safe LLM Response Container */}
            <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <h3 className="text-xs font-semibold text-[#F8FAFC] tracking-tight">
                    Safe LLM Response (Inference Stream)
                  </h3>
                </div>

                {result && (
                  <button
                    onClick={() => copyText(result.llm_response, 'response')}
                    className="px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#E2E8F0] text-[10px] font-mono flex items-center gap-1 transition-colors"
                  >
                    {copiedResponse ? <Check className="w-2.5 h-2.5 text-[#34C759]" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedResponse ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              <div className="bg-[#0A0C10] border border-white/[0.04] rounded-xl p-4 font-mono text-xs text-[#E2E8F0] min-h-[100px] max-h-[190px] overflow-y-auto leading-relaxed">
                {loading ? (
                  <div className="w-full space-y-2 animate-pulse">
                    <div className="h-3 bg-zinc-800 rounded w-full"></div>
                    <div className="h-3 bg-zinc-800 rounded w-4/5"></div>
                    <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                  </div>
                ) : displayedLlmResponse ? (
                  <div className="whitespace-pre-wrap">{displayedLlmResponse}</div>
                ) : (
                  <span className="text-zinc-600 italic text-xs">
                    LLM inference stream will render here...
                  </span>
                )}
              </div>
            </div>

          </section>

        </main>

        {/* --- Minimalist Compliance Footer --- */}
        <footer className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-[#94A3B8] text-xs gap-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#94A3B8]" />
            <span>Zero-Retention Architecture • No raw PII persisted to database</span>
          </div>
          <div className="font-mono text-[11px] text-[#94A3B8]">
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
