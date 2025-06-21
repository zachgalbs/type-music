import { useEffect, useRef, useState } from 'react'

interface TypingInputProps {
  targetText: string
  typedText: string
  onTextChange: (text: string) => void
  onStatsUpdate: (wpm: number, accuracy: number, time: number) => void
}

export default function TypingInput({ targetText, typedText, onTextChange, onStatsUpdate }: TypingInputProps) {
  const [startTime, setStartTime] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debug: Track targetText changes
  useEffect(() => {
    console.log('targetText changed to:', `"${targetText}"`)
  }, [targetText])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Reset startTime when targetText changes (new lyric)
  useEffect(() => {
    setStartTime(null)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('Input change event:', `"${value}"`, 'previous typedText:', `"${typedText}"`)
    if (value.length <= targetText.length) {
      onTextChange(value)
    }
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={handleInputChange}
        className="w-full bg-white text-gray-900 text-xl p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-mono shadow-sm"
        placeholder="Start typing the lyrics..."
        autoComplete="off"
        spellCheck={false}
      />
      <div className="mt-2 flex justify-between text-sm text-gray-600">
        <span>Type along with the music</span>
        <span>{typedText.length}/{targetText.length}</span>
      </div>
    </div>
  )
}