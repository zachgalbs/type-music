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
import { lyricsService } from './services/lyricsService'

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
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false)
  const [lyricsError, setLyricsError] = useState<string | null>(null)
  const [isWaitingForTyping, setIsWaitingForTyping] = useState(false)
  const [playerState, setPlayerState] = useState(-1)
  const playerRef = useRef<YouTubePlayerInstance | null>(null)
  const syncIntervalRef = useRef<number | null>(null)
  const lastProcessedIndex = useRef<number>(-1)
  const lyricStartTime = useRef<number | null>(null)
  const pauseTimeoutRef = useRef<number | null>(null)
  const typedTextRef = useRef<string>('')

  // Debug: Track typedText changes and keep ref updated
  useEffect(() => {
    console.log('typedText changed to:', `"${typedText}"`, 'Stack trace:')
    console.trace()
    typedTextRef.current = typedText
  }, [typedText])

  // Check if user has caught up and resume video if needed
  useEffect(() => {
    if (isWaitingForTyping && typedText === currentLyrics && playerRef.current) {
      console.log('User caught up! Resuming video')
      playerRef.current.playVideo()
      setIsWaitingForTyping(false)
      // Clear any pending pause timeout
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current)
        pauseTimeoutRef.current = null
      }
    }
  }, [typedText, currentLyrics, isWaitingForTyping])

  useEffect(() => {
    fetchLyrics()
  }, [])

  const fetchLyrics = async () => {
    setIsLoadingLyrics(true)
    setLyricsError(null)
    
    try {
      console.log('Fetching lyrics for Never Gonna Give You Up...')
      const lrcLyrics = await lyricsService.getLrcFormatLyrics({
        trackName: 'Never Gonna Give You Up',
        artistName: 'Rick Astley'
      })
      
      if (lrcLyrics) {
        console.log('Fetched lyrics from API:')
        console.log(lrcLyrics.slice(0, 200) + '...') // Log first 200 chars
        const lyrics = parseLRC(lrcLyrics)
        console.log('Parsed lyrics:', lyrics.length, 'lines')
        setLyricsData(lyrics)
        setCurrentLyrics('Play the video to start typing!')
      } else {
        console.warn('No lyrics found, using fallback')
        setLyricsError('No lyrics found for this song')
        // Fallback to sample lyrics
        const lyrics = parseLRC(RICK_ASTLEY_LRC)
        setLyricsData(lyrics)
        setCurrentLyrics('Using sample lyrics - Play to start!')
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error)
      setLyricsError('Failed to load lyrics')
      // Fallback to sample lyrics
      const lyrics = parseLRC(RICK_ASTLEY_LRC)
      setLyricsData(lyrics)
      setCurrentLyrics('Using sample lyrics - Play to start!')
    } finally {
      setIsLoadingLyrics(false)
    }
  }

  // Start sync when both player and lyrics are ready
  useEffect(() => {
    if (isPlayerReady && lyricsData.length > 0) {
      console.log('Both player and lyrics ready, starting sync')
      startLyricSync()
    }
  }, [isPlayerReady, lyricsData])

  const handlePlayerReady = (player: YouTubePlayerInstance) => {
    console.log('YouTube player ready!')
    playerRef.current = player
    
    
    setIsPlayerReady(true)
  }

  const startLyricSync = () => {
    if (syncIntervalRef.current) {
      window.clearInterval(syncIntervalRef.current)
    }

    console.log('Starting lyrics sync, lyrics data:', lyricsData)

    syncIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && lyricsData.length > 0) {
        const currentTime = playerRef.current.getCurrentTime()
        const newIndex = getCurrentLyricIndex(lyricsData, currentTime)
        
        // Update player state
        const currentPlayerState = playerRef.current.getPlayerState()
        if (currentPlayerState !== playerState) {
          setPlayerState(currentPlayerState)
        }
        
        // Log every second to avoid spam
        if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime * 10) % 10 === 0) {
          console.log(`Player time: ${currentTime.toFixed(2)}s, Current lyric index: ${newIndex}`)
        }
        
        // Check if we should move to the next lyric
        if (newIndex !== currentLyricIndex && newIndex >= 0 && newIndex !== lastProcessedIndex.current) {
          console.log(`Time for new lyric! Time: ${currentTime.toFixed(2)}s, New lyric: "${lyricsData[newIndex].text}"`)
          
          // Check if user hasn't finished typing the current lyric
          const currentTypedText = typedTextRef.current
          console.log('Checking if user finished typing:')
          console.log('  currentLyricIndex:', currentLyricIndex)
          console.log('  typedText (state):', `"${typedText}"`)
          console.log('  typedText (ref):', `"${currentTypedText}"`)
          console.log('  currentLyrics:', `"${currentLyrics}"`)
          console.log('  ref === currentLyrics:', currentTypedText === currentLyrics)
          console.log('  ref.length:', currentTypedText.length)
          
          if (currentLyricIndex >= 0 && currentTypedText !== currentLyrics && currentTypedText.length > 0) {
            console.log('User hasn\'t finished typing current lyric, stopping video')
            playerRef.current.pauseVideo()
            setIsWaitingForTyping(true)
            // Don't advance to next lyric yet - wait for user to finish
            return
          }
          
          // User has finished (or it's the first lyric), advance to next
          console.log('Advancing to next lyric')
          
          setCurrentLyricIndex(newIndex)
          setCurrentLyrics(lyricsData[newIndex].text)
          lastProcessedIndex.current = newIndex
          lyricStartTime.current = currentTime
          
          // Clear typed text for new lyric
          setTypedText('')
          setIsWaitingForTyping(false)
          
          // Set up dynamic pause timeout for this lyric
          const nextLyricIndex = newIndex + 1
          if (nextLyricIndex < lyricsData.length) {
            const nextLyricTime = lyricsData[nextLyricIndex].time
            const currentLyricDuration = nextLyricTime - lyricsData[newIndex].time
            
            // Pause video if user hasn't finished typing after 80% of lyric duration
            const pauseDelay = currentLyricDuration * 0.8 * 1000 // Convert to milliseconds
            
            if (pauseTimeoutRef.current) {
              window.clearTimeout(pauseTimeoutRef.current)
            }
            
            pauseTimeoutRef.current = window.setTimeout(() => {
              if (playerRef.current && typedTextRef.current !== currentLyrics && typedTextRef.current.length > 0) {
                console.log('User taking too long, pausing video dynamically')
                playerRef.current.pauseVideo()
                setIsWaitingForTyping(true)
              }
            }, pauseDelay)
          }
        }
      }
    }, 100)
  }

  const handleReset = () => {
    setTypedText('')
    setWpm(0)
    setAccuracy(100)
    setTime(0)
    setIsWaitingForTyping(false)
    lastProcessedIndex.current = -1
    lyricStartTime.current = null
    typedTextRef.current = ''
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
  }

  const handleRefreshLyrics = () => {
    lyricsService.clearCache()
    fetchLyrics()
  }


  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        window.clearInterval(syncIntervalRef.current)
      }
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current)
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
          
          <div className="space-y-2">
            {isLoadingLyrics && (
              <div className="text-center text-blue-600">
                Loading lyrics from lrclib.net...
              </div>
            )}
            {lyricsError && (
              <div className="text-center text-amber-600 text-sm">
                {lyricsError} - Using sample lyrics as fallback
              </div>
            )}
            {isWaitingForTyping && (
              <div className="text-center text-orange-600 font-medium bg-orange-50 py-2 px-4 rounded-lg border border-orange-200">
                ⏸️ Video stopped - Finish typing to continue
              </div>
            )}
            <LyricsDisplay 
              lyrics={currentLyrics} 
              typedText={typedText} 
            />
          </div>
          
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
            onRefreshLyrics={handleRefreshLyrics}
            isLoadingLyrics={isLoadingLyrics}
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
