package Notes.taking.app.demo.service;

import java.util.List;

import Notes.taking.app.demo.dto.NoteRequestDto;
import Notes.taking.app.demo.dto.NoteResponseDto;

public interface NoteService {

    NoteResponseDto createNote(NoteRequestDto requestDto);

    NoteResponseDto updateNote(Long noteId, NoteRequestDto requestDto);

    void deleteNote(Long noteId);

    List<NoteResponseDto> getNotesByUser();
}
