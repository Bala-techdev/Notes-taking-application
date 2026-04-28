# Code Execution Feature - Key Code Snippets

## Frontend - NoteView.jsx Changes

### BEFORE
```jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import LoadingSpinner from '../components/LoadingSpinner'
import { deleteNote, getNoteById } from '../services/apiService'
import { formatDateTime, formatRelativeTime } from '../utils/time'

// ... component code ...

            {note.codeSnippet ? (
              <section className="note-article__code-block">
                <div className="note-article__section-heading">
                  <h2>Code snippet</h2>
                </div>
                <pre>
                  <code>{note.codeSnippet}</code>
                </pre>
              </section>
            ) : null}
```

### AFTER
```jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import LoadingSpinner from '../components/LoadingSpinner'
import CodeRunner from '../components/CodeRunner'  // ← NEW
import { deleteNote, getNoteById } from '../services/apiService'
import { formatDateTime, formatRelativeTime } from '../utils/time'

// ... component code ...

            {note.codeSnippet ? (
              <section className="note-article__code-block">
                <div className="note-article__section-heading">
                  <h2>Code snippet</h2>
                </div>
                <pre>
                  <code>{note.codeSnippet}</code>
                </pre>
                <CodeRunner codeSnippet={note.codeSnippet} initialLanguage="python" />  {/* ← NEW */}
              </section>
            ) : null}
```

---

## Frontend - CodeRunner Component (NEW)

### Full Implementation
```jsx
import { useState } from 'react'
import { executeCode } from '../services/codeExecutionService'
import '../styles/CodeRunner.css'

function CodeRunner({ codeSnippet, initialLanguage = 'python' }) {
  const [language, setLanguage] = useState(initialLanguage)
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
        </div>

        <button
          onClick={handleRunCode}
          disabled={isLoading || !codeSnippet}
          className="run-button"
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
```

---

## Backend - CodeExecutionController (NEW)

```java
package Notes.taking.app.demo.controller;

import Notes.taking.app.demo.dto.CodeExecutionRequest;
import Notes.taking.app.demo.dto.CodeExecutionResponse;
import Notes.taking.app.demo.service.CodeExecutionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code")
@Slf4j
public class CodeExecutionController {
    
    private final CodeExecutionService codeExecutionService;
    
    public CodeExecutionController(CodeExecutionService codeExecutionService) {
        this.codeExecutionService = codeExecutionService;
    }
    
    @PostMapping("/run")
    public ResponseEntity<CodeExecutionResponse> executeCode(@RequestBody CodeExecutionRequest request) {
        log.info("Code execution request received for language: {}, code size: {}", 
                 request.getLanguage(), 
                 request.getCode() != null ? request.getCode().length() : 0);
        
        CodeExecutionResponse response = codeExecutionService.executeCode(request);
        return ResponseEntity.ok(response);
    }
}
```

---

## Backend - CodeExecutionService (NEW)

```java
package Notes.taking.app.demo.service;

import Notes.taking.app.demo.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

@Service
@Slf4j
public class CodeExecutionService {
    
    private static final String PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";
    private final RestTemplate restTemplate;
    
    public CodeExecutionService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    public CodeExecutionResponse executeCode(CodeExecutionRequest request) {
        try {
            // Validate input
            request.validate();
            
            // Build Piston API request
            PistonApiRequest pistonRequest = buildPistonRequest(request);
            
            // Call Piston API
            PistonApiResponse pistonResponse = restTemplate.postForObject(
                PISTON_API_URL,
                pistonRequest,
                PistonApiResponse.class
            );
            
            // Map response to our DTO
            return mapPistonResponse(pistonResponse);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError(e.getMessage());
            response.setExitCode(-1);
            return response;
        } catch (RestClientException e) {
            log.error("Error calling Piston API: {}", e.getMessage(), e);
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError("Failed to execute code: " + e.getMessage());
            response.setExitCode(-1);
            return response;
        } catch (Exception e) {
            log.error("Unexpected error during code execution: {}", e.getMessage(), e);
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError("Unexpected error: " + e.getMessage());
            response.setExitCode(-1);
            return response;
        }
    }
    
    private PistonApiRequest buildPistonRequest(CodeExecutionRequest request) {
        PistonApiRequest pistonRequest = new PistonApiRequest();
        pistonRequest.setLanguage(mapLanguage(request.getLanguage()));
        pistonRequest.setVersion("*");
        
        PistonApiRequest.PistonFile file = new PistonApiRequest.PistonFile();
        file.setName("main." + getFileExtension(request.getLanguage()));
        file.setContent(request.getCode());
        
        pistonRequest.setFiles(new PistonApiRequest.PistonFile[]{file});
        return pistonRequest;
    }
    
    private CodeExecutionResponse mapPistonResponse(PistonApiResponse pistonResponse) {
        CodeExecutionResponse response = new CodeExecutionResponse();
        
        if (pistonResponse != null) {
            PistonApiResponse.RunOutput runOutput = pistonResponse.getRun();
            PistonApiResponse.CompileOutput compileOutput = pistonResponse.getCompile();
            
            if (runOutput != null) {
                response.setStdout(runOutput.getStdout());
                response.setStderr(runOutput.getStderr());
                response.setExitCode(runOutput.getCode());
                response.setExecutionTime(runOutput.getTime());
            }
            
            if (compileOutput != null && runOutput == null) {
                response.setStdout(compileOutput.getStdout());
                response.setStderr(compileOutput.getStderr());
                response.setExitCode(compileOutput.getCode());
                response.setExecutionTime(compileOutput.getTime());
            }
        }
        
        return response;
    }
    
    private String mapLanguage(String language) {
        switch (language.toLowerCase()) {
            case "python": return "python";
            case "javascript": return "javascript";
            case "java": return "java";
            case "cpp": return "cpp";
            case "c": return "c";
            case "go": return "go";
            case "rust": return "rust";
            case "ruby": return "ruby";
            default: return language;
        }
    }
    
    private String getFileExtension(String language) {
        switch (language.toLowerCase()) {
            case "python": return "py";
            case "javascript": return "js";
            case "java": return "java";
            case "cpp": return "cpp";
            case "c": return "c";
            case "go": return "go";
            case "rust": return "rs";
            case "ruby": return "rb";
            default: return "txt";
        }
    }
}
```

---

## Backend - DemoApplication.java Changes

### BEFORE
```java
package notes.taking.app.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
```

### AFTER
```java
package notes.taking.app.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

}
```

---

## Frontend - codeExecutionService.js (NEW)

```javascript
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Add JWT token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Execute code via backend
export const executeCode = async (language, code) => {
  try {
    const response = await axiosInstance.post('/code/run', {
      language,
      code,
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to execute code')
    }
    throw new Error(error.message || 'Failed to execute code')
  }
}

export default {
  executeCode,
}
```

---

## Example API Calls

### Python Execution
```json
REQUEST:
{
  "language": "python",
  "code": "print('Hello, World!')\nfor i in range(3):\n    print(f'Count: {i}')"
}

RESPONSE:
{
  "stdout": "Hello, World!\nCount: 0\nCount: 1\nCount: 2\n",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 1234,
  "error": null
}
```

### JavaScript Execution
```json
REQUEST:
{
  "language": "javascript",
  "code": "console.log('Sum:', 5 + 3);\nconsole.log('Array:', [1, 2, 3]);"
}

RESPONSE:
{
  "stdout": "Sum: 8\nArray: [ 1, 2, 3 ]\n",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 856,
  "error": null
}
```

### Error Example (Invalid Code)
```json
REQUEST:
{
  "language": "python",
  "code": "print('Missing closing quote"
}

RESPONSE:
{
  "stdout": "",
  "stderr": "  File \"main.py\", line 1\n    print('Missing closing quote\n          ^\nSyntaxError: EOL while scanning string literal\n",
  "exitCode": 1,
  "executionTime": 234,
  "error": null
}
```

### Validation Error
```json
REQUEST:
{
  "language": "python",
  "code": "[10000+ character code]"
}

RESPONSE:
{
  "stdout": "",
  "stderr": "",
  "exitCode": -1,
  "executionTime": null,
  "error": "Code size exceeds maximum limit of 10000 characters"
}
```

---

**Generated:** April 28, 2026
