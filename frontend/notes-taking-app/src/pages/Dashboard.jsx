import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getCurrentUser, logout } from '../services/authService'
import { deleteNote, getNotes } from '../services/apiService'

function Dashboard() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      if (!currentUser) {
        setIsLoading(false)
        return
      }

      try {
        const data = await getNotes()
        setNotes(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [currentUser])

  const handleDelete = async (noteId) => {
    setError('')
    try {
      await deleteNote(noteId)
      setNotes((current) => current.filter((note) => note.id !== noteId))
    } catch (error) {
      setError(error.message)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <section className="dashboard-grid">
      <div className="hero-panel">
        <p className="eyebrow">Workspace</p>
        <h1>Dashboard</h1>
        <p className="lede">
          Organize your ideas, code snippets, and project notes in one place.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/notes/new">
            Create Note
          </Link>
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Your notes</h2>
          <span>{notes.length} saved</span>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="note-list">
          {isLoading ? (
            <div className="empty-state">
              <h3>Loading notes...</h3>
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <h3>No notes yet</h3>
              <p>Create your first note to get started.</p>
            </div>
          ) : (
            notes.map((note) => (
              <article key={note.id} className="note-card">
                <div className="note-card__header">
                  <div>
                    <p className="note-meta">Updated {new Date(note.updatedAt).toLocaleString()}</p>
                    <h3>{note.title}</h3>
                  </div>
                  <span className="note-badge">Snippet ready</span>
                </div>

                <p>{note.content}</p>
                {note.codeSnippet ? <pre>{note.codeSnippet}</pre> : null}

                <div className="note-actions">
                  <Link to={`/notes/${note.id}`} className="text-button">
                    Edit
                  </Link>
                  <button type="button" className="text-button danger" onClick={() => handleDelete(note.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default Dashboard
