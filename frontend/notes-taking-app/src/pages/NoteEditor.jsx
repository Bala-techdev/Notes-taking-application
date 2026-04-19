import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MonacoEditor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { createNote, getNotes, updateNote } from '../services/apiService'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDateTime, formatRelativeTime } from '../utils/time'

const emptyNote = {
  title: '',
  content: '',
  codeSnippet: '',
  tags: [],
  favorite: false,
  pinned: false,
}

const supportedLanguages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
]

function NoteEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(emptyNote)
  const [tagsInput, setTagsInput] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [viewMode, setViewMode] = useState('split')
  const [copyState, setCopyState] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle')
  const [timeTick, setTimeTick] = useState(0)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const hasPendingChangesRef = useRef(false)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeTick((current) => current + 1)
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const loadNote = async () => {
      if (!id) {
        setForm(emptyNote)
        setTagsInput('')
        setAutoSaveStatus('idle')
        hasPendingChangesRef.current = false
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
          tags: existingNote.tags || [],
          favorite: Boolean(existingNote.favorite),
          pinned: Boolean(existingNote.pinned),
          updatedAt: existingNote.updatedAt,
          versionUpdatedAt: existingNote.versionUpdatedAt || existingNote.updatedAt,
        })
        setTagsInput((existingNote.tags || []).join(', '))
        setAutoSaveStatus('saved')
        hasPendingChangesRef.current = false
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
    hasPendingChangesRef.current = true
    setForm((current) => ({ ...current, [name]: value }))
  }

  const buildPayload = () => {
    const normalizedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)

    return {
      title: form.title,
      content: form.content,
      codeSnippet: form.codeSnippet,
      tags: [...new Set(normalizedTags)],
      favorite: Boolean(form.favorite),
      pinned: Boolean(form.pinned),
    }
  }

  useEffect(() => {
    if (!id || isLoading || isSaving || !hasPendingChangesRef.current) {
      return
    }

    setAutoSaveStatus('saving')

    const saveTimer = window.setTimeout(async () => {
      try {
        const updatedNote = await updateNote(id, buildPayload())
        setForm((current) => ({
          ...current,
          updatedAt: updatedNote.updatedAt,
          versionUpdatedAt: updatedNote.versionUpdatedAt || updatedNote.updatedAt,
        }))
        hasPendingChangesRef.current = false
        setAutoSaveStatus('saved')
      } catch {
        setAutoSaveStatus('error')
      }
    }, 1200)

    return () => window.clearTimeout(saveTimer)
  }, [id, isLoading, isSaving, form.title, form.content, form.codeSnippet, form.favorite, form.pinned, tagsInput])

  const lastEditedLabel = useMemo(() => {
    if (!form.updatedAt) {
      return 'Not saved yet'
    }

    return `${formatRelativeTime(form.updatedAt, timeTick)} (${formatDateTime(form.updatedAt)})`
  }, [form.updatedAt, timeTick])

  const versionEditedLabel = useMemo(() => {
    const value = form.versionUpdatedAt || form.updatedAt
    if (!value) {
      return 'Not available'
    }

    return `${formatRelativeTime(value, timeTick)} (${formatDateTime(value)})`
  }, [form.versionUpdatedAt, form.updatedAt, timeTick])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const payload = buildPayload()

      if (id) {
        await updateNote(id, payload)
      } else {
        await createNote(payload)
      }
      hasPendingChangesRef.current = false
      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopySnippet = async () => {
    if (!form.codeSnippet.trim()) {
      setCopyState('Nothing to copy')
      return
    }

    try {
      await navigator.clipboard.writeText(form.codeSnippet)
      setCopyState('Copied')
      window.setTimeout(() => setCopyState(''), 1800)
    } catch {
      setCopyState('Copy failed')
    }
  }

  return (
    <section className="editor-shell">
      <div className="editor-header">
        <div>
          <p className="eyebrow">Notes</p>
          <h1>{id ? 'Edit note' : 'Create note'}</h1>
          <p className="note-meta">Last edited {lastEditedLabel}</p>
          <p className="note-meta">Version updated {versionEditedLabel}</p>
          {id ? (
            <p className={`autosave-meta autosave-meta--${autoSaveStatus}`}>
              {autoSaveStatus === 'saving' ? 'Auto-saving...' : autoSaveStatus === 'saved' ? 'Auto-saved' : autoSaveStatus === 'error' ? 'Auto-save failed. Continue editing or click Save note.' : 'Auto-save ready'}
            </p>
          ) : null}
        </div>
      </div>

      <form className="editor-form" onSubmit={handleSubmit}>
        {isLoading ? <LoadingSpinner label="Loading note..." /> : null}

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
          Tags
          <input
            type="text"
            name="tags"
            value={tagsInput}
            onChange={(event) => {
              hasPendingChangesRef.current = true
              setTagsInput(event.target.value)
            }}
            placeholder="Add tags separated by commas (example: java, backend, tutorial)"
            disabled={isLoading}
          />
        </label>

        <div className="note-flag-row">
          <label className="flag-checkbox">
            <input
              type="checkbox"
              checked={Boolean(form.favorite)}
              onChange={(event) => {
                hasPendingChangesRef.current = true
                setForm((current) => ({ ...current, favorite: event.target.checked }))
              }}
              disabled={isLoading}
            />
            Mark as favorite
          </label>

          <label className="flag-checkbox">
            <input
              type="checkbox"
              checked={Boolean(form.pinned)}
              onChange={(event) => {
                hasPendingChangesRef.current = true
                setForm((current) => ({ ...current, pinned: event.target.checked }))
              }}
              disabled={isLoading}
            />
            Pin to top
          </label>
        </div>

        <section className="markdown-workspace">
          <div className="editor-toolbar">
            <p className="editor-toolbar__title">Markdown content</p>
            <div className="mode-toggle" role="tablist" aria-label="Editor mode">
              <button
                type="button"
                className={`mode-button ${viewMode === 'edit' ? 'active' : ''}`}
                onClick={() => setViewMode('edit')}
              >
                Edit
              </button>
              <button
                type="button"
                className={`mode-button ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => setViewMode('preview')}
              >
                Preview
              </button>
              <button
                type="button"
                className={`mode-button ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
              >
                Split
              </button>
            </div>
          </div>

          <div className={`markdown-pane markdown-pane--${viewMode}`}>
            {viewMode === 'edit' || viewMode === 'split' ? (
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Write note content in Markdown..."
                rows="12"
                required
                disabled={isLoading}
                className="markdown-input"
              />
            ) : null}

            {viewMode === 'preview' || viewMode === 'split' ? (
              <div className="markdown-preview" aria-label="Markdown preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {form.content || 'Nothing to preview yet. Start writing Markdown on the left.'}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        </section>

        <section className="code-workspace">
          <div className="editor-toolbar">
            <p className="editor-toolbar__title">Code snippet</p>
            <div className="code-actions">
              <label className="code-language-select">
                <span>Language</span>
                <select value={codeLanguage} onChange={(event) => setCodeLanguage(event.target.value)}>
                  {supportedLanguages.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" className="secondary-button" onClick={handleCopySnippet}>
                Copy snippet
              </button>
              {copyState ? <span className="copy-feedback">{copyState}</span> : null}
            </div>
          </div>

          <MonacoEditor
            height="320px"
            language={codeLanguage}
            value={form.codeSnippet}
            onChange={(value) => {
              hasPendingChangesRef.current = true
              setForm((current) => ({ ...current, codeSnippet: value || '' }))
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
            }}
            theme="vs-dark"
          />
        </section>

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
