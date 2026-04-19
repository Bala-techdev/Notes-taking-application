import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCurrentUser } from '../services/authService'
import { deleteNote, getNotes, updateNoteFavorite, updateNotePinned } from '../services/apiService'
import LoadingSpinner from '../components/LoadingSpinner'

function StarIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path
        d="M14 3l7 7-2 2-2-2-3 3v4l-2 2v-6l-3-3-2 2-2-2 7-7z"
        fill="currentColor"
      />
    </svg>
  )
}

function Dashboard() {
  const [currentUser] = useState(() => getCurrentUser())
  const [notes, setNotes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('latest')
  const [selectedTags, setSelectedTags] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const debounceTimer = window.setTimeout(async () => {
      if (!currentUser) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data = await getNotes({
          search: searchTerm,
          sort: sortOrder,
          tags: selectedTags,
        })
        setNotes(data)
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => window.clearTimeout(debounceTimer)
  }, [currentUser, searchTerm, sortOrder, selectedTags])

  const availableTags = [...new Set(notes.flatMap((note) => note.tags || []))]

  const sortNotesForView = (items, currentSort) => {
    const factor = currentSort === 'oldest' ? 1 : -1

    return [...items].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return Boolean(a.pinned) ? -1 : 1
      }

      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return (dateA - dateB) * factor
    })
  }

  const handleDelete = async (noteId) => {
    setError('')
    try {
      await deleteNote(noteId)
      setNotes((current) => current.filter((note) => note.id !== noteId))
    } catch (error) {
      setError(error.message)
    }
  }

  const toggleTag = (tag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSortOrder('latest')
    setSelectedTags([])
  }

  const replaceNoteInList = (updatedNote) => {
    setNotes((current) =>
      sortNotesForView(
        current.map((note) => (note.id === updatedNote.id ? updatedNote : note)),
        sortOrder
      )
    )
  }

  const handleFavoriteToggle = async (note) => {
    try {
      const updated = await updateNoteFavorite(note.id, !note.favorite)
      replaceNoteInList(updated)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handlePinToggle = async (note) => {
    try {
      const updated = await updateNotePinned(note.id, !note.pinned)
      replaceNoteInList(updated)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="dashboard-grid">
      <div className="hero-panel">
        <p className="eyebrow">Your space</p>
        <h2>Dashboard</h2>
        <p className="lede">
          Organize ideas, references, and snippets in a clean writing-focused workspace.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/notes/new">
            Create Note
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Your notes</h2>
          <span>{notes.length} saved</span>
        </div>

        <div className="note-filters">
          <input
            type="search"
            placeholder="Search by title or content"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search notes"
          />

          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort notes">
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button type="button" className="secondary-button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        {availableTags.length > 0 ? (
          <div className="tag-filter-row">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        <div className="note-list">
          {isLoading ? (
            <LoadingSpinner label="Loading your notes..." />
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <h3>No notes yet</h3>
              <p>Start with your first note and build your personal knowledge library.</p>
              <Link className="primary-button" to="/notes/new">
                Create first note
              </Link>
            </div>
          ) : (
            notes.map((note) => (
              <article key={note.id} className="note-card">
                <div className="note-card__header">
                  <div>
                    <p className="note-meta">Updated {new Date(note.updatedAt).toLocaleString()}</p>
                    <h3>{note.title}</h3>
                  </div>
                  <div className="note-status-actions">
                    <button
                      type="button"
                      className={`icon-toggle ${note.favorite ? 'active' : ''}`}
                      onClick={() => handleFavoriteToggle(note)}
                      aria-label={note.favorite ? 'Remove favorite' : 'Mark as favorite'}
                      title={note.favorite ? 'Favorite' : 'Mark as favorite'}
                    >
                      <StarIcon filled={note.favorite} />
                    </button>
                    <button
                      type="button"
                      className={`icon-toggle ${note.pinned ? 'active pinned' : ''}`}
                      onClick={() => handlePinToggle(note)}
                      aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                      title={note.pinned ? 'Pinned to top' : 'Pin to top'}
                    >
                      <PinIcon />
                    </button>
                    <span className="note-badge">{note.pinned ? 'Pinned' : 'Snippet ready'}</span>
                  </div>
                </div>

                <p>{note.content}</p>
                {note.codeSnippet ? <pre>{note.codeSnippet}</pre> : null}

                {note.tags && note.tags.length > 0 ? (
                  <div className="note-tags">
                    {note.tags.map((tag) => (
                      <button
                        key={`${note.id}-${tag}`}
                        type="button"
                        className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                ) : null}

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
