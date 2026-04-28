# Code Execution Feature - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        NoteView Page                                 │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  Note Title                                                  │  │   │
│  │  │  Note Content (Markdown)                                    │  │   │
│  │  │  ┌────────────────────────────────────────────────────────┐ │  │   │
│  │  │  │ Code Snippet Display                                  │ │  │   │
│  │  │  │ [code here]                                           │ │  │   │
│  │  │  └────────────────────────────────────────────────────────┘ │  │   │
│  │  │                                                              │  │   │
│  │  │  ┌────────────────────────────────────────────────────────┐ │  │   │
│  │  │  │         CodeRunner Component (NEW)                    │ │  │   │
│  │  │  │                                                        │ │  │   │
│  │  │  │  Language: [Python ▼]  [Run ▶] [Clear Output]       │ │  │   │
│  │  │  │                                                        │ │  │   │
│  │  │  │  ┌──────────────────────────────────────────────┐   │ │  │   │
│  │  │  │  │ Console Output (Terminal Style)             │   │ │  │   │
│  │  │  │  │ > Hello, World!                             │   │ │  │   │
│  │  │  │  │ > Process exited with code 0                │   │ │  │   │
│  │  │  │  └──────────────────────────────────────────────┘   │ │  │   │
│  │  │  │                                                        │ │  │   │
│  │  │  └────────────────────────────────────────────────────────┘ │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                ↓                                             │
│                     codeExecutionService.js                                  │
│                     (Axios with JWT Interceptor)                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                ↓
                    ┌──────────────────────┐
                    │   Network Request    │
                    │  POST /api/code/run  │
                    │   + JWT Bearer Token │
                    └──────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SPRING BOOT BACKEND                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              CodeExecutionController                               │    │
│  │  POST /api/code/run                                               │    │
│  │  - Authentication required (JWT)                                  │    │
│  │  - Request body: { language, code }                              │    │
│  │  - Delegates to CodeExecutionService                             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                ↓                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              CodeExecutionService                                  │    │
│  │  1. Validate input:                                               │    │
│  │     - Code size ≤ 10,000 characters                              │    │
│  │     - Language in whitelist (python, java, js, cpp, c, go, ...)  │    │
│  │  2. Build PistonApiRequest                                        │    │
│  │  3. Call Piston API via RestTemplate                             │    │
│  │  4. Map PistonApiResponse to CodeExecutionResponse               │    │
│  │  5. Return response with stdout/stderr/exitCode                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                ↓                                              │
│                     RestTemplate (HTTP Client)                               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                ↓
                    ┌──────────────────────────────┐
                    │   Piston API Request        │
                    │   POST /api/v2/piston/      │
                    │   execute                    │
                    │                              │
                    │   {                          │
                    │     "language": "python",    │
                    │     "version": "*",          │
                    │     "files": [...]           │
                    │   }                          │
                    └──────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL - PISTON API                                     │
│              (https://emkc.org/api/v2/piston/execute)                       │
│                                                                               │
│  Sandboxed Code Execution Environment                                        │
│  ✓ Supports 90+ programming languages                                        │
│  ✓ Free, no rate limits                                                      │
│  ✓ Isolated execution containers                                             │
│                                                                               │
│  Process Code:                                                               │
│  1. Create temporary execution environment                                   │
│  2. Write code file to container                                             │
│  3. Compile (if needed) or interpret                                         │
│  4. Capture stdout, stderr, exit code                                        │
│  5. Return results                                                           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                ↓
                    ┌──────────────────────────────┐
                    │   Piston API Response       │
                    │                              │
                    │   {                          │
                    │     "run": {                 │
                    │       "stdout": "...",       │
                    │       "stderr": "...",       │
                    │       "code": 0,             │
                    │       "time": 1234           │
                    │     },                       │
                    │     "compile": {...}         │
                    │   }                          │
                    └──────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SPRING BOOT BACKEND                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  CodeExecutionService:                                                       │
│  - Map Piston response to CodeExecutionResponse                             │
│  - Extract stdout/stderr/exitCode                                           │
│  - Handle errors and timeouts                                               │
│                                ↓                                              │
│  CodeExecutionController:                                                    │
│  - Return CodeExecutionResponse (JSON)                                       │
│  - HTTP 200 OK with response body                                           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                ↓
                    ┌──────────────────────────┐
                    │   Network Response       │
                    │   HTTP 200 OK            │
                    │   JSON Response Body     │
                    └──────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  codeExecutionService.js:                                                    │
│  - Parse JSON response                                                       │
│  - Return data to CodeRunner component                                       │
│                                ↓                                              │
│  CodeRunner Component:                                                       │
│  - Stop loading spinner                                                      │
│  - Display output in console box                                             │
│  - Format with terminal styling                                              │
│  - Show error message if present                                             │
│                                                                               │
│  User sees:                                                                  │
│  ┌────────────────────────────────────────────────────┐                     │
│  │ Console Output (Terminal Style)                   │                     │
│  │ > Hello, World!                                   │                     │
│  │ > Process exited with code 0                      │                     │
│  └────────────────────────────────────────────────────┘                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Input (Code + Language)
           ↓
      CodeRunner.jsx
      - Validates code not empty
      - Shows loading spinner
      - Calls executeCode()
           ↓
   codeExecutionService.js
   - Adds JWT Bearer token
   - POST to /api/code/run
           ↓
   CodeExecutionController
   - Authenticates request
   - Passes to service
           ↓
   CodeExecutionService
   - Validates code size (≤ 10KB)
   - Validates language (whitelist)
   - Builds Piston request
   - Calls RestTemplate.postForObject()
           ↓
   Piston API
   - Compiles/interprets code
   - Captures output
   - Returns results
           ↓
   CodeExecutionService
   - Maps Piston response to DTO
   - Handles errors
   - Returns response
           ↓
   CodeExecutionController
   - Returns HTTP 200 + JSON
           ↓
   codeExecutionService.js
   - Returns promise result
           ↓
   CodeRunner.jsx
   - Stops loading spinner
   - Displays output or error
   - Updates state
           ↓
      User Sees Output
```

## Error Handling Flow

```
User Runs Code
      ↓
Frontend Validation
- Code empty? → Show "No code to execute"
      ↓
API Call (JWT included)
      ↓
Backend Validation
- Code > 10KB? → Return validation error
- Language unknown? → Return validation error
      ↓
API Call (to Piston)
      ↓
Network Issues?
- Timeout? → Return "Failed to execute"
- Connection error? → Return API error message
      ↓
Piston Response
- Compile error? → Return in stderr
- Runtime error? → Return in stderr
- Success? → Return stdout
      ↓
Frontend Display
- Error field set? → Show red error box
- stderr present? → Show in console
- stdout present? → Show in console
- No output? → Show "No output returned"
      ↓
User Sees Formatted Output
```

## Component Hierarchy

```
App (React Router)
 │
 └── NoteView (Page)
      │
      ├── LoadingSpinner
      ├── Note Content (Markdown)
      └── CodeRunner (NEW)
           │
           ├── Language Dropdown
           ├── Run Button
           ├── Clear Button
           ├── Loading Spinner
           ├── Console Output Box
           └── Error Message
```

## Authentication Flow

```
Browser Session
      ↓
Login API Call
      ↓
Backend Authenticates Email + Password
      ↓
JWT Token Generated
      ↓
Token Stored in localStorage
      ↓
CodeRunner Component (Run Code)
      ↓
codeExecutionService.js
- Reads token from localStorage
- Adds to Authorization header: "Bearer <token>"
      ↓
CodeExecutionController
- Receives request with token
- Spring Security validates token
- Extracts user information
- Allows request to proceed
      ↓
Code Executes
```

---

**Generated:** April 28, 2026
