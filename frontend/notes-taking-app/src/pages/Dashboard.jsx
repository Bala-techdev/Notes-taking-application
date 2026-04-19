import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCurrentUser } from '../services/authService'
import { deleteNote, getNotes, updateNoteFavorite, updateNotePinned } from '../services/apiService'
import LoadingSpinner from '../components/LoadingSpinner'
import NoteCard from '../components/NoteCard'

function Dashboard() {
  const [currentUser] = useState(() => getCurrentUser())
  const [allNotes, setAllNotes] = useState([])
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

  useEffect(() => {
    const fetchAllNotes = async () => {
      if (!currentUser) {
        return
      }

      try {
        const data = await getNotes({ sort: 'latest' })
        setAllNotes(data)
      } catch {
        // Keep the main list behavior unchanged when stats fetch fails.
      }
    }

    fetchAllNotes()
  }, [currentUser])

  const availableTags = [...new Set(allNotes.flatMap((note) => note.tags || []))]

  const totalNotesCount = allNotes.length
  const pinnedNotesCount = allNotes.filter((note) => note.pinned).length
  const favoriteNotesCount = allNotes.filter((note) => note.favorite).length

  const recentNotes = [...allNotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const favoriteNotes = [...allNotes]
    .filter((note) => note.favorite)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

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
      setAllNotes((current) => current.filter((note) => note.id !== noteId))
    } catch (error) {
      setError(error.message)
    }
  }

  const replaceNoteInList = (updatedNote) => {
    setNotes((current) =>
      current.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    )
    setAllNotes((current) =>
      current.map((note) => (note.id === updatedNote.id ? updatedNote : note))
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

  return (
    <section className="dashboard-shell">
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

      <section className="stats-grid" aria-label="Notes statistics">
        <article className="stat-card">
          <p className="stat-card__label">Total notes</p>
          <p className="stat-card__value">{totalNotesCount}</p>
        </article>

        <article className="stat-card">
          <p className="stat-card__label">Pinned notes</p>
          <p className="stat-card__value">{pinnedNotesCount}</p>
        </article>

        <article className="stat-card">
          <p className="stat-card__label">Favorite notes</p>
          <p className="stat-card__value">{favoriteNotesCount}</p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--highlights">
        <div className="panel">
          <div className="panel-heading">
            <h2>Recent notes</h2>
            <span>{recentNotes.length} shown</span>
          </div>

          {recentNotes.length > 0 ? (
            <div className="quick-note-list">
              {recentNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  onFavoriteToggle={handleFavoriteToggle}
                  onPinToggle={handlePinToggle}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No recent notes</h3>
              <p>Create your first note to see activity here.</p>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Favorite notes</h2>
            <span>{favoriteNotesCount} total</span>
          </div>

          {favoriteNotes.length > 0 ? (
            <div className="quick-note-list">
              {favoriteNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  onFavoriteToggle={handleFavoriteToggle}
                  onPinToggle={handlePinToggle}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No favorites yet</h3>
              <p>Mark notes with the star icon to keep your top ideas here.</p>
            </div>
          )}
        </div>
      </section>

      <div className="panel">
        <div className="panel-heading">
          <h2>Your notes</h2>
          <span>{notes.length} in view</span>
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
              <NoteCard
                key={note.id}
                note={note}
                onDelete={handleDelete}
                onFavoriteToggle={handleFavoriteToggle}
                onPinToggle={handlePinToggle}
              />
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default Dashboard
