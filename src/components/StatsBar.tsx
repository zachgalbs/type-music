import { useEffect, useState } from 'react'

interface StatsBarProps {
  wpm: number
  accuracy: number
  time: number
}

export default function StatsBar({ wpm }: StatsBarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hideTimeout, setHideTimeout] = useState<number | null>(null)

  useEffect(() => {
    // Show WPM when it's greater than 0 (user is typing)
    if (wpm > 0) {
      setIsVisible(true)
      
      // Clear any existing hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout)
      }
      
      // Set new timeout to hide after 2 seconds of no typing
      const timeout = setTimeout(() => {
        setIsVisible(false)
      }, 2000)
      
      setHideTimeout(timeout)
    }
    
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout)
      }
    }
  }, [wpm])

  if (!isVisible) return null

  return (
    <div 
      className="fixed top-4 right-4 bg-gray-800 bg-opacity-90 text-gray-100 px-3 py-2 rounded-lg transition-opacity duration-300 border border-gray-700"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <span className="text-sm font-medium" style={{ fontFamily: 'Roboto Mono, monospace' }}>
        {wpm} WPM
      </span>
    </div>
  )
}