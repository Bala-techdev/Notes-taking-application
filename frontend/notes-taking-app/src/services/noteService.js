const NOTES_KEY = 'notes-app-notes'

function readNotes() {
  return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]')
}

function writeNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export function getNotesByUserId(userId) {
  return readNotes()
    .filter((note) => note.userId === userId)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
}

export function getNoteById(id) {
  return readNotes().find((note) => note.id === id) || null
}

export function saveNote(userId, noteInput) {
  const notes = readNotes()
  const now = new Date().toISOString()

  if (noteInput.id) {
    const index = notes.findIndex((note) => note.id === noteInput.id)

    if (index === -1) {
      throw new Error('Note not found.')
    }

    if (notes[index].userId !== userId) {
      throw new Error('You do not have permission to edit this note.')
    }

    const updatedNote = {
      ...notes[index],
      title: noteInput.title,
      content: noteInput.content,
      codeSnippet: noteInput.codeSnippet,
      updatedAt: now,
    }

    notes[index] = updatedNote
    writeNotes(notes)
    return updatedNote
  }

  const newNote = {
    id: crypto.randomUUID(),
    userId,
    title: noteInput.title,
    content: noteInput.content,
    codeSnippet: noteInput.codeSnippet,
    createdAt: now,
    updatedAt: now,
  }

  writeNotes([newNote, ...notes])
  return newNote
}

export function deleteNote(userId, noteId) {
  const notes = readNotes()
  const note = notes.find((item) => item.id === noteId)

  if (!note) {
    throw new Error('Note not found.')
  }

  if (note.userId !== userId) {
    throw new Error('You do not have permission to delete this note.')
  }

  writeNotes(notes.filter((item) => item.id !== noteId))
}
