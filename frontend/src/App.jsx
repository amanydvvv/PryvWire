import React, { useState, useEffect, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Home,
  Radio,
  Compass,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  ListMusic,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Lock,
  Copy,
  Check,
  Terminal,
  Sparkles,
  RefreshCw,
  Sliders,
  AlertCircle,
  MoreHorizontal,
  Code2,
  Activity,
  Layers,
  FileCode
} from 'lucide-react'

const API_BASE_URL = 'https://pryvwire.onrender.com';

// Featured Apple-Music style hero vectors
const FEATURED_HEROES = [
  {
    id: "healthcare",
    category: "FEATURED EHR RECORD",
    title: "Patient Medical & SSN Authorization",
    subtitle: "Healthcare data filtering with HIPAA Title II & GDPR PII compliance.",
    gradient: "from-purple-900/60 via-indigo-950/80 to-zinc-950",
    accent: "#a855f7",
    text: "Patient Sarah Jenkins (DOB 1984-05-12, SSN 042-99-1823) contacted us via sarah.jenkins@healthfirst.org or phone (415) 555-0199 regarding prescription refill authorization."
  },
  {
    id: "finance",
    category: "HIGH-VALUE TRANSACTION",
    title: "Executive Wire & PAN Tokenizer",
    subtitle: "Real-time bank wire scrub with PCI-DSS 3.4 primary account protection.",
    gradient: "from-blue-900/60 via-slate-950/80 to-zinc-950",
    accent: "#38bdf8",
    text: "Authorize wire transfer of $45,000 for executive Michael Vance (SSN 987-65-4321). Confirmation email michael.vance@vancecapital.com or cell +1-202-555-0143. Card on file: 4532-8921-0034-8812."
  },
  {
    id: "hr",
    category: "ENTERPRISE DIRECTORY",
    title: "Confidential HR Payroll Stream",
    subtitle: "Automated direct deposit routing with zero persistent storage.",
    gradient: "from-rose-900/60 via-zinc-950/80 to-zinc-950",
    accent: "#fb7185",
    text: "Update direct deposit for employee David Chen (dchen@acmecorp.com, 555-839-2011). Route monthly compensation to account ending in 8831."
  }
];

// Track-style quick test vectors
const TRACK_PRESETS = [
  { id: 1, title: "Executive Wire Approval", artist: "PCI-DSS • SSN & Card", duration: "12 ms", icon: "💳", text: "Authorize wire for CEO Michael (SSN 987-65-4321, card 4532-8921-0034-8812)." },
  { id: 2, title: "Patient Clinic Intake", artist: "HIPAA • Phone & Email", duration: "18 ms", icon: "🏥", text: "Patient Sarah Jenkins (sarah.j@health.org, phone 415-555-0199) requested checkup." },
  { id: 3, title: "Employee Payroll Route", artist: "GDPR • Banking Vector", duration: "14 ms", icon: "💼", text: "Direct deposit for David Chen (dchen@corp.com, phone 555-839-2011) account 8831." },
  { id: 4, title: "Support Ticket Escalation", artist: "PII • Identity Token", duration: "21 ms", icon: "🎟️", text: "Customer Emily Watson (emily@gmail.com, cell 202-555-0177) reset password." },
  { id: 5, title: "Loan Application Lead", artist: "GLBA • Credit Record", duration: "16 ms", icon: "📊", text: "Applicant Robert Miller (SSN 112-99-4455, robert@miller.com) loan status." },
  { id: 6, title: "Billing Subscription Update", artist: "PCI-DSS • Account ID", duration: "19 ms", icon: "🧾", text: "Update subscription for Lisa (lisa@apex.io, card 4111-2222-3333-4444)." }
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
        <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 flex items-center justify-center p-6">
          <div className="bg-[#1c1c1e] border border-white/[0.1] rounded-2xl p-6 text-center max-w-md w-full shadow-2xl">
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
  const [prompt, setPrompt] = useState(FEATURED_HEROES[0].text)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)
  
  // Navigation & Views
  const [activeNav, setActiveNav] = useState('gateway') // 'gateway' | 'diff' | 'telemetry' | 'sdk'
  const [inspectionView, setInspectionView] = useState('stream') // 'stream' | 'diff' | 'json'
  const [searchQuery, setSearchQuery] = useState('')

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
          throw new Error('Rate limit reached (30 req/min). System protected.');
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
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  // Apple-style Redacted Entity Pill Chips
  const renderHighlightedText = (text, isDiff = false) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');
        
        let colorClass = "bg-[#fa2d48]/15 text-[#fa2d48] border-[#fa2d48]/30";
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

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-[#f5f5f7] flex flex-col antialiased selection:bg-[#fa2d48]/30 selection:text-white">
      
      {/* Top Main Container (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* --- LEFT SIDEBAR (Apple Music macOS Acrylic Style) --- */}
        <aside className="w-64 bg-[#141416]/90 border-r border-white/[0.08] backdrop-blur-2xl flex flex-col justify-between p-4 hidden md:flex shrink-0">
          
          <div className="flex flex-col gap-6">
            
            {/* Apple / Brand Lockup */}
            <div className="flex items-center gap-2.5 px-2 pt-2">
              <div className="text-xl"></div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold tracking-tight text-white">PryvWire</span>
                <span className="text-[10px] text-zinc-500 font-mono">v1.0</span>
              </div>
            </div>

            {/* Apple Music Style Search Bar */}
            <div className="relative px-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vectors &amp; tokens..."
                className="w-full bg-[#1c1c1e] text-xs text-white placeholder-zinc-500 rounded-lg pl-8 pr-3 py-1.5 border border-white/[0.06] focus:border-[#fa2d48]/60 focus:outline-none transition-all"
              />
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1 text-xs font-medium">
              
              <button
                onClick={() => setActiveNav('gateway')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeNav === 'gateway' 
                    ? 'bg-[#fa2d48] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Security Gateway</span>
              </button>

              <button
                onClick={() => setActiveNav('diff')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeNav === 'diff' 
                    ? 'bg-[#fa2d48] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Token Diff Inspector</span>
              </button>

              <button
                onClick={() => setActiveNav('telemetry')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeNav === 'telemetry' 
                    ? 'bg-[#fa2d48] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Radio &amp; Telemetry</span>
              </button>

              <button
                onClick={() => setActiveNav('sdk')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeNav === 'sdk' 
                    ? 'bg-[#fa2d48] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>Developer SDK</span>
              </button>

            </nav>

            {/* Quick Presets Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06] px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2">
                Curated Channels
              </span>
              <div className="flex flex-col gap-1 text-[11px] text-zinc-400">
                {TRACK_PRESETS.slice(0, 3).map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setPrompt(track.text);
                      handleSanitize(track.text);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] hover:text-white transition-all text-left truncate"
                  >
                    <span>{track.icon}</span>
                    <span className="truncate">{track.title}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Bottom Footer Info */}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.06] text-[11px]">
            <a 
              href={`${API_BASE_URL}/docs`}
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between text-zinc-400 hover:text-white px-2 py-1 transition-colors"
            >
              <span>Swagger REST API</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            <div className="flex items-center gap-2 px-2 py-1 text-zinc-500 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14D086]" />
              <span>{isHealthy ? 'Render LPU Connected' : 'Connecting...'}</span>
            </div>
          </div>

        </aside>

        {/* --- MAIN CONTENT AREA (Apple Music Style Scroll View) --- */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-32 flex flex-col gap-8">
          
          {/* Top Mobile Bar (When sidebar hidden) */}
          <div className="flex md:hidden items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-xl"></span>
              <span className="font-bold text-white">PryvWire</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#14D086]" />
              <span className="text-zinc-300">Gateway Active</span>
            </div>
          </div>

          {/* --- HERO CAROUSEL ROW (Large Apple Music Featured Cards) --- */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Featured Ingestion Channels</span>
                <span className="text-zinc-500 font-normal text-sm">›</span>
              </h2>
              <span className="text-xs text-zinc-400 font-mono">3 Active Presets</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURED_HEROES.map((hero) => (
                <div
                  key={hero.id}
                  className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${hero.gradient} border border-white/[0.08] p-5 flex flex-col justify-between min-h-[190px] shadow-lg group hover:border-white/[0.2] transition-all`}
                >
                  <div className="flex flex-col gap-1 z-10">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                      {hero.category}
                    </span>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {hero.title}
                    </h3>
                    <p className="text-xs text-zinc-300/80 leading-relaxed mt-1">
                      {hero.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 z-10">
                    <span className="text-[11px] font-mono text-zinc-400">Zero Retention</span>
                    <button
                      onClick={() => {
                        setPrompt(hero.text);
                        handleSanitize(hero.text);
                      }}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all group-hover:bg-[#fa2d48] group-hover:text-white"
                      title="Load and Sanitize"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>

                  {/* Subtle decorative glow */}
                  <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                </div>
              ))}
            </div>
          </section>

          {/* --- TRACKS ROW (Apple Music Style Song Rows) --- */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                <span>Recent Threat Interceptions</span>
                <span className="text-zinc-500 font-normal">›</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono">SLA &lt; 50ms</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {TRACK_PRESETS.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setPrompt(track.text);
                    handleSanitize(track.text);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#141416]/60 hover:bg-[#1c1c1e] border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#242426] flex items-center justify-center text-base shrink-0 group-hover:bg-[#fa2d48]/20 transition-colors">
                      {track.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate group-hover:text-[#fa2d48] transition-colors">
                        {track.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <span className="text-[10px] font-mono text-zinc-500">{track.duration}</span>
                    <button className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white text-zinc-300 group-hover:text-black flex items-center justify-center transition-all">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* --- MAIN INTERACTIVE SANITIZATION STUDIO --- */}
          <section className="bg-[#141416] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Zero-Retention Gateway Studio
                </h3>
                <p className="text-xs text-zinc-400">
                  Real-time PII interception chamber with isolated Groq LLaMA 3.1 synthesis.
                </p>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center bg-[#1c1c1e] p-1 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setInspectionView('stream')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    inspectionView === 'stream' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ◈ Stream View
                </button>
                <button
                  onClick={() => setInspectionView('diff')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    inspectionView === 'diff' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ◬ Token Diff
                </button>
                <button
                  onClick={() => setInspectionView('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    inspectionView === 'json' ? 'bg-[#fa2d48] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ▣ Audit JSON
                </button>
              </div>
            </div>

            {/* Input & Output Studio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left Column: Raw Payload Editor */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#fa2d48]" />
                    Inbound Ingestion Payload
                  </span>
                  <span className="text-[10px] font-mono">{prompt.length} bytes</span>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter or paste text containing PII (Names, SSNs, Credit Cards, Emails, Phone Numbers)..."
                  rows={8}
                  className="w-full bg-[#1c1c1e] text-white placeholder-zinc-500 text-xs font-mono rounded-xl p-4 border border-white/[0.08] focus:border-[#fa2d48]/60 focus:outline-none transition-all resize-none leading-relaxed"
                />

                <button
                  onClick={() => handleSanitize()}
                  disabled={loading || !prompt.trim()}
                  className={`w-full py-3 px-5 rounded-xl font-semibold text-xs tracking-tight transition-all flex items-center justify-center gap-2 shadow-md ${
                    loading || !prompt.trim()
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-[#fa2d48] hover:bg-[#e0263f] text-white active:scale-[0.985]'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Interception &amp; Scrubbing Active...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sanitize &amp; Dispatch Vector</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Output & LLM Synthesis */}
              <div className="lg:col-span-7 flex flex-col gap-4">

                {/* Stage 1: Dispatched Sanitized Payload */}
                <div className="bg-[#1c1c1e] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#fa2d48]" />
                      Dispatched Vector (Safe Payload)
                    </span>

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

                  {/* Mode 1: Stream View */}
                  {inspectionView === 'stream' && (
                    <div className="bg-[#141416] rounded-lg p-3 font-mono text-xs text-zinc-200 min-h-[70px] leading-relaxed flex items-center">
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
                          Sanitized payload tokens will render here...
                        </span>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Diff Inspector */}
                  {inspectionView === 'diff' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-[#141416] border border-rose-500/20 rounded-lg p-3 font-mono text-[11px] text-rose-200/90 max-h-[120px] overflow-y-auto">
                        <div className="text-[9px] uppercase tracking-wider text-rose-400 font-bold mb-1">Pre-Sanitization</div>
                        {result ? result.original_prompt : prompt}
                      </div>
                      <div className="bg-[#141416] border border-emerald-500/20 rounded-lg p-3 font-mono text-[11px] text-emerald-200/90 max-h-[120px] overflow-y-auto">
                        <div className="text-[9px] uppercase tracking-wider text-[#14D086] font-bold mb-1">Post-Sanitization</div>
                        {result ? renderHighlightedText(result.sanitized_prompt, true) : "Awaiting dispatch..."}
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Audit JSON */}
                  {inspectionView === 'json' && (
                    <pre className="bg-[#141416] rounded-lg p-3 font-mono text-[10px] text-zinc-300 max-h-[120px] overflow-y-auto leading-normal">
                      {JSON.stringify(result || { status: "ready", model: "llama-3.1-8b", zero_retention: true }, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Stage 2: Groq LLaMA 3.1 Synthesis */}
                <div className="bg-[#1c1c1e] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Groq LLaMA 3.1 Synthesis (Isolated)
                    </span>

                    {result && (
                      <button
                        onClick={() => copyText(result.llm_response, 'response')}
                        className="px-2.5 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        {copiedResponse ? <Check className="w-2.5 h-2.5 text-[#14D086]" /> : <Copy className="w-2.5 h-2.5" />}
                        {copiedResponse ? "Copied" : "Copy Response"}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#141416] rounded-lg p-3.5 font-mono text-xs text-zinc-200 min-h-[90px] max-h-[180px] overflow-y-auto leading-relaxed">
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
                        LLM inference synthesis will render here in real time...
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </section>

        </main>

      </div>

      {/* --- FLOATING APPLE "NOW PLAYING / NOW SANITIZING" DOCK (Bottom Center) --- */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-[#1c1c1e]/90 border border-white/[0.12] rounded-full px-5 py-2.5 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-4 z-50">
        
        {/* Left: Track / Model Status */}
        <div className="flex items-center gap-3 min-w-0 w-1/3">
          <div className="w-9 h-9 rounded-lg bg-[#fa2d48] text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">
              {loading ? "Sanitizing Inbound Vector..." : result ? `Scrubbed (${result.metrics.threats_intercepted} Threats)` : "PryvWire Gateway"}
            </span>
            <span className="text-[10px] text-zinc-400 truncate font-mono">
              Groq LLaMA 3.1 • Zero Retention
            </span>
          </div>
        </div>

        {/* Center: Playback / Sanitize Action Controls */}
        <div className="flex flex-col items-center gap-1 w-1/3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const randomPreset = TRACK_PRESETS[Math.floor(Math.random() * TRACK_PRESETS.length)];
                setPrompt(randomPreset.text);
              }}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Previous Vector"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSanitize()}
              disabled={loading}
              className="w-8 h-8 rounded-full bg-white text-black hover:bg-[#fa2d48] hover:text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
              title={loading ? "Sanitizing" : "Dispatch"}
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button 
              onClick={() => {
                const nextPreset = TRACK_PRESETS[Math.floor(Math.random() * TRACK_PRESETS.length)];
                setPrompt(nextPreset.text);
              }}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Next Vector"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Micro Scrubber / Latency Bar */}
          <div className="w-full flex items-center gap-2 text-[9px] font-mono text-zinc-500">
            <span>0ms</span>
            <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden flex">
              <div 
                style={{ width: `${result ? Math.min(100, Math.max(10, result.metrics.processing_time_ms / 5)) : 20}%` }} 
                className="h-full bg-[#fa2d48] transition-all duration-500" 
              />
            </div>
            <span>{result ? `${result.metrics.processing_time_ms}ms` : "50ms SLA"}</span>
          </div>
        </div>

        {/* Right: Metrics / Volume Indicator */}
        <div className="flex items-center justify-end gap-3 w-1/3 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <Volume2 className="w-3.5 h-3.5 text-[#14D086]" />
            <span className="text-[11px] text-[#14D086]">
              {metrics.total_requests} requests
            </span>
          </div>

          <div className="w-2 h-2 rounded-full bg-[#14D086] animate-pulse" title="System Operational" />
        </div>

      </footer>

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
