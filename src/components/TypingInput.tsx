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
    e.preventDefault()
    
    if (e.key === 'Backspace') {
      // Allow backspace to go back one position
      if (currentPosition > 0) {
        const newPosition = currentPosition - 1
        setCurrentPosition(newPosition)
        onTextChange(typedText.slice(0, newPosition))
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
    
    const expectedChar = targetText[currentPosition]
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