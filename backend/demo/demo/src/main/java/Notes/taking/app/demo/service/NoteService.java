package notes.taking.app.demo.service;

import java.util.List;

import notes.taking.app.demo.dto.NoteRequest;
import notes.taking.app.demo.dto.NoteResponse;

public interface NoteService {

    NoteResponse createNote(NoteRequest request);

    NoteResponse updateNote(Long noteId, NoteRequest request);

    NoteResponse updateFavorite(Long noteId, boolean enabled);

    NoteResponse updatePinned(Long noteId, boolean enabled);

    void deleteNote(Long noteId);

    NoteResponse getNoteById(Long noteId);

    List<NoteResponse> getNotesByUser(String search, String sort, List<String> tags);
}

