import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { createNote, getNotes, updateNote } from '../services/apiService'

const emptyNote = {
  title: '',
  content: '',
  codeSnippet: '',
}

function NoteEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(emptyNote)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(id))

  useEffect(() => {
    const loadNote = async () => {
      if (!id) {
        setForm(emptyNote)
        setIsLoading(false)
        return
      }

      try {
        const notes = await getNotes()
        const existingNote = notes.find((note) => String(note.id) === String(id))

        if (!existingNote) {
          setError('Note not found.')
          return
        }

        setForm({
          id: existingNote.id,
          title: existingNote.title,
          content: existingNote.content,
          codeSnippet: existingNote.codeSnippet || '',
        })
      } catch (error) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadNote()
  }, [id])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      if (id) {
        await updateNote(id, form)
      } else {
        await createNote(form)
      }
      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="editor-shell">
      <div className="editor-header">
        <div>
          <p className="eyebrow">Notes</p>
          <h1>{id ? 'Edit note' : 'Create note'}</h1>
        </div>
      </div>

      <form className="editor-form" onSubmit={handleSubmit}>
        {isLoading ? <p className="note-meta">Loading note...</p> : null}

        <label>
          Title
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Note title"
            required
            disabled={isLoading}
          />
        </label>

        <label>
          Content
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Write a short summary..."
            rows="6"
            required
            disabled={isLoading}
          />
        </label>

        <label>
          Code snippet
          <textarea
            name="codeSnippet"
            value={form.codeSnippet}
            onChange={handleChange}
            placeholder="Paste code, SQL, JSON, or anything long-form here"
            rows="10"
            disabled={isLoading}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="hero-actions">
          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save note'}
          </button>
          <button type="button" className="secondary-button" onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default NoteEditor
