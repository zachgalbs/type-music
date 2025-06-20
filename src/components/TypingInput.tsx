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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (typedText.length > 0 && startTime === null) {
      setStartTime(Date.now())
    }

    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000
      const wordsTyped = typedText.length / 5
      const wpm = timeElapsed > 0 ? Math.round((wordsTyped / timeElapsed) * 60) : 0
      
      const correctChars = typedText.split('').filter((char, index) => char === targetText[index]).length
      const accuracy = typedText.length > 0 ? Math.round((correctChars / typedText.length) * 100) : 100

      onStatsUpdate(wpm, accuracy, Math.floor(timeElapsed))
    }
  }, [typedText, startTime, targetText, onStatsUpdate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
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