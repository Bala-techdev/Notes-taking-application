# Quick Start - Code Execution Feature

## Setup & Running

### Backend (Spring Boot)
```bash
cd d:\Notes-taking-app\backend\demo\demo
.\mvnw.cmd spring-boot:run
# Server runs on http://localhost:8080
```

### Frontend (React)
```bash
cd d:\Notes-taking-app\frontend\notes-taking-app
npm run dev
# App runs on http://localhost:5173
```

---

## Testing the Feature

### Test Case 1: Python Code Execution

1. Log in to the application
2. Create a new note or open existing note
3. Add this code snippet:
   ```python
   for i in range(1, 6):
       print(f"Number: {i}")
   ```
4. Click "Run ▶" button
5. **Expected:** Output shows:
   ```
   Number: 1
   Number: 2
   Number: 3
   Number: 4
   Number: 5
   ```

### Test Case 2: JavaScript Execution

1. Create a note with JavaScript code:
   ```javascript
   function fibonacci(n) {
       if (n <= 1) return n;
       return fibonacci(n - 1) + fibonacci(n - 2);
   }
   console.log("Fibonacci(10):", fibonacci(10));
   ```
2. Select "JavaScript" from language dropdown
3. Click "Run ▶"
4. **Expected:** Output shows `Fibonacci(10): 55`

### Test Case 3: Java Execution

1. Create a note with Java code:
   ```java
   public class Main {
       public static void main(String[] args) {
           System.out.println("Hello from Java!");
           System.out.println("Sum: " + (5 + 3));
       }
   }
   ```
2. Select "Java" from language dropdown
3. Click "Run ▶"
4. **Expected:** Output shows:
   ```
   Hello from Java!
   Sum: 8
   ```

### Test Case 4: Error Handling

1. Create a note with invalid Python code:
   ```python
   print("Missing closing quote
   ```
2. Select "Python" from language dropdown
3. Click "Run ▶"
4. **Expected:** Error message displays in red box

### Test Case 5: Code Size Validation

1. Try to run a code snippet larger than 10,000 characters
2. **Expected:** Error message: "Code size exceeds maximum limit"

### Test Case 6: Unsupported Language

1. Try to add unsupported language (edit browser network request)
2. **Expected:** Error message: "Language not supported"

### Test Case 7: Clear Output

1. Execute any code
2. Click "Clear Output" button
3. **Expected:** Console and error messages disappear

---

## API Testing (Advanced)

### Using cURL (Windows PowerShell)

```powershell
# Get JWT token first (replace email/password)
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"user@example.com","password":"password123"}'

$token = $loginResponse.token

# Execute Python code
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/code/run" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $token"} `
  -Body '{
    "language":"python",
    "code":"print(\"Hello from API\")"
  }'

$response | ConvertTo-Json
```

### Using REST Client (VS Code Extension)

Create `test-code-execution.rest`:

```rest
### Login
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

### Execute Python Code
POST http://localhost:8080/api/code/run
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "language": "python",
  "code": "print('Hello, World!')"
}

### Execute JavaScript Code
POST http://localhost:8080/api/code/run
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "language": "javascript",
  "code": "console.log('5 + 3 =', 5 + 3)"
}

### Execute Java Code
POST http://localhost:8080/api/code/run
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "language": "java",
  "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello Java\"); } }"
}
```

---

## Debugging

### Enable Detailed Logging

**Backend** - Add to `application.properties`:
```properties
logging.level.Notes.taking.app.demo=DEBUG
logging.level.org.springframework.web=DEBUG
```

**Frontend** - Open browser DevTools (F12):
- Network tab: Check API requests to `/api/code/run`
- Console tab: Check for JavaScript errors
- Application tab: Check JWT token in localStorage

### Common Issues

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Ensure JWT token is valid and not expired |
| 400 Bad Request | Check request format matches API spec |
| 500 Server Error | Check backend logs for stack trace |
| Timeout | Piston API might be slow; try again |
| No output | Check console.log in JavaScript; System.out in Java |

---

## Code Examples by Language

### Python
```python
# Simple print
print("Hello, World!")

# Loop
for i in range(5):
    print(i)

# Function
def greet(name):
    return f"Hello, {name}!"
print(greet("Alice"))
```

### JavaScript
```javascript
// Simple output
console.log("Hello, World!");

// Array operations
const numbers = [1, 2, 3, 4, 5];
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));

// Function
function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
console.log("Factorial(5):", factorial(5));
```

### Java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
        }
        System.out.println("Sum: " + sum);
    }
}
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
        sum += i;
    }
    cout << "Sum: " << sum << endl;
    
    return 0;
}
```

---

## Performance Metrics

### Expected Response Times

| Language | Simple Code | Complex Code |
|----------|-----------|--------------|
| Python   | 1-2 sec   | 3-5 sec      |
| JavaScript | 0.5-1 sec | 2-4 sec    |
| Java     | 2-3 sec   | 4-6 sec      |
| C++      | 1-2 sec   | 3-4 sec      |

*Times include API call overhead and Piston execution*

---

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs: Check spring-boot console output
3. Review frontend logs: Check browser DevTools (F12)
4. Verify Piston API is available: https://emkc.org/api/v2/piston/
5. Check code size: Must be ≤ 10,000 characters
6. Verify authentication: JWT token must be valid

---

**Last Updated:** April 28, 2026
