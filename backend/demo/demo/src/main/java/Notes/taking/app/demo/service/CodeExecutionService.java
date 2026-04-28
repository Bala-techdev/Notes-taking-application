package Notes.taking.app.demo.service;

import Notes.taking.app.demo.dto.*;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpClientErrorException;

@Service
@Slf4j
public class CodeExecutionService {
    
    private static final String PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";
    private final RestTemplate restTemplate;
    private final String pistonApiToken;
    
    public CodeExecutionService(RestTemplate restTemplate,
                                @Value("${app.piston.api-token:}") String pistonApiToken) {
        this.restTemplate = restTemplate;
        this.pistonApiToken = pistonApiToken;
    }
    
    public CodeExecutionResponse executeCode(CodeExecutionRequest request) {
        try {
            if (pistonApiToken == null || pistonApiToken.trim().isEmpty()) {
                throw new IllegalStateException(
                    "Piston API token is not configured. Set app.piston.api-token or PISTON_API_TOKEN."
                );
            }

            // Validate input
            request.validate();
            
            // Build Piston API request
            PistonApiRequest pistonRequest = buildPistonRequest(request);
            
            // Call Piston API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.setBearerAuth(pistonApiToken.trim());

            HttpEntity<PistonApiRequest> entity = new HttpEntity<>(pistonRequest, headers);
            PistonApiResponse pistonResponse = restTemplate.exchange(
                PISTON_API_URL,
                HttpMethod.POST,
                entity,
                PistonApiResponse.class
            ).getBody();
            
            // Map response to our DTO
            return mapPistonResponse(pistonResponse);
            
        } catch (HttpClientErrorException.Unauthorized e) {
            log.error("Piston API rejected the request with 401 Unauthorized", e);
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError("Piston API rejected the request with 401 Unauthorized. Check your Piston token.");
            response.setExitCode(-1);
            return response;
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
            // Get output from run or compile
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
        // Piston uses specific language identifiers
        switch (language.toLowerCase()) {
            case "python":
                return "python";
            case "javascript":
                return "javascript";
            case "java":
                return "java";
            case "cpp":
                return "cpp";
            case "c":
                return "c";
            case "go":
                return "go";
            case "rust":
                return "rust";
            case "ruby":
                return "ruby";
            default:
                return language;
        }
    }
    
    private String getFileExtension(String language) {
        switch (language.toLowerCase()) {
            case "python":
                return "py";
            case "javascript":
                return "js";
            case "java":
                return "java";
            case "cpp":
                return "cpp";
            case "c":
                return "c";
            case "go":
                return "go";
            case "rust":
                return "rs";
            case "ruby":
                return "rb";
            default:
                return "txt";
        }
    }
}
