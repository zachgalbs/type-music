import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import VideoPlayer from './components/VideoPlayer'
import StatsBar from './components/StatsBar'
import LyricsDisplay from './components/LyricsDisplay'
import TypingInput from './components/TypingInput'
import ActionButtons from './components/ActionButtons'
import SearchModal from './components/SearchModal'
import ExtensionRecommendation from './components/ExtensionRecommendation'
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
  const [currentPage, setCurrentPage] = useState<'practice' | 'extension'>('practice')
  const playerRef = useRef<YouTubePlayerInstance | null>(null)
  const syncIntervalRef = useRef<number | null>(null)
  const lastProcessedIndex = useRef<number>(-1)
  const lyricStartTime = useRef<number | null>(null)
  const pauseTimeoutRef = useRef<number | null>(null)
  const typedTextRef = useRef<string>('')
  const globalInputRef = useRef<HTMLInputElement | null>(null)

  // Keep ref updated with typedText changes
  useEffect(() => {
    typedTextRef.current = typedText
  }, [typedText])

  // Global keyboard handler for typing anywhere + shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Handle play/pause shortcut (Spacebar when Ctrl/Cmd is held)
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault()
        if (playerRef.current) {
          const state = playerRef.current.getPlayerState()
          if (state === 1) { // Playing
            playerRef.current.pauseVideo()
          } else {
            playerRef.current.playVideo()
          }
        }
        return
      }
      
      // If typing in an input/textarea, don't intercept
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }
      
      // Forward all other keys to the hidden input for typing
      if (globalInputRef.current && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        globalInputRef.current.focus()
        
        // Simulate the keydown event on the hidden input
        const newEvent = new KeyboardEvent('keydown', {
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          which: e.which,
          shiftKey: e.shiftKey,
          bubbles: true
        })
        globalInputRef.current.dispatchEvent(newEvent)
      }
    }
    
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // Check if user has caught up and resume video if needed
  useEffect(() => {
    if (isWaitingForTyping && typedText === currentLyrics && playerRef.current) {
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
      const lrcLyrics = await lyricsService.getLrcFormatLyrics({
        trackName: 'Never Gonna Give You Up',
        artistName: 'Rick Astley'
      })
      
      if (lrcLyrics) {
        const lyrics = parseLRC(lrcLyrics)
        console.log('Loaded lyrics:', lyrics.length, 'lines')
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
      startLyricSync()
    }
  }, [isPlayerReady, lyricsData])

  const handlePlayerReady = (player: YouTubePlayerInstance) => {
    playerRef.current = player
    setIsPlayerReady(true)
  }

  const startLyricSync = () => {
    if (syncIntervalRef.current) {
      window.clearInterval(syncIntervalRef.current)
    }

    syncIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && lyricsData.length > 0) {
        const currentTime = playerRef.current.getCurrentTime()
        // Add 300ms buffer - advance lyrics 300ms before actual timestamp
        const LYRIC_ADVANCE_BUFFER = 0.3
        const adjustedTime = currentTime + LYRIC_ADVANCE_BUFFER
        const newIndex = getCurrentLyricIndex(lyricsData, adjustedTime)
        
        // Update player state
        const currentPlayerState = playerRef.current.getPlayerState()
        if (currentPlayerState !== playerState) {
          setPlayerState(currentPlayerState)
        }
        
        // FIRST: Check if we should pause at the next lyric's timestamp (before advancing)
        if (currentLyricIndex >= 0 && !isWaitingForTyping) {
          const nextLyricIndex = currentLyricIndex + 1
          if (nextLyricIndex < lyricsData.length) {
            const nextLyricTime = lyricsData[nextLyricIndex].time
            const currentTypedText = typedTextRef.current
            
            // Add buffer to pause slightly before the next lyric starts
            const timeBuffer = 0.3
            
            // Pause if we've reached the next lyric time and user hasn't finished typing current lyric
            if (currentTime >= (nextLyricTime - timeBuffer) && currentTypedText !== currentLyrics) {
              console.log('Pausing at timestamp - unfinished typing')
              playerRef.current.pauseVideo()
              setIsWaitingForTyping(true)
              return // Don't advance to next lyric yet
            }
          }
        }
        
        // SECOND: Check if we should move to the next lyric (only if not pausing)
        // Use lastProcessedIndex as source of truth since React state is async
        const currentProcessedIndex = lastProcessedIndex.current
        const shouldProcessNewIndex = newIndex >= 0 && newIndex !== currentProcessedIndex
        
        if (shouldProcessNewIndex) {
          const currentTypedText = typedTextRef.current
          
          // If we're at the initial state (-1), advance to first lyric (0) immediately
          if (currentProcessedIndex === -1) {
            const firstLyric = lyricsData[0]?.text || ''
            setCurrentLyricIndex(0)
            setCurrentLyrics(firstLyric)
            lastProcessedIndex.current = 0
            lyricStartTime.current = currentTime
            setIsWaitingForTyping(false)
            return
          }
          
          // For normal lyric advancement, check if user finished current lyric
          const currentLyricText = lyricsData[currentProcessedIndex]?.text || ''
          
          if (currentTypedText !== currentLyricText) {
            playerRef.current.pauseVideo()
            setIsWaitingForTyping(true)
            return
          }
          
          // User finished current lyric, advance to next
          const nextLyricIndex = currentProcessedIndex + 1
          if (nextLyricIndex < lyricsData.length) {
            setCurrentLyricIndex(nextLyricIndex)
            setCurrentLyrics(lyricsData[nextLyricIndex].text)
            lastProcessedIndex.current = nextLyricIndex
            lyricStartTime.current = currentTime
            setTypedText('')
            setIsWaitingForTyping(false)
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

  // Render extension recommendation page
  if (currentPage === 'extension') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <ExtensionRecommendation />
      </div>
    )
  }

  // Render main practice page
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      
      {/* Floating WPM display */}
      <StatsBar wpm={wpm} accuracy={accuracy} time={time} />
      
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="space-y-6">
          <VideoPlayer videoId={currentVideo} onPlayerReady={handlePlayerReady} />
          
          <div className="text-center text-xs text-gray-500 -mt-2">
            Press <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs">Ctrl/Cmd + Space</kbd> to play/pause
          </div>
          
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
            ref={globalInputRef}
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
