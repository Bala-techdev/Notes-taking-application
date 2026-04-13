package Notes.taking.app.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Notes.taking.app.demo.dto.NoteRequestDto;
import Notes.taking.app.demo.dto.NoteResponseDto;
import Notes.taking.app.demo.entity.Note;
import Notes.taking.app.demo.entity.User;
import Notes.taking.app.demo.exception.ResourceNotFoundException;
import Notes.taking.app.demo.repository.NoteRepository;
import Notes.taking.app.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    @Override
    public NoteResponseDto createNote(String email, NoteRequestDto requestDto) {
        User user = getUserByEmail(email);

        Note note = Note.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .codeSnippet(requestDto.getCodeSnippet())
                .user(user)
                .build();

        Note saved = noteRepository.save(note);
        return mapToResponse(saved);
    }

    @Override
    public NoteResponseDto updateNote(String email, Long noteId, NoteRequestDto requestDto) {
        Note note = noteRepository.findByIdAndUserEmail(noteId, email)
            .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        note.setTitle(requestDto.getTitle());
        note.setContent(requestDto.getContent());
        note.setCodeSnippet(requestDto.getCodeSnippet());

        Note updated = noteRepository.save(note);
        return mapToResponse(updated);
    }

    @Override
    public void deleteNote(String email, Long noteId) {
        Note note = noteRepository.findByIdAndUserEmail(noteId, email)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));
        noteRepository.delete(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteResponseDto> getNotesByUser(String email) {
        return noteRepository.findByUserEmailOrderByUpdatedAtDesc(email)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private NoteResponseDto mapToResponse(Note note) {
        return NoteResponseDto.builder()
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
