interface LyricsDisplayProps {
  lyrics: string
  typedText: string
}

export default function LyricsDisplay({ lyrics, typedText }: LyricsDisplayProps) {
  const renderCharacters = () => {
    return lyrics.split('').map((char, index) => {
      const isCurrentPosition = index === typedText.length
      
      return (
        <span key={index} className="relative inline-block" style={{ fontFamily: 'Roboto Mono, monospace' }}>
          <span className="text-3xl text-gray-800">
            {char === ' ' ? '\u00A0' : char}
          </span>
          {isCurrentPosition && (
            <span 
              className="absolute -left-0.5 top-0 w-0.5 h-full bg-gray-800"
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-32">
        <div className="text-center leading-relaxed tracking-wide">
          {renderCharacters()}
        </div>
      </div>
    </>
  )
}