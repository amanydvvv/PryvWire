import React, { useState, useEffect, Component } from 'react'

const API_BASE_URL = 'http://localhost:8000';

// React Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Error Boundary caught an exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#e8eef2] p-8 flex items-center justify-center font-sans">
          <div className="bg-[#e8eef2] p-8 rounded-3xl shadow-[12px_12px_24px_#c5cad5,-12px_-12px_24px_#ffffff] max-w-md text-center border-2 border-white/50">
            <h2 className="text-xl font-bold text-red-500 mb-3">Application Exception</h2>
            <p className="text-slate-600 text-sm mb-4">{this.state.error?.toString()}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-400 text-white rounded-xl font-bold shadow-[4px_4px_8px_#c5cad5,-4px_-4px_8px_#ffffff]"
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

function MainApp() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)

  // Live Metrics & Health State
  const [metrics, setMetrics] = useState({
    total_requests: 0,
    total_threats_blocked: 0,
    avg_processing_time_ms: 0,
    circuit_breaker: { state: "CLOSED" }
  });
  const [healthStatus, setHealthStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Typewriter response state
  const [displayedLlmResponse, setDisplayedLlmResponse] = useState('');

  // Fetch real telemetry & health
  const fetchTelemetry = async () => {
    try {
      const [healthRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/metrics`).then(r => r.json()).catch(() => null)
      ]);

      if (healthRes) setHealthStatus(healthRes);
      if (metricsRes) setMetrics(metricsRes);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Telemetry sync error:", e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 4000);
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
    }, 15);

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
          throw new Error('Rate limit exceeded (30 req/min). Please wait a moment.');
        } else if (response.status === 413) {
          throw new Error('Payload too large. Request body exceeds maximum allowed size (50KB).');
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

  // Claymorphism badge renderer for redacted entities
  const renderHighlightedText = (text) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');
        return (
          <span key={index} className="inline-block bg-[#e8eef2] text-indigo-600 px-3 py-1 rounded-xl font-mono text-xs mx-1 font-bold shadow-[inset_3px_3px_6px_#c5cad5,inset_-3px_-3px_6px_#ffffff] border-2 border-white/40">
            {entity}
          </span>
        );
      }
      return part;
    });
  };

  const isHealthy = healthStatus && healthStatus.status === "Secure and Operational";

  return (
    <div className="min-h-screen bg-[#e8eef2] p-4 sm:p-6 md:p-12 font-sans text-slate-700 flex flex-col items-center">
      
      {/* Accessibility Announcement Region */}
      <div className="sr-only" aria-live="polite">
        {loading ? "Processing security prompt through Presidio and Groq" : result ? `Completed prompt sanitization. ${result.metrics.threats_intercepted} threats intercepted.` : error ? `Security middleware notice: ${error}` : "System ready"}
      </div>

      {/* Header & Status Indicator */}
      <header className="w-full max-w-5xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-700 tracking-tight">Pryv<span className="text-indigo-500">Wire</span></h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Zero-Retention Security Gateway</p>
        </div>

        <div className="flex items-center space-x-3 bg-[#e8eef2] px-4 py-2 rounded-2xl shadow-[4px_4px_8px_#c5cad5,-4px_-4px_8px_#ffffff] border border-white/50">
          <span className={`h-3 w-3 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="text-xs font-bold text-slate-600">
            {isHealthy ? 'System Secure' : healthStatus ? 'System Degraded' : 'Connecting...'}
          </span>
          {lastUpdated && <span className="text-[10px] text-slate-400 font-mono">({lastUpdated})</span>}
        </div>
      </header>

      {/* Main Clay Container */}
      <main className="w-full max-w-5xl bg-[#e8eef2] rounded-[2.5rem] sm:rounded-[3rem] shadow-[12px_12px_24px_#c5cad5,-12px_-12px_24px_#ffffff] border-4 border-white/40 p-6 sm:p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        
        {/* Left Column: Input */}
        <section className="flex flex-col space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4 ml-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Input Payload</h2>
              <span className="text-[11px] font-mono text-slate-400">{prompt.length} / 50,000 max bytes</span>
            </div>
            <textarea
              className="w-full h-56 bg-[#e8eef2] text-slate-700 placeholder-slate-400 rounded-3xl shadow-[inset_6px_6px_12px_#c5cad5,inset_-6px_-6px_12px_#ffffff] outline-none p-6 font-mono text-sm resize-none focus:shadow-[inset_8px_8px_16px_#c5cad5,inset_-8px_-8px_16px_#ffffff] transition-all"
              placeholder="Enter text containing sensitive PII (e.g., 'Contact John Doe at john@cyberdyne.corp or call +1-415-555-0199')..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
          </div>
          
          <button
            onClick={handleSanitize}
            disabled={loading || !prompt.trim()}
            className={`w-full py-5 rounded-3xl font-bold tracking-wide transition-all ${
              loading || !prompt.trim()
                ? 'bg-[#e8eef2] text-slate-400 shadow-[inset_4px_4px_8px_#c5cad5,inset_-4px_-4px_8px_#ffffff] cursor-not-allowed' 
                : 'bg-indigo-500 text-white shadow-[8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] hover:bg-indigo-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Interception &amp; Redaction in progress...</span>
              </span>
            ) : (
              'Sanitize & Execute'
            )}
          </button>

          {error && (
            <div className="p-5 bg-red-50 text-red-600 rounded-3xl shadow-[inset_4px_4px_8px_rgba(239,68,68,0.2),inset_-4px_-4px_8px_#ffffff] font-medium text-center text-sm border border-red-200">
              {error}
            </div>
          )}
        </section>

        {/* Right Column: Output & Live Metrics */}
        <section className="flex flex-col space-y-8">
          
          {/* Real Metrics Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Real Total Threats Intercepted */}
            <div className="bg-[#e8eef2] rounded-[2rem] shadow-[8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] p-5 flex flex-col items-center border-2 border-white/50 transition-all duration-300">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Threats</span>
              <span className="text-3xl font-black text-indigo-500 font-mono">
                {result ? result.metrics.threats_intercepted : metrics.total_threats_blocked}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Aggregated Redactions</span>
            </div>

            {/* Real Latency Metrics */}
            <div className="bg-[#e8eef2] rounded-[2rem] shadow-[8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] p-5 flex flex-col items-center border-2 border-white/50 transition-all duration-300">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Latency</span>
              <span className="text-3xl font-black text-slate-700 font-mono">
                {result ? result.metrics.processing_time_ms : metrics.avg_processing_time_ms}
                <span className="text-sm text-slate-400 ml-1">ms</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1">Sub-second SLA</span>
            </div>
          </div>

          {/* Read-Only Displays */}
          <div className="flex-grow flex flex-col space-y-6">
            
            {/* Stage 1: Sanitized Vector */}
            <div className="flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-3 ml-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sanitized Vector</h3>
                {result && (
                  <button
                    onClick={() => copyText(result.sanitized_prompt, 'prompt')}
                    className="text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    {copiedPrompt ? 'Copied!' : 'Copy Vector'}
                  </button>
                )}
              </div>
              <div className="flex-grow bg-[#e8eef2] rounded-3xl shadow-[inset_6px_6px_12px_#c5cad5,inset_-6px_-6px_12px_#ffffff] p-6 font-mono text-sm text-slate-700 min-h-[100px] flex items-center">
                {loading ? (
                  <div className="w-full space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-300/50 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-slate-300/50 rounded-lg w-1/2"></div>
                  </div>
                ) : result ? (
                  renderHighlightedText(result.sanitized_prompt)
                ) : (
                  <span className="text-slate-400 italic">Awaiting secure payload...</span>
                )}
              </div>
            </div>

            {/* Stage 2: AI Response with Typewriter Effect */}
            <div className="flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-3 ml-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Groq LLM Response</h3>
                {result && (
                  <button
                    onClick={() => copyText(result.llm_response, 'response')}
                    className="text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    {copiedResponse ? 'Copied!' : 'Copy Response'}
                  </button>
                )}
              </div>
              <div className="flex-grow bg-[#e8eef2] rounded-3xl shadow-[inset_6px_6px_12px_#c5cad5,inset_-6px_-6px_12px_#ffffff] p-6 font-mono text-sm text-slate-700 min-h-[100px] overflow-y-auto max-h-56">
                {loading ? (
                  <div className="w-full space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-300/50 rounded-lg w-full"></div>
                    <div className="h-4 bg-slate-300/50 rounded-lg w-4/5"></div>
                  </div>
                ) : displayedLlmResponse ? (
                  displayedLlmResponse
                ) : (
                  <span className="text-slate-400 italic">Awaiting inference...</span>
                )}
              </div>
            </div>

          </div>

        </section>
      </main>
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
