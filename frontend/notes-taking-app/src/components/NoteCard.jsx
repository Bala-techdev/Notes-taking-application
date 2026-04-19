import { Link } from 'react-router-dom'
import { FaStar, FaThumbtack } from 'react-icons/fa'

import { formatDateTime } from '../utils/time'

function NoteCard({ note, onDelete, onFavoriteToggle, onPinToggle }) {
  return (
    <article className={`note-card ${note.pinned ? 'note-card--pinned' : ''}`}>
      <div className="note-card__header">
        <div className="note-card__content-group">
          <p className="note-card__meta">Updated {formatDateTime(note.updatedAt)}</p>
          <h3 className="note-card__title">{note.title}</h3>
        </div>
        <div className="note-card__status-actions">
          <button
            type="button"
            className={`note-card__icon-button ${note.favorite ? 'active favorite' : ''}`}
            onClick={() => onFavoriteToggle?.(note)}
            aria-label={note.favorite ? 'Remove favorite' : 'Mark as favorite'}
            title={note.favorite ? 'Favorite' : 'Mark as favorite'}
          >
            <FaStar aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`note-card__icon-button ${note.pinned ? 'active pinned' : ''}`}
            onClick={() => onPinToggle?.(note)}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            title={note.pinned ? 'Pinned to top' : 'Pin to top'}
          >
            <FaThumbtack aria-hidden="true" />
          </button>
          {note.pinned ? <span className="note-badge">Pinned</span> : null}
        </div>
      </div>

      <p className="note-card__preview">{note.content || 'No content available.'}</p>

      <div className="note-card__actions">
        <Link to={`/notes/${note.id}`} className="note-card__action-link">
          Open
        </Link>
        <Link to={`/notes/${note.id}/edit`} className="note-card__action-link">
          Edit
        </Link>
        <button type="button" className="note-card__action-button danger" onClick={() => onDelete(note.id)}>
          Delete
        </button>
      </div>
    </article>
  )
}

export default NoteCard