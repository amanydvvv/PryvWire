import { useState } from 'react'

function App() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSanitize = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/sanitize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_prompt: prompt, client_id: 'ciphergate-ui' })
      });

      if (!response.ok) throw new Error('Security Middleware Blocked Request');
      
      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Claymorphism badge renderer
  const renderHighlightedText = (text) => {
    const parts = text.split(/(\[REDACTED: [A-Z_]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[REDACTED:')) {
        const entity = part.replace('[REDACTED: ', '').replace(']', '');
        return (
          <span key={index} className="inline-block bg-[#e8eef2] text-indigo-500 px-3 py-1 rounded-xl font-mono text-xs mx-1 font-bold shadow-[inset_3px_3px_6px_#c5cad5,inset_-3px_-3px_6px_#ffffff] border-2 border-white/40">
            {entity}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-[#e8eef2] p-6 md:p-12 font-sans text-slate-600 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-5xl mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-700 tracking-tight mb-2">CipherGate</h1>
        <p className="text-slate-500 font-medium tracking-wide">Zero-Retention Security Middleware</p>
      </header>

      {/* Main Clay Container */}
      <main className="w-full max-w-5xl bg-[#e8eef2] rounded-[3rem] shadow-[12px_12px_24px_#c5cad5,-12px_-12px_24px_#ffffff] border-4 border-white/40 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Input */}
        <section className="flex flex-col space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Input Payload</h2>
            <textarea
              className="w-full h-56 bg-[#e8eef2] text-slate-700 placeholder-slate-400 rounded-3xl shadow-[inset_6px_6px_12px_#c5cad5,inset_-6px_-6px_12px_#ffffff] outline-none p-6 font-mono text-sm resize-none focus:shadow-[inset_8px_8px_16px_#c5cad5,inset_-8px_-8px_16px_#ffffff] transition-all"
              placeholder="Enter text containing sensitive data..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
          </div>
          
          <button
            onClick={handleSanitize}
            disabled={loading}
            className={`w-full py-5 rounded-3xl font-bold tracking-wide transition-all ${
              loading 
                ? 'bg-[#e8eef2] text-slate-400 shadow-[inset_4px_4px_8px_#c5cad5,inset_-4px_-4px_8px_#ffffff] cursor-not-allowed' 
                : 'bg-indigo-400 text-white shadow-[8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] hover:bg-indigo-500'
            }`}
          >
            {loading ? 'Processing...' : 'Sanitize & Execute'}
          </button>

          {error && (
            <div className="p-5 bg-red-50 text-red-500 rounded-3xl shadow-[inset_4px_4px_8px_rgba(239,68,68,0.2),inset_-4px_-4px_8px_#ffffff] font-medium text-center text-sm">
              {error}
            </div>
          )}
        </section>

        {/* Right Column: Output & Metrics */}
        <section className="flex flex-col space-y-8">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#e8eef2] rounded-[2rem] shadow-[8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] p-6 flex flex-col items-center border-2 border-white/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Threats</span>
              <span className="text-3xl font-black text-indigo-400">{result?.metrics?.threats_intercepted || 0}</span>
            </div>
            <div className="bg-[#e8eef2] rounded-[2rem] shadow-[8px_8px_16px_#c5cad5,-8px_-8px_16px_#ffffff] p-6 flex flex-col items-center border-2 border-white/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Latency</span>
              <span className="text-3xl font-black text-slate-600">{result?.metrics?.processing_time_ms || 0}<span className="text-lg text-slate-400 ml-1">ms</span></span>
            </div>
          </div>

          {/* Read-Only Displays */}
          <div className="flex-grow flex flex-col space-y-6">
            <div className="flex-grow flex flex-col">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Sanitized Vector</h3>
              <div className="flex-grow bg-[#e8eef2] rounded-3xl shadow-[inset_6px_6px_12px_#c5cad5,inset_-6px_-6px_12px_#ffffff] p-6 font-mono text-sm text-slate-600 min-h-[100px]">
                {result ? renderHighlightedText(result.sanitized_prompt) : <span className="text-slate-400 italic">Awaiting secure payload...</span>}
              </div>
            </div>

            <div className="flex-grow flex flex-col">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">AI Response</h3>
              <div className="flex-grow bg-[#e8eef2] rounded-3xl shadow-[inset_6px_6px_12px_#c5cad5,inset_-6px_-6px_12px_#ffffff] p-6 font-mono text-sm text-slate-600 min-h-[100px]">
                {result ? result.llm_response : <span className="text-slate-400 italic">Awaiting inference...</span>}
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  )
}

export default App
