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
        body: JSON.stringify({ user_prompt: prompt, client_id: 'web-dashboard' })
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

  return (
    <div className="min-h-screen p-8 font-sans text-gray-800">
      <header className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Enterprise PII Security Middleware</h1>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-semibold text-green-700">System Secure</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Test Prompt Input</h2>
          <textarea
            className="w-full h-48 p-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            placeholder="Type a message containing fake PII (e.g., 'Email John Doe at john@example.com or call 555-0199')..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          ></textarea>
          <button
            onClick={handleSanitize}
            disabled={loading}
            className={`w-full py-3 rounded font-bold text-white transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Processing through Security Layer...' : 'Sanitize & Send (Secure Route)'}
          </button>
          
          {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>}
        </section>

        {/* Output Section */}
        <section className="flex flex-col space-y-6">
          {/* Metrics Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center">
              <p className="text-sm text-gray-500 font-semibold uppercase">Threats Intercepted</p>
              <p className="text-3xl font-bold text-red-600">{result?.metrics?.threats_intercepted || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center">
              <p className="text-sm text-gray-500 font-semibold uppercase">Latency (ms)</p>
              <p className="text-3xl font-bold text-blue-600">{result?.metrics?.processing_time_ms || 0}</p>
            </div>
          </div>

          {/* Results Console */}
          <div className="bg-gray-900 rounded-lg shadow-md border border-gray-700 p-6 flex-grow flex flex-col text-gray-100">
            <h3 className="text-lg font-semibold mb-2 text-gray-400">1. Sanitized Payload (Sent to LLM)</h3>
            <div className="bg-gray-800 p-4 rounded mb-4 font-mono text-sm min-h-[80px] border border-gray-700">
              {result ? result.sanitized_prompt : <span className="text-gray-600">Waiting for input...</span>}
            </div>

            <h3 className="text-lg font-semibold mb-2 text-gray-400">2. LLM Response</h3>
            <div className="bg-gray-800 p-4 rounded font-mono text-sm flex-grow border border-gray-700">
              {result ? result.llm_response : <span className="text-gray-600">Waiting for input...</span>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
