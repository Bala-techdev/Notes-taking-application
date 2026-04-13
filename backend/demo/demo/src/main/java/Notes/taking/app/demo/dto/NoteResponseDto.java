package Notes.taking.app.demo.dto;

import java.time.LocalDateTime;

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
public class NoteResponseDto {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String codeSnippet;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
