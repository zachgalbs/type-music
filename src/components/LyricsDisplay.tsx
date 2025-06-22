interface LyricsDisplayProps {
  lyrics: string
  typedText: string
}

export default function LyricsDisplay({ lyrics, typedText }: LyricsDisplayProps) {
  const renderCharacters = () => {
    // Split lyrics into words while keeping track of character positions
    const words = []
    let currentWord = []
    let charIndex = 0
    
    for (let i = 0; i < lyrics.length; i++) {
      const char = lyrics[i]
      
      if (char === ' ') {
        if (currentWord.length > 0) {
          words.push({ chars: currentWord, startIndex: charIndex - currentWord.length })
          currentWord = []
        }
        // Add space as its own element
        words.push({ chars: [' '], startIndex: i })
      } else {
        currentWord.push(char)
      }
      charIndex++
    }
    
    // Don't forget the last word
    if (currentWord.length > 0) {
      words.push({ chars: currentWord, startIndex: charIndex - currentWord.length })
    }
    
    // Render words with proper wrapping
    return words.map((word, wordIndex) => {
      const wordElement = word.chars.map((char, charIndexInWord) => {
        const index = word.startIndex + charIndexInWord
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
            <span className={`text-3xl ${textColor} transition-colors duration-150 ${isIncorrect && char === ' ' ? 'bg-red-500' : ''}`}>
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
      
      // Wrap non-space words in spans to control word wrapping
      if (word.chars[0] !== ' ') {
        return <span key={wordIndex} className="inline-block">{wordElement}</span>
      }
      return wordElement
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
        <div className="text-center leading-relaxed tracking-wide break-words whitespace-normal">
          {renderCharacters()}
        </div>
      </div>
    </>
  )
}