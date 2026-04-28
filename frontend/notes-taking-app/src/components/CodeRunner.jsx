import { useState, useMemo } from 'react'
import { executeCode } from '../services/codeExecutionService'
import '../styles/CodeRunner.css'

function CodeRunner({ codeSnippet, initialLanguage = 'python' }) {
  // Auto-detect language from code snippet
  const detectedLanguage = useMemo(() => {
    if (!codeSnippet) return initialLanguage

    const code = codeSnippet.toLowerCase()

    // Java patterns
    if (code.includes('public class') || code.includes('system.out.println') || code.includes('public static void main')) {
      return 'java'
    }

    // Python patterns
    if (code.includes('def ') || code.includes('import ') || code.includes('print(') || code.includes('for ') || code.includes(':')) {
      return 'python'
    }

    // JavaScript patterns
    if (code.includes('function ') || code.includes('console.log') || code.includes('const ') || code.includes('let ') || code.includes('=>')) {
      return 'javascript'
    }

    // C++ patterns
    if (code.includes('#include') || code.includes('std::cout') || code.includes('::')) {
      return 'cpp'
    }

    // C patterns
    if (code.includes('#include <stdio.h>') || code.includes('printf(')) {
      return 'c'
    }

    // Go patterns
    if (code.includes('package main') || code.includes('func ') || code.includes('fmt.')) {
      return 'go'
    }

    // Rust patterns
    if (code.includes('fn main()') || code.includes('println!')) {
      return 'rust'
    }

    // Ruby patterns
    if (code.includes('puts ') || code.includes('def ') || code.includes('.each')) {
      return 'ruby'
    }

    return initialLanguage
  }, [codeSnippet, initialLanguage])

  const [language, setLanguage] = useState(detectedLanguage)
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasRun, setHasRun] = useState(false)

  const SUPPORTED_LANGUAGES = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'ruby', label: 'Ruby' },
  ]

  const handleRunCode = async () => {
    setIsLoading(true)
    setError('')
    setOutput('')
    setHasRun(true)

    try {
      const result = await executeCode(language, codeSnippet)

      if (result.error) {
        setError(result.error)
        setOutput('')
      } else {
        const outputText = result.stdout || result.stderr || ''
        setOutput(outputText)
        if (result.exitCode && result.exitCode !== 0) {
          setError(`Process exited with code: ${result.exitCode}`)
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to execute code')
      setOutput('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearOutput = () => {
    setOutput('')
    setError('')
    setHasRun(false)
  }

  return (
    <div className="code-runner">
      <div className="code-runner__controls">
        <div className="code-runner__language-selector">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            className="language-dropdown"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <span className="language-hint">(Auto-detected)</span>
        </div>

        <button
          onClick={handleRunCode}
          disabled={isLoading || !codeSnippet}
          className="run-button"
          title={codeSnippet ? 'Execute the code snippet' : 'No code to execute'}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Running...
            </>
          ) : (
            <>
              ▶ Run Code
            </>
          )}
        </button>

        {hasRun && (
          <button
            onClick={handleClearOutput}
            disabled={isLoading}
            className="clear-button"
            title="Clear output"
          >
            Clear Output
          </button>
        )}
      </div>

      {hasRun && (
        <div className="code-runner__output-section">
          {error && (
            <div className="code-runner__error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {output && (
            <div className="code-runner__console">
              <pre className="console-output">{output || '(No output)'}</pre>
            </div>
          )}

          {!error && !output && isLoading && (
            <div className="code-runner__loading">
              Executing code...
            </div>
          )}

          {!error && !output && !isLoading && (
            <div className="code-runner__empty">
              No output returned
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CodeRunner
