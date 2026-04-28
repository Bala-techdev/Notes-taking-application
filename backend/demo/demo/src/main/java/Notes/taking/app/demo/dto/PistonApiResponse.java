package Notes.taking.app.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PistonApiResponse {
    
    @JsonProperty("run")
    private RunOutput run;
    
    @JsonProperty("compile")
    private CompileOutput compile;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunOutput {
        private String stdout;
        private String stderr;
        private Integer code;
        private String signal;
        private Long time;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompileOutput {
        private String stdout;
        private String stderr;
        private Integer code;
        private String signal;
        private Long time;
    }
}
