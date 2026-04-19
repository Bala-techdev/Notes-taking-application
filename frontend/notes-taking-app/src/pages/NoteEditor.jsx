import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MonacoEditor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { createNote, getNotes, updateNote } from '../services/apiService'
import LoadingSpinner from '../components/LoadingSpinner'

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
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(id))

  useEffect(() => {
    const loadNote = async () => {
      if (!id) {
        setForm(emptyNote)
        setTagsInput('')
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
        })
        setTagsInput((existingNote.tags || []).join(', '))
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
      const normalizedTags = tagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)

      const payload = {
        title: form.title,
        content: form.content,
        codeSnippet: form.codeSnippet,
        tags: [...new Set(normalizedTags)],
        favorite: Boolean(form.favorite),
        pinned: Boolean(form.pinned),
      }

      if (id) {
        await updateNote(id, payload)
      } else {
        await createNote(payload)
      }
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
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="Add tags separated by commas (example: java, backend, tutorial)"
            disabled={isLoading}
          />
        </label>

        <div className="note-flag-row">
          <label className="flag-checkbox">
            <input
              type="checkbox"
              checked={Boolean(form.favorite)}
              onChange={(event) => setForm((current) => ({ ...current, favorite: event.target.checked }))}
              disabled={isLoading}
            />
            Mark as favorite
          </label>

          <label className="flag-checkbox">
            <input
              type="checkbox"
              checked={Boolean(form.pinned)}
              onChange={(event) => setForm((current) => ({ ...current, pinned: event.target.checked }))}
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
            onChange={(value) => setForm((current) => ({ ...current, codeSnippet: value || '' }))}
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
