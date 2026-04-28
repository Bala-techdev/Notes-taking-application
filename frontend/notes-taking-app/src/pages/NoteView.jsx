import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import LoadingSpinner from '../components/LoadingSpinner'
import CodeRunner from '../components/CodeRunner'
import { deleteNote, getNoteById } from '../services/apiService'
import { formatDateTime, formatRelativeTime } from '../utils/time'

function NoteView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [note, setNote] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeTick, setTimeTick] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeTick((current) => current + 1)
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const loadNote = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getNoteById(id)
        setNote(data)
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadNote()
  }, [id])

  const createdLabel = useMemo(() => formatDateTime(note?.createdAt), [note?.createdAt])
  const updatedLabel = useMemo(() => {
    if (!note?.updatedAt) {
      return 'Not available'
    }

    return `${formatRelativeTime(note.updatedAt, timeTick)} (${formatDateTime(note.updatedAt)})`
  }, [note?.updatedAt, timeTick])

  const handleDelete = async () => {
    if (!note) {
      return
    }

    const confirmed = window.confirm(`Delete "${note.title}"? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      await deleteNote(note.id)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="note-view-shell">
      {isLoading ? <LoadingSpinner label="Loading note..." /> : null}

      {!isLoading && error ? (
        <div className="empty-state note-view-error">
          <h1>Note unavailable</h1>
          <p>{error}</p>
          <button type="button" className="primary-button" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      ) : null}

      {!isLoading && note ? (
        <article className="note-article">
          <div className="note-article__header">
            <button type="button" className="secondary-button" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>

            <div className="note-article__actions">
              <Link className="primary-button" to={`/notes/${note.id}/edit`}>
                Edit
              </Link>
              <button type="button" className="secondary-button danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>

          <header className="note-article__hero">
            <p className="eyebrow">Note details</p>
            <h1 className="note-article__title">{note.title}</h1>
            <div className="note-article__meta">
              <span>Created {createdLabel}</span>
              <span>Updated {updatedLabel}</span>
            </div>
            {note.tags && note.tags.length > 0 ? (
              <div className="note-tags note-article__tags">
                {note.tags.map((tag) => (
                  <span key={`${note.id}-${tag}`} className="tag-chip static">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <section className="note-article__body">
            <div className="note-article__content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content || 'No content available for this note.'}
              </ReactMarkdown>
            </div>

            {note.codeSnippet ? (
              <section className="note-article__code-block">
                <div className="note-article__section-heading">
                  <h2>Code snippet</h2>
                </div>
                <pre>
                  <code>{note.codeSnippet}</code>
                </pre>
                <CodeRunner codeSnippet={note.codeSnippet} initialLanguage="python" />
              </section>
            ) : null}
          </section>
        </article>
      ) : null}
    </section>
  )
}

export default NoteView