package Notes.taking.app.demo.controller;

import Notes.taking.app.demo.dto.CodeExecutionRequest;
import Notes.taking.app.demo.dto.CodeExecutionResponse;
import Notes.taking.app.demo.service.LocalAwareCodeExecutionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code")
@Slf4j
public class CodeExecutionController {
    
    private final LocalAwareCodeExecutionService codeExecutionService;
    
    public CodeExecutionController(LocalAwareCodeExecutionService codeExecutionService) {
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
