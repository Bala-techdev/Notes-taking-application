package Notes.taking.app.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import Notes.taking.app.demo.entity.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

	List<Note> findByUserEmailOrderByUpdatedAtDesc(String email);

	Optional<Note> findByIdAndUserEmail(Long id, String email);
}
