package notes.taking.app.demo.service;

import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import notes.taking.app.demo.dto.NoteRequest;
import notes.taking.app.demo.dto.NoteResponse;
import notes.taking.app.demo.entity.Note;
import notes.taking.app.demo.entity.User;
import notes.taking.app.demo.exception.ResourceNotFoundException;
import notes.taking.app.demo.repository.NoteRepository;
import notes.taking.app.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    @Override
    public NoteResponse createNote(NoteRequest request) {
        User user = getCurrentUser();

        Note note = mapToEntity(request, user);

        Note saved = noteRepository.save(note);
        return mapToResponse(saved);
    }

    @Override
    public NoteResponse updateNote(Long noteId, NoteRequest request) {
        User user = getCurrentUser();

        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        note.setCodeSnippet(request.getCodeSnippet());

        Note updated = noteRepository.save(note);
        return mapToResponse(updated);
    }

    @Override
    public void deleteNote(Long noteId) {
        User user = getCurrentUser();

        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));
        noteRepository.delete(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteResponse> getNotesByUser() {
        User user = getCurrentUser();

        return noteRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Note mapToEntity(NoteRequest request, User user) {
        return Note.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .codeSnippet(request.getCodeSnippet())
                .user(user)
                .build();
    }

    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .userId(note.getUser().getId())
                .title(note.getTitle())
                .content(note.getContent())
                .codeSnippet(note.getCodeSnippet())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}

