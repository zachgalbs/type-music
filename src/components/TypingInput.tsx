import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

interface TypingInputProps {
  targetText: string
  typedText: string
  onTextChange: (text: string) => void
  onStatsUpdate: (wpm: number, accuracy: number, time: number) => void
}

const TypingInput = forwardRef<HTMLInputElement, TypingInputProps>(({ targetText, typedText, onTextChange, onStatsUpdate }, ref) => {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentPosition, setCurrentPosition] = useState(0)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  // Expose the input ref to parent
  useImperativeHandle(ref, () => hiddenInputRef.current!, [])

  useEffect(() => {
    setCurrentPosition(0)
  }, [targetText])

  useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus()
    }
  }, [])

  // Reset startTime when targetText changes (new lyric)
  useEffect(() => {
    setStartTime(null)
    setCurrentPosition(0)
  }, [targetText])

  useEffect(() => {
    // Start timing when user begins typing
    if (typedText.length > 0 && startTime === null) {
      setStartTime(Date.now())
    }

    // Reset timing when text is cleared (new lyric)
    if (typedText.length === 0 && startTime !== null) {
      setStartTime(null)
    }

    if (startTime && typedText.length > 0) {
      const timeElapsed = (Date.now() - startTime) / 1000
      
      // Count actual words typed (more accurate than character/5)
      const wordsTyped = typedText.trim().split(/\s+/).filter(word => word.length > 0).length
      
      // Calculate WPM with minimum time threshold to avoid crazy high numbers
      const minTimeForWPM = 1 // Don't calculate WPM until at least 1 second of typing
      const wpm = timeElapsed >= minTimeForWPM ? Math.round((wordsTyped / timeElapsed) * 60) : 0
      
      // Calculate accuracy based on correct characters
      const correctChars = typedText.split('').filter((char, index) => char === targetText[index]).length
      const accuracy = typedText.length > 0 ? Math.round((correctChars / typedText.length) * 100) : 100

      onStatsUpdate(wpm, accuracy, Math.floor(timeElapsed))
    } else {
      // Reset stats when not actively typing
      onStatsUpdate(0, 100, 0)
    }
  }, [typedText, startTime, targetText, onStatsUpdate])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Debug logging
    if (e.key === 'Backspace') {
      console.log('TypingInput: Backspace detected', {
        key: e.key,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        currentPosition,
        typedTextLength: typedText.length
      })
    }

    // Don't prevent default for modifier key combinations - let them pass through
    // EXCEPT for Alt+Backspace which we want to handle for word deletion
    if ((e.ctrlKey || e.metaKey) || (e.altKey && e.key !== 'Backspace')) {
      return // Let browser handle shortcuts like Cmd+R
    }

    // Don't prevent default for function keys
    if (e.key.startsWith('F') && e.key.length === 2) {
      return
    }

    // Don't prevent default for navigation keys
    const navigationKeys = ['Tab', 'Escape', 'Enter', 'Home', 'End', 'PageUp', 'PageDown']
    if (navigationKeys.includes(e.key)) {
      return
    }

    // Don't prevent default for sync offset shortcuts - let them bubble up to global handler
    if (e.key === '[' || e.key === ']') {
      return
    }

    // Now prevent default for typing keys only
    e.preventDefault()
    
    if (e.key === 'Backspace') {
      if (e.altKey) {
        // Option+Backspace: Delete word
        if (currentPosition > 0) {
          let newPosition = currentPosition - 1
          
          // Skip trailing spaces
          while (newPosition > 0 && typedText[newPosition] === ' ') {
            newPosition--
          }
          
          // Delete word characters
          while (newPosition > 0 && typedText[newPosition - 1] !== ' ') {
            newPosition--
          }
          
          setCurrentPosition(newPosition)
          onTextChange(typedText.slice(0, newPosition))
        }
      } else {
        // Regular backspace: Delete one character
        if (currentPosition > 0) {
          const newPosition = currentPosition - 1
          setCurrentPosition(newPosition)
          onTextChange(typedText.slice(0, newPosition))
        }
      }
      return
    }
    
    // Only process single character keys
    if (e.key.length !== 1) {
      return
    }
    
    // Check if we've reached the end
    if (currentPosition >= targetText.length) {
      return
    }
    
    const typedChar = e.key
    
    // Always advance position regardless of correctness
    const newPosition = currentPosition + 1
    setCurrentPosition(newPosition)
    
    // Update the typed text with the actual character typed
    const newTypedText = typedText + typedChar
    onTextChange(newTypedText)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear the input to prevent text accumulation
    e.target.value = ''
  }

  return (
    <div className="w-full">
      {/* Completely hidden input to capture keystrokes */}
      <input
        ref={hiddenInputRef}
        type="text"
        value=""
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
        autoComplete="off"
        spellCheck={false}
        tabIndex={-1}
      />
    </div>
  )
})

TypingInput.displayName = 'TypingInput'
export default TypingInput