let editor
let targetPath = null

const {ipcRenderer} = require('electron')
const matter = require('gray-matter')
const CodeMirror = require('codemirror')

require('codemirror/mode/markdown/markdown')

const setSaveButtonDisabled = (disabled = true) => {
  const saveButton = document.getElementById('button-save')

  disabled
    ? saveButton.setAttribute('disabled', disabled)
    : saveButton.removeAttribute('disabled')
}

const setupButtons = () => {
  const newButton = document.getElementById('button-new')
  const openButton = document.getElementById('button-open')
  const saveButton = document.getElementById('button-save')

  newButton.addEventListener('click', handleNewButton)
  openButton.addEventListener('click', handleOpenButton)
  saveButton.addEventListener('click', handleSaveButton)
}

const handleNewButton = () => {
  document.getElementById('input-title').value = ''
  document.getElementById('input-date').value = ''
  document.getElementById('input-description').value = ''
  editor.setValue('')
  targetPath = null
}

const handleOpenButton = () => {
  ipcRenderer.send('open-button')
}

const handleSaveButton = () => {
  const titleValue = document.getElementById('input-title').value
  const dateValue = document.getElementById('input-date').value
  const descriptionValue = document.getElementById('input-description').value
  const dateInput =
    dateValue == null || dateValue === '' ? new Date() : new Date(dateValue)

  const targetBody = matter.stringify(editor.getValue(), {
    title: titleValue || '',
    date: dateInput,
    description: descriptionValue || ''
  })

  setSaveButtonDisabled(true)
  ipcRenderer.send('save-button', targetPath, targetBody)
}

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  setupButtons()

  editor = CodeMirror(document.getElementById('editor'), {
    lineNumbers: true,
    lineWrapping: true,
    mode: 'markdown'
  })

  const buttonHeight = document.getElementById('buttons').offsetHeight
  const metadataHeight = document.getElementById('metadata').offsetHeight
  const totalHeight = buttonHeight + metadataHeight
  const height = document.body.offsetHeight - totalHeight

  editor.setSize('100%', height)
})

ipcRenderer.on('open-file', (event, filePath, fileBody) => {
  const {isEmpty, data, content} = matter(fileBody)

  if (!isEmpty) {
    const {title, date, description} = data

    document.getElementById('input-title').value = title || ''
    document.getElementById('input-date').value =
      date instanceof Date ? date.toISOString() : ''
    document.getElementById('input-description').value = description || ''

    fileBody = content
  }

  editor.setValue(fileBody)
  targetPath = filePath
})

ipcRenderer.on('save-file', (event, filePath) => {
  setSaveButtonDisabled(false)
  targetPath = filePath
})
