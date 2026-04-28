package Notes.taking.app.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionRequest {
    private String language;
    private String code;
    
    // Validation constants
    private static final int MAX_CODE_SIZE = 10000; // 10KB
    private static final String[] ALLOWED_LANGUAGES = {"python", "javascript", "java", "cpp", "c", "go", "rust", "ruby"};
    
    public void validate() {
        if (code == null || code.isEmpty()) {
            throw new IllegalArgumentException("Code cannot be empty");
        }
        
        if (code.length() > MAX_CODE_SIZE) {
            throw new IllegalArgumentException("Code size exceeds maximum limit of " + MAX_CODE_SIZE + " characters");
        }
        
        if (language == null || language.isEmpty()) {
            throw new IllegalArgumentException("Language must be specified");
        }
        
        boolean isAllowed = false;
        for (String lang : ALLOWED_LANGUAGES) {
            if (lang.equalsIgnoreCase(language)) {
                isAllowed = true;
                break;
            }
        }
        
        if (!isAllowed) {
            throw new IllegalArgumentException("Language '" + language + "' is not supported");
        }
    }
}
