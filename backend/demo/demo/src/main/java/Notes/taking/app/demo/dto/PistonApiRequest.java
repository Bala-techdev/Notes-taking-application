package Notes.taking.app.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PistonApiRequest {
    private String language;
    private String version;
    private PistonFile[] files;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PistonFile {
        private String name;
        private String content;
    }
}
