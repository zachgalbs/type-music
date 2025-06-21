interface LyricsDisplayProps {
  lyrics: string
  typedText: string
}

export default function LyricsDisplay({ lyrics, typedText }: LyricsDisplayProps) {
  const renderCharacters = () => {
    return lyrics.split('').map((char, index) => {
      const isCurrentPosition = index === typedText.length
      const isTyped = index < typedText.length
      const isCorrect = isTyped && typedText[index] === char
      const isIncorrect = isTyped && typedText[index] !== char
      
      let textColor = 'text-gray-500' // Untyped characters
      if (isCorrect) {
        textColor = 'text-gray-200' // Correct characters  
      } else if (isIncorrect) {
        textColor = 'text-red-500' // Incorrect characters
      }
      
      return (
        <span key={index} className="relative inline-block" style={{ fontFamily: 'Roboto Mono, monospace' }}>
          <span className={`text-3xl ${textColor} transition-colors duration-150`}>
            {char === ' ' ? '\u00A0' : char}
          </span>
          {isCurrentPosition && (
            <span 
              className="absolute -left-0.5 top-0 w-0.5 h-full bg-gray-200"
              style={{ 
                animation: 'blink 1s infinite'
              }}
            />
          )}
        </span>
      )
    })
  }

  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-8 min-h-32">
        <div className="text-center leading-relaxed tracking-wide">
          {renderCharacters()}
        </div>
      </div>
    </>
  )
}