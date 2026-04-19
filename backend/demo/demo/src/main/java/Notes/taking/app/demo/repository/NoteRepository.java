package notes.taking.app.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import notes.taking.app.demo.entity.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long>, JpaSpecificationExecutor<Note> {

	List<Note> findByUserIdOrderByUpdatedAtDesc(Long userId);

	Optional<Note> findByIdAndUserId(Long id, Long userId);
}

