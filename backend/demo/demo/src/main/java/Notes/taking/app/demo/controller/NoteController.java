package notes.taking.app.demo.controller;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import notes.taking.app.demo.dto.NoteRequest;
import notes.taking.app.demo.dto.NoteResponse;
import notes.taking.app.demo.dto.NoteFlagRequest;
import notes.taking.app.demo.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(@Valid @RequestBody NoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.createNote(request));
    }

    @GetMapping
    public ResponseEntity<List<NoteResponse>> getNotesByUser(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "latest") String sort,
        @RequestParam(required = false) String tags
    ) {
        List<String> parsedTags = (tags == null || tags.trim().isEmpty())
            ? List.of()
            : Stream.of(tags.split(","))
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .collect(Collectors.toList());

        return ResponseEntity.ok(noteService.getNotesByUser(search, sort, parsedTags));
    }

    @GetMapping("/{noteId}")
    public ResponseEntity<NoteResponse> getNoteById(@PathVariable Long noteId) {
        return ResponseEntity.ok(noteService.getNoteById(noteId));
    }

    @PutMapping("/{noteId}")
    public ResponseEntity<NoteResponse> updateNote(@PathVariable Long noteId,
                                                   @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(noteService.updateNote(noteId, request));
    }

    @PatchMapping("/{noteId}/favorite")
    public ResponseEntity<NoteResponse> updateFavorite(@PathVariable Long noteId,
                                                       @Valid @RequestBody NoteFlagRequest request) {
        return ResponseEntity.ok(noteService.updateFavorite(noteId, request.getEnabled()));
    }

    @PatchMapping("/{noteId}/pin")
    public ResponseEntity<NoteResponse> updatePinned(@PathVariable Long noteId,
                                                     @Valid @RequestBody NoteFlagRequest request) {
        return ResponseEntity.ok(noteService.updatePinned(noteId, request.getEnabled()));
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long noteId) {
        noteService.deleteNote(noteId);
        return ResponseEntity.noContent().build();
    }
}

