import { useRef, useEffect, useCallback, useState } from 'react'
import { Bold, Italic, Underline } from 'lucide-react'

const MAX_CHARS = 4000
const MAX_LINES = 9

function countLines(el: HTMLElement) {
  return (el.innerHTML.match(/<br\s*\/?>/gi) || []).length + 1
}

interface RichNotesEditorProps {
  id?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  rows?: number
}

export function RichNotesEditor({
  id,
  value,
  onChange,
  placeholder = 'Add notes for this invoice...',
  disabled = false,
  rows = 3,
}: RichNotesEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const internalUpdate = useRef(false)
  const [charCount, setCharCount] = useState(0)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)

  const updateActiveStates = useCallback(() => {
    setIsBold(document.queryCommandState('bold'))
    setIsItalic(document.queryCommandState('italic'))
    setIsUnderline(document.queryCommandState('underline'))
  }, [])

  useEffect(() => {
    if (internalUpdate.current) {
      internalUpdate.current = false
      return
    }
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value
      setCharCount(ref.current.innerText.replace(/\n$/,'').length)
    }
  }, [value])

  const handleInput = useCallback(() => {
    if (!ref.current) return
    const text = ref.current.innerText.replace(/\n$/,'')
    if (text.length > MAX_CHARS) {
      // Truncate and restore caret at the limit
      const sel = window.getSelection()
      const range = sel?.getRangeAt(0)
      const caretOffset = range?.startOffset ?? 0
      ref.current.innerHTML = ref.current.innerHTML
      document.execCommand('undo')
      setCharCount(MAX_CHARS)
      return
    }
    setCharCount(text.length)
    internalUpdate.current = true
    onChange(ref.current.innerHTML)
    updateActiveStates()
  }, [onChange, updateActiveStates])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ['b','i','u'].includes(e.key)) {
      e.preventDefault()
      const cmd = e.key === 'b' ? 'bold' : e.key === 'i' ? 'italic' : 'underline'
      document.execCommand(cmd)
      updateActiveStates()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (ref.current && countLines(ref.current) >= MAX_LINES) return
      document.execCommand('insertLineBreak')
    }
  }, [updateActiveStates])

  const toggleFormat = useCallback((cmd: string) => {
    ref.current?.focus()
    document.execCommand(cmd)
    updateActiveStates()
  }, [updateActiveStates])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const currentLen = ref.current?.innerText.replace(/\n$/,'').length ?? 0
    let allowed = text.slice(0, MAX_CHARS - currentLen)
    const currentLineCount = ref.current ? countLines(ref.current) : 1
    const lines = allowed.split('\n')
    const remainingLines = MAX_LINES - currentLineCount
    if (lines.length > remainingLines + 1) allowed = lines.slice(0, remainingLines + 1).join('\n')
    if (allowed) document.execCommand('insertText', false, allowed)
  }, [])

  return (
    <div className="rich-notes-wrapper" style={{
      border: '1px solid #D1D5DB',
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {!disabled && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 1, padding: '5px 8px',
          background: '#FAFAF8',
          borderBottom: '1px solid #E5E7EB',
        }}>
          {([
            { cmd: 'bold', icon: <Bold size={13} strokeWidth={2.5} />, active: isBold, label: 'Bold (Ctrl+B)' },
            { cmd: 'italic', icon: <Italic size={13} strokeWidth={2.5} />, active: isItalic, label: 'Italic (Ctrl+I)' },
            { cmd: 'underline', icon: <Underline size={13} strokeWidth={2.5} />, active: isUnderline, label: 'Underline (Ctrl+U)' },
          ] as const).map(({ cmd, icon, active, label }) => (
            <button
              key={cmd}
              type="button"
              title={label}
              aria-label={label}
              onMouseDown={e => { e.preventDefault(); toggleFormat(cmd) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 24, borderRadius: 5,
                border: active ? '1px solid rgba(30,58,71,0.15)' : '1px solid transparent',
                cursor: 'pointer',
                background: active ? '#1E3A47' : 'transparent',
                color: active ? '#fff' : '#8D9299',
                transition: 'all 0.15s',
              }}
            >
              {icon}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{
            fontSize: '0.68rem', color: charCount > MAX_CHARS - 200 ? '#b91c1c' : '#B0B5BC',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em',
          }}>
            {charCount.toLocaleString()}&thinsp;/&thinsp;{MAX_CHARS.toLocaleString()}
          </span>
        </div>
      )}
      <div
        id={id}
        ref={ref}
        className="rich-notes-editor"
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        aria-placeholder={placeholder}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseUp={updateActiveStates}
        onKeyUp={updateActiveStates}
        style={{
          minHeight: `${rows * 1.5}em`,
          padding: '10px 12px',
          fontSize: '0.84rem',
          color: '#1E3A47',
          fontFamily: 'inherit',
          outline: 'none',
          background: '#fff',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        suppressContentEditableWarning
      />
    </div>
  )
}
