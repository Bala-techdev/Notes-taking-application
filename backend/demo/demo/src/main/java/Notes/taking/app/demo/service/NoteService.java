package Notes.taking.app.demo.service;

import java.util.List;

import Notes.taking.app.demo.dto.NoteRequestDto;
import Notes.taking.app.demo.dto.NoteResponseDto;

public interface NoteService {

    NoteResponseDto createNote(String email, NoteRequestDto requestDto);

    NoteResponseDto updateNote(String email, Long noteId, NoteRequestDto requestDto);

    void deleteNote(String email, Long noteId);

    List<NoteResponseDto> getNotesByUser(String email);
}
