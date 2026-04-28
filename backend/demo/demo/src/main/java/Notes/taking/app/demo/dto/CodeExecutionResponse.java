package Notes.taking.app.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeExecutionResponse {
    private String stdout;
    private String stderr;
    private Integer exitCode;
    private Long executionTime;
    private String error; // Error from our API processing
    
    public boolean hasError() {
        return error != null && !error.isEmpty();
    }
    
    public String getOutput() {
        if (error != null && !error.isEmpty()) {
            return "Error: " + error;
        }
        if (stderr != null && !stderr.isEmpty()) {
            return stderr;
        }
        return stdout != null ? stdout : "";
    }
}
