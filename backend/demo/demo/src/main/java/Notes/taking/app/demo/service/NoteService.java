package Notes.taking.app.demo.service;

import java.util.List;

import Notes.taking.app.demo.dto.NoteRequest;
import Notes.taking.app.demo.dto.NoteResponse;

public interface NoteService {

    NoteResponse createNote(NoteRequest request);

    NoteResponse updateNote(Long noteId, NoteRequest request);

    void deleteNote(Long noteId);

    List<NoteResponse> getNotesByUser();
}
