package Notes.taking.app.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Notes.taking.app.demo.dto.NoteRequestDto;
import Notes.taking.app.demo.dto.NoteResponseDto;
import Notes.taking.app.demo.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping
    public ResponseEntity<NoteResponseDto> createNote(Authentication authentication,
                                                      @Valid @RequestBody NoteRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.createNote(authentication.getName(), requestDto));
    }

    @GetMapping
    public ResponseEntity<List<NoteResponseDto>> getNotesByUser(Authentication authentication) {
        return ResponseEntity.ok(noteService.getNotesByUser(authentication.getName()));
    }

    @PutMapping("/{noteId}")
    public ResponseEntity<NoteResponseDto> updateNote(Authentication authentication,
                                                      @PathVariable Long noteId,
                                                      @Valid @RequestBody NoteRequestDto requestDto) {
        return ResponseEntity.ok(noteService.updateNote(authentication.getName(), noteId, requestDto));
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(Authentication authentication, @PathVariable Long noteId) {
        noteService.deleteNote(authentication.getName(), noteId);
        return ResponseEntity.noContent().build();
    }
}
