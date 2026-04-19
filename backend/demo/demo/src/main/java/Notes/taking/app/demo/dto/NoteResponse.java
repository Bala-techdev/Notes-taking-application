package notes.taking.app.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteResponse {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String codeSnippet;
    private List<String> tags;
    private Boolean favorite;
    private Boolean pinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

