interface LyricsDisplayProps {
  lyrics: string
  typedText: string
}

export default function LyricsDisplay({ lyrics, typedText }: LyricsDisplayProps) {
  const renderCharacters = () => {
    return lyrics.split('').map((char, index) => {
      let className = 'text-2xl font-mono '
      
      if (index < typedText.length) {
        if (typedText[index] === char) {
          className += 'text-green-600 bg-green-100 rounded-sm'
        } else {
          className += 'text-red-600 bg-red-100 rounded-sm'
        }
      } else if (index === typedText.length) {
        className += 'text-gray-900 bg-blue-200 rounded-sm'
      } else {
        className += 'text-gray-500'
      }
      
      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-32">
      <div className="text-center leading-relaxed">
        {renderCharacters()}
      </div>
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${lyrics.length > 0 ? (typedText.length / lyrics.length) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  )
}