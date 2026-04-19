package notes.taking.app.demo.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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
        note.setTags(normalizeTags(request.getTags()));
        note.setFavorite(parseFlag(request.getFavorite()));
        note.setPinned(parseFlag(request.getPinned()));

        Note updated = noteRepository.save(note);
        return mapToResponse(updated);
    }

    @Override
    public NoteResponse updateFavorite(Long noteId, boolean enabled) {
        User user = getCurrentUser();

        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        note.setFavorite(enabled);
        return mapToResponse(noteRepository.save(note));
    }

    @Override
    public NoteResponse updatePinned(Long noteId, boolean enabled) {
        User user = getCurrentUser();

        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        note.setPinned(enabled);
        return mapToResponse(noteRepository.save(note));
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
    public NoteResponse getNoteById(Long noteId) {
        User user = getCurrentUser();

        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        return mapToResponse(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteResponse> getNotesByUser(String search, String sort, List<String> tags) {
        User user = getCurrentUser();

        Sort ordering = "oldest".equalsIgnoreCase(sort)
            ? Sort.by(Sort.Direction.ASC, "updatedAt")
            : Sort.by(Sort.Direction.DESC, "updatedAt");
        ordering = Sort.by(Sort.Direction.DESC, "pinned").and(ordering);

        Specification<Note> specification = (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("user").get("id"), user.getId());

        if (search != null && !search.trim().isEmpty()) {
            String normalizedSearch = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), normalizedSearch),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("content")), normalizedSearch)
                )
            );
        }

        Set<String> normalizedTags = normalizeTags(tags);
        if (!normalizedTags.isEmpty()) {
            specification = specification.and((root, query, criteriaBuilder) -> {
                query.distinct(true);
                return root.join("tags").in(normalizedTags);
            });
        }

        return noteRepository.findAll(specification, ordering)
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
                .tags(normalizeTags(request.getTags()))
                .favorite(parseFlag(request.getFavorite()))
                .pinned(parseFlag(request.getPinned()))
                .user(user)
                .build();
    }

    private boolean parseFlag(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private Set<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return new LinkedHashSet<>();
        }

        return tags.stream()
                .filter(tag -> tag != null && !tag.trim().isEmpty())
                .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }

    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .userId(note.getUser().getId())
                .title(note.getTitle())
                .content(note.getContent())
                .codeSnippet(note.getCodeSnippet())
                .tags(note.getTags() == null ? List.of() : note.getTags().stream().toList())
                .favorite(Boolean.TRUE.equals(note.getFavorite()))
                .pinned(Boolean.TRUE.equals(note.getPinned()))
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .versionUpdatedAt(note.getVersionUpdatedAt())
                .build();
    }
}

