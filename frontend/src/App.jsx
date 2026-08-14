import React, { useState, useEffect, useRef, Component } from 'react'
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion'

const API_BASE_URL = 'https://pryvwire.onrender.com';

// ─── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="outer-shell p-8 max-w-md text-center">
          <div className="inner-core p-8">
            <div className="text-red-400 text-sm font-mono mb-3">SYSTEM EXCEPTION</div>
            <p className="text-white/50 text-sm mb-6">{this.state.error?.toString()}</p>
            <button onClick={() => window.location.reload()} className="pill-btn">
              Reinitialize
            </button>
          </div>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = 0; const end = parseFloat(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    const duration = 900; const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * end * 10) / 10);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ─── Redaction Badge ───────────────────────────────────────────────────────────
const ENTITY_COLORS = {
  EMAIL_ADDRESS: { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-300', dot: 'bg-violet-400' },
  PERSON:        { bg: 'bg-sky-500/15',    border: 'border-sky-500/30',    text: 'text-sky-300',    dot: 'bg-sky-400' },
  PHONE_NUMBER:  { bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',text: 'text-emerald-300',dot: 'bg-emerald-400' },
  US_SSN:        { bg: 'bg-red-500/15',    border: 'border-red-500/30',    text: 'text-red-300',    dot: 'bg-red-400' },
  CREDIT_CARD:   { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  text: 'text-amber-300',  dot: 'bg-amber-400' },
};
const DEFAULT_ENTITY = { bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', text: 'text-indigo-300', dot: 'bg-indigo-400' };

function RedactionBadge({ entity, index }) {
  const c = ENTITY_COLORS[entity] || DEFAULT_ENTITY;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center gap-1.5 ${c.bg} border ${c.border} ${c.text} px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold mx-0.5 my-0.5`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
      {entity}
    </motion.span>
  );
}

function renderHighlightedText(text) {
  const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[REDACTED:')) {
      const entity = part.replace('[REDACTED: ', '').replace(']', '');
      return <RedactionBadge key={i} entity={entity} index={i} />;
    }
    return <span key={i} className="text-white/70">{part}</span>;
  });
}

// ─── Magnetic Button ───────────────────────────────────────────────────────────
function MagneticButton({ children, onClick, disabled, loading }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e) => {
    if (disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.15);
    y.set((e.clientY - cy) * 0.15);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`relative w-full py-4 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden group ${
        disabled
          ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
          : 'bg-indigo-500 text-white border border-indigo-400/50 hover:bg-indigo-400 shadow-[0_0_32px_rgba(99,102,241,0.25)] hover:shadow-[0_0_48px_rgba(99,102,241,0.4)]'
      }`}
    >
      {!disabled && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-white/10 to-indigo-400/0"
          initial={{ x: '-100%' }}
          animate={loading ? {} : {}}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}
      <span className="relative flex items-center justify-center gap-2.5">
        {loading ? (
          <>
            <motion.span
              className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span>Intercepting & redacting…</span>
          </>
        ) : (
          <>
            <span>Sanitize & Execute</span>
            <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-300">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 8L8 2M8 2H4M8 2V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </>
        )}
      </span>
    </motion.button>
  );
}

// ─── Bento Metric Card ─────────────────────────────────────────────────────────
function MetricCard({ label, value, suffix, sub, accent, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="outer-shell h-full"
    >
      <div className="inner-core p-5 h-full flex flex-col justify-between">
        <span className="eyebrow">{label}</span>
        <div>
          <div className={`text-3xl font-bold font-mono tracking-tight ${accent}`}>
            {inView ? <AnimatedNumber value={value} suffix={suffix} /> : '0'}
          </div>
          <div className="text-white/30 text-[11px] mt-1">{sub}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
function MainApp() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [metrics, setMetrics] = useState({ total_requests: 0, total_threats_blocked: 0, avg_processing_time_ms: 0, circuit_breaker: { state: 'CLOSED' } });
  const [healthStatus, setHealthStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [displayedLlm, setDisplayedLlm] = useState('');

  const fetchTelemetry = async () => {
    try {
      const [h, m] = await Promise.all([
        fetch(`${API_BASE_URL}/health`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/metrics`).then(r => r.json()).catch(() => null),
      ]);
      if (h) setHealthStatus(h);
      if (m) setMetrics(m);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {}
  };

  useEffect(() => { fetchTelemetry(); const t = setInterval(fetchTelemetry, 5000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!result?.llm_response) { setDisplayedLlm(''); return; }
    let i = 0; const text = result.llm_response; setDisplayedLlm('');
    const t = setInterval(() => {
      if (i < text.length) { setDisplayedLlm(p => p + text.charAt(i)); i++; }
      else clearInterval(t);
    }, 12);
    return () => clearInterval(t);
  }, [result]);

  const handleSanitize = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sanitize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'pryvwire-demo-secret-key' },
        body: JSON.stringify({ user_prompt: prompt, client_id: 'pryvwire-web' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limit exceeded (30 req/min).');
        if (res.status === 413) throw new Error('Payload too large (50KB max).');
        if (res.status === 401) throw new Error('Unauthorized: Invalid API key.');
        throw new Error(data.detail || 'Security middleware blocked the request.');
      }
      setResult(data.data); fetchTelemetry();
    } catch (err) { setError(err.message); fetchTelemetry(); }
    finally { setLoading(false); }
  };

  const copy = (text, which) => {
    navigator.clipboard.writeText(text);
    if (which === 'p') { setCopiedPrompt(true); setTimeout(() => setCopiedPrompt(false), 2000); }
    else { setCopiedResponse(true); setTimeout(() => setCopiedResponse(false), 2000); }
  };

  const isHealthy = healthStatus?.status === 'Secure and Operational';
  const cbState = metrics.circuit_breaker?.state;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden">

      {/* Background mesh gradient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-sky-600/5 blur-[80px]" />
        {/* Noise grain overlay */}
        <div className="fixed inset-0 opacity-[0.025]" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',backgroundSize:'200px'}} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12"
        >
          <div>
            <div className="eyebrow mb-3">Zero-Retention Security Gateway</div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-none">
              Pryv<span className="text-indigo-400">Wire</span>
            </h1>
          </div>

          {/* Status pill */}
          <div className="outer-shell">
            <div className="inner-core px-4 py-2.5 flex items-center gap-3">
              <motion.span
                animate={{ scale: isHealthy ? [1, 1.3, 1] : 1, opacity: isHealthy ? [1, 0.5, 1] : 0.5 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-2 h-2 rounded-full flex-shrink-0 ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
              <span className="text-xs font-semibold text-white/70">
                {isHealthy ? 'System Secure' : healthStatus ? 'Degraded' : 'Connecting…'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                cbState === 'CLOSED' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
              }`}>
                CB: {cbState}
              </span>
              {lastUpdated && <span className="text-[10px] text-white/25 font-mono hidden sm:block">{lastUpdated}</span>}
            </div>
          </div>
        </motion.header>

        {/* ── Bento Metrics Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Threats Blocked', value: result ? result.metrics.threats_intercepted : metrics.total_threats_blocked, suffix: '', sub: 'PII entities redacted', accent: 'text-indigo-400', delay: 0.05 },
            { label: 'Total Requests', value: metrics.total_requests, suffix: '', sub: 'All-time sanitizations', accent: 'text-violet-400', delay: 0.1 },
            { label: 'Avg Latency', value: result ? result.metrics.processing_time_ms : metrics.avg_processing_time_ms, suffix: 'ms', sub: 'End-to-end pipeline', accent: 'text-sky-400', delay: 0.15 },
            { label: 'Model', value: 0, suffix: '', sub: 'llama-3.1-8b-instant', accent: 'text-emerald-400', delay: 0.2, isLabel: true },
          ].map((m, i) => (
            <MetricCard key={i} {...m} value={m.isLabel ? '-' : m.value} />
          ))}
        </div>

        {/* ── Main Panel (asymmetric bento) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">

          {/* Left: Input */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="outer-shell"
          >
            <div className="inner-core p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <span className="eyebrow">Input Payload</span>
                <span className="text-[11px] font-mono text-white/20">{prompt.length} / 50,000</span>
              </div>

              <div className="relative">
                <textarea
                  className="w-full h-52 bg-black/40 text-white/80 placeholder-white/20 rounded-xl border border-white/8 outline-none p-4 font-mono text-sm resize-none focus:border-indigo-500/50 focus:bg-black/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  placeholder={'Contact John Doe at john@acme.io\nor call +1-415-555-0199…'}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                {prompt && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-400"
                  />
                )}
              </div>

              <MagneticButton onClick={handleSanitize} disabled={loading || !prompt.trim()} loading={loading} />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="outer-shell border-red-500/20"
                  >
                    <div className="inner-core px-4 py-3 text-red-400 text-sm font-mono">
                      ⚠ {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: Output */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="outer-shell"
          >
            <div className="inner-core p-6 flex flex-col gap-5 h-full">

              {/* Sanitized Vector */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="eyebrow">Sanitized Vector</span>
                  <AnimatePresence>
                    {result && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => copy(result.sanitized_prompt, 'p')}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {copiedPrompt ? '✓ Copied' : 'Copy'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex-1 min-h-[100px] bg-black/40 rounded-xl border border-white/8 p-4 font-mono text-sm leading-relaxed">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        {[80, 55, 65].map((w, i) => (
                          <motion.div key={i} className="h-3 bg-white/8 rounded-full" style={{ width: `${w}%` }}
                            animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }} />
                        ))}
                      </motion.div>
                    ) : result ? (
                      <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-0.5 items-center">
                        {renderHighlightedText(result.sanitized_prompt)}
                      </motion.div>
                    ) : (
                      <motion.span key="empty" className="text-white/20 italic">Awaiting secure payload…</motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* LLM Response */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="eyebrow">Groq LLM Response</span>
                  <AnimatePresence>
                    {result && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => copy(result.llm_response, 'r')}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {copiedResponse ? '✓ Copied' : 'Copy'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex-1 min-h-[100px] max-h-48 overflow-y-auto bg-black/40 rounded-xl border border-white/8 p-4 font-mono text-sm text-white/60 leading-relaxed">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        {[95, 70].map((w, i) => (
                          <motion.div key={i} className="h-3 bg-white/8 rounded-full" style={{ width: `${w}%` }}
                            animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }} />
                        ))}
                      </motion.div>
                    ) : displayedLlm ? (
                      <motion.span key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {displayedLlm}
                        {displayedLlm.length < (result?.llm_response?.length || 0) && (
                          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="ml-0.5 inline-block w-0.5 h-3.5 bg-indigo-400 align-middle" />
                        )}
                      </motion.span>
                    ) : (
                      <motion.span key="empty" className="text-white/20 italic">Awaiting inference…</motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </motion.div>
        </div>

        {/* ── Footer ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-10 flex justify-between items-center text-[11px] font-mono text-white/15"
        >
          <span>PryvWire v1.0 · Zero-Retention Architecture</span>
          <span>Presidio NER · LLaMA 3.1 · Render + Vercel</span>
        </motion.footer>

      </div>

      {/* sr-only live region */}
      <div className="sr-only" aria-live="polite">
        {loading ? 'Processing…' : result ? `${result.metrics.threats_intercepted} threats intercepted.` : error || 'Ready'}
      </div>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><MainApp /></ErrorBoundary>;
}
