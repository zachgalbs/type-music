import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import VideoPlayer from './components/VideoPlayer'
import StatsBar from './components/StatsBar'
import LyricsDisplay from './components/LyricsDisplay'
import TypingInput from './components/TypingInput'
import ActionButtons from './components/ActionButtons'
import SearchModal from './components/SearchModal'
import type { YouTubePlayerInstance } from './utils/youtubePlayer'
import { parseLRC, getCurrentLyricIndex, type LyricLine } from './utils/lrcParser'
import { RICK_ASTLEY_LRC } from './data/sampleLyrics'

function App() {
  const [currentVideo, setCurrentVideo] = useState('dQw4w9WgXcQ')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [time, setTime] = useState(0)
  const [lyricsData, setLyricsData] = useState<LyricLine[]>([])
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1)
  const [currentLyrics, setCurrentLyrics] = useState("Click play to start...")
  const [typedText, setTypedText] = useState('')
  const playerRef = useRef<YouTubePlayerInstance | null>(null)
  const syncIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    const lyrics = parseLRC(RICK_ASTLEY_LRC)
    setLyricsData(lyrics)
  }, [])

  const handlePlayerReady = (player: YouTubePlayerInstance) => {
    playerRef.current = player
    startLyricSync()
  }

  const startLyricSync = () => {
    if (syncIntervalRef.current) {
      window.clearInterval(syncIntervalRef.current)
    }

    syncIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && lyricsData.length > 0) {
        const currentTime = playerRef.current.getCurrentTime()
        const newIndex = getCurrentLyricIndex(lyricsData, currentTime)
        
        if (newIndex !== currentLyricIndex && newIndex >= 0) {
          setCurrentLyricIndex(newIndex)
          setCurrentLyrics(lyricsData[newIndex].text)
          setTypedText('')
        }
      }
    }, 100)
  }

  const handleReset = () => {
    setTypedText('')
    setWpm(0)
    setAccuracy(100)
    setTime(0)
  }

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        window.clearInterval(syncIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="space-y-6">
          <VideoPlayer videoId={currentVideo} onPlayerReady={handlePlayerReady} />
          
          <StatsBar wpm={wpm} accuracy={accuracy} time={time} />
          
          <LyricsDisplay 
            lyrics={currentLyrics} 
            typedText={typedText} 
          />
          
          <TypingInput 
            targetText={currentLyrics}
            typedText={typedText}
            onTextChange={setTypedText}
            onStatsUpdate={(newWpm, newAccuracy, newTime) => {
              setWpm(newWpm)
              setAccuracy(newAccuracy)
              setTime(newTime)
            }}
          />
          
          <ActionButtons 
            onReset={handleReset}
            onSearchOpen={() => setIsSearchOpen(true)}
          />
        </div>
      </main>

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onVideoSelect={setCurrentVideo}
      />
    </div>
  )
}

export default App
