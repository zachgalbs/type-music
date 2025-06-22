import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import VideoPlayer from './components/VideoPlayer'
import StatsBar from './components/StatsBar'
import LyricsDisplay from './components/LyricsDisplay'
import TypingInput from './components/TypingInput'
import ActionButtons from './components/ActionButtons'
import SearchModal from './components/SearchModal'
import ExtensionRecommendation from './components/ExtensionRecommendation'
import ApiKeyPrompt from './components/ApiKeyPrompt'
import SyncOffsetIndicator from './components/SyncOffsetIndicator'
import type { YouTubePlayerInstance } from './utils/youtubePlayer'
import { parseLRC, getCurrentLyricIndex, type LyricLine } from './utils/lrcParser'
import { RICK_ASTLEY_LRC } from './data/sampleLyrics'
import { lyricsService } from './services/lyricsService'
import { youtubeService } from './services/youtubeService'

function App() {
  const [currentVideo, setCurrentVideo] = useState('YVkUvmDQ3HY')
  const [currentTrack, setCurrentTrack] = useState({ trackName: 'Without Me', artistName: 'Eminem' })
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
  const [isSearchingVideo, setIsSearchingVideo] = useState(false)
  const [lyricsError, setLyricsError] = useState<string | null>(null)
  const [isWaitingForTyping, setIsWaitingForTyping] = useState(false)
  const [playerState, setPlayerState] = useState(-1)
  const [currentPage, setCurrentPage] = useState<'practice' | 'extension'>('practice')
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false)
  const [syncOffset, setSyncOffset] = useState(() => {
    const stored = localStorage.getItem(`syncOffset_${currentVideo}`)
    return stored ? parseFloat(stored) : 0
  })
  const [removeAdLibs, setRemoveAdLibs] = useState(() => {
    const stored = localStorage.getItem('removeAdLibs')
    return stored ? JSON.parse(stored) : true // Default to true (remove ad-libs)
  })
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

  // Check if typing is complete and resume video
  useEffect(() => {
    if (isWaitingForTyping && typedText.length >= currentLyrics.length && playerRef.current) {
      playerRef.current.playVideo()
      setIsWaitingForTyping(false)
    }
  }, [typedText, currentLyrics, isWaitingForTyping])

  // Save sync offset when it changes
  useEffect(() => {
    localStorage.setItem(`syncOffset_${currentVideo}`, syncOffset.toString())
  }, [syncOffset, currentVideo])

  // Load sync offset when video changes
  useEffect(() => {
    const stored = localStorage.getItem(`syncOffset_${currentVideo}`)
    setSyncOffset(stored ? parseFloat(stored) : 0)
  }, [currentVideo])

  // Global keyboard handler for typing anywhere
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept any modified keys (Ctrl, Cmd, Alt) except Alt+Backspace
      if ((e.ctrlKey || e.metaKey) || (e.altKey && e.key !== 'Backspace')) {
        return
      }
      
      // Don't intercept function keys or special keys
      if (e.key && e.key.startsWith('F') && e.key.length === 2) { // F1-F12
        return
      }
      
      // Don't intercept browser shortcuts
      const browserShortcuts = ['Tab', 'Escape', 'Enter', 'Home', 'End', 'PageUp', 'PageDown']
      if (browserShortcuts.includes(e.key)) {
        return
      }
      
      // If typing in an input/textarea, don't intercept
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }
      
      // Handle sync offset adjustment using code property for consistency
      if (e.code === 'BracketLeft' || e.code === 'BracketRight') {
        console.log('Sync offset key detected:', {
          key: e.key,
          code: e.code,
          shiftKey: e.shiftKey,
          adjustment: e.shiftKey ? 1.0 : 0.1
        })
        e.preventDefault()
        const adjustment = e.shiftKey ? 1.0 : 0.1 // Shift for larger adjustments
        
        if (e.code === 'BracketLeft') {
          setSyncOffset(prev => {
            const newOffset = Math.round((prev - adjustment) * 10) / 10
            console.log('Decreasing offset:', prev, '->', newOffset)
            return newOffset
          })
        } else if (e.code === 'BracketRight') {
          setSyncOffset(prev => {
            const newOffset = Math.round((prev + adjustment) * 10) / 10
            console.log('Increasing offset:', prev, '->', newOffset)
            return newOffset
          })
        }
        return
      }
      
      // Only intercept single character keys and backspace for typing
      const isTypingKey = e.key.length === 1 || e.key === 'Backspace'
      if (globalInputRef.current && isTypingKey) {
        e.preventDefault()
        globalInputRef.current.focus()
        
        // Debug logging for Option+Backspace
        if (e.key === 'Backspace' && e.altKey) {
          console.log('Global handler: Option+Backspace detected', {
            key: e.key,
            altKey: e.altKey,
            code: e.code
          })
        }
        
        // Simulate the keydown event on the hidden input
        const newEvent = new KeyboardEvent('keydown', {
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          which: e.which,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
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
  }, [currentTrack, removeAdLibs])

  // Initialize YouTube API key on app startup
  useEffect(() => {
    const storedApiKey = localStorage.getItem('youtube_api_key')
    if (storedApiKey) {
      youtubeService.setApiKey(storedApiKey)
    }
  }, [])

  const fetchLyrics = async () => {
    setIsLoadingLyrics(true)
    setLyricsError(null)
    
    try {
      const lrcLyrics = await lyricsService.getLrcFormatLyrics({
        trackName: currentTrack.trackName,
        artistName: currentTrack.artistName
      })
      
      if (lrcLyrics) {
        const lyrics = parseLRC(lrcLyrics, { removeAdLibs })
        console.log('Loaded lyrics:', lyrics.length, 'lines')
        setLyricsData(lyrics)
        setCurrentLyrics('Play the video to start typing!')
      } else {
        console.warn('No lyrics found, using fallback')
        setLyricsError('No lyrics found for this song')
        // Fallback to sample lyrics
        const lyrics = parseLRC(RICK_ASTLEY_LRC, { removeAdLibs })
        setLyricsData(lyrics)
        setCurrentLyrics('Using sample lyrics - Play to start!')
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error)
      setLyricsError('Failed to load lyrics')
      // Fallback to sample lyrics
      const lyrics = parseLRC(RICK_ASTLEY_LRC, { removeAdLibs })
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
    console.log('Player ready')
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
        const adjustedTime = currentTime + LYRIC_ADVANCE_BUFFER + syncOffset
        const newIndex = getCurrentLyricIndex(lyricsData, adjustedTime)
        
        // Update player state
        const currentPlayerState = playerRef.current.getPlayerState()
        if (currentPlayerState !== playerState) {
          setPlayerState(currentPlayerState)
        }
        
        // FIRST: Check if we should pause at the next lyric's timestamp (before advancing)
        // Only check if video is playing (state 1)
        if (currentLyricIndex >= 0 && !isWaitingForTyping && currentPlayerState === 1) {
          const nextLyricIndex = currentLyricIndex + 1
          if (nextLyricIndex < lyricsData.length) {
            const nextLyricTime = lyricsData[nextLyricIndex].time
            const currentTypedText = typedTextRef.current
            
            // Add buffer to pause slightly before the next lyric starts
            const timeBuffer = 0.3
            
            // Pause if we've reached the next lyric time and user hasn't finished typing current lyric
            if (currentTime + syncOffset >= (nextLyricTime - timeBuffer) && currentTypedText.length < currentLyrics.length) {
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
          
          if (currentTypedText.length < currentLyricText.length) {
            if (!isWaitingForTyping && currentPlayerState === 1) {
              playerRef.current.pauseVideo()
              setIsWaitingForTyping(true)
            }
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

  const searchAndLoadTrack = async (track: { trackName: string; artistName: string }) => {
    setCurrentTrack(track)
    
    // Check if YouTube API key is set
    const apiKey = localStorage.getItem('youtube_api_key')
    if (!apiKey) {
      setShowApiKeyPrompt(true)
      return
    }
    
    youtubeService.setApiKey(apiKey)
    setIsSearchingVideo(true)
    
    try {
      // Search for the best matching YouTube video
      const videoId = await youtubeService.searchBestMatch(track.trackName, track.artistName)
      
      if (videoId) {
        console.log(`Found video for ${track.artistName} - ${track.trackName}:`, videoId)
        setCurrentVideo(videoId)
      } else {
        console.warn(`No video found for ${track.artistName} - ${track.trackName}, keeping current video`)
      }
    } catch (error) {
      console.error('Error searching for video:', error)
      if (error instanceof Error && error.message.includes('API key')) {
        setShowApiKeyPrompt(true)
      }
    } finally {
      setIsSearchingVideo(false)
    }
    
    // Reset typing state when switching songs
    handleReset()
  }

  const handleApiKeySubmit = (apiKey: string) => {
    localStorage.setItem('youtube_api_key', apiKey)
    youtubeService.setApiKey(apiKey)
    setShowApiKeyPrompt(false)
    
    // Retry the search if we have a pending track
    if (currentTrack.trackName !== 'Without Me') {
      searchAndLoadTrack(currentTrack)
    }
  }

  const handleAdLibToggle = (enabled: boolean) => {
    setRemoveAdLibs(enabled)
    localStorage.setItem('removeAdLibs', JSON.stringify(enabled))
    handleReset() // Reset typing state when changing ad-lib setting
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
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <ExtensionRecommendation />
      </div>
    )
  }

  // Render main practice page
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      
      {/* Floating WPM display */}
      <StatsBar wpm={wpm} accuracy={accuracy} time={time} />
      
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="space-y-6">
          <VideoPlayer videoId={currentVideo} onPlayerReady={handlePlayerReady} />
          
          <div className="space-y-2">
            {isLoadingLyrics && (
              <div className="text-center text-blue-400">
                Loading lyrics from lrclib.net...
              </div>
            )}
            {isSearchingVideo && (
              <div className="text-center text-purple-400">
                Searching YouTube for matching video...
              </div>
            )}
            {lyricsError && (
              <div className="text-center text-amber-400 text-sm">
                {lyricsError} - Using sample lyrics as fallback
              </div>
            )}
            {isWaitingForTyping && (
              <div className="text-center text-orange-400 font-medium bg-orange-950 bg-opacity-50 py-2 px-4 rounded-lg border border-orange-800">
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
            removeAdLibs={removeAdLibs}
            onAdLibToggle={handleAdLibToggle}
          />
        </div>
      </main>

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onVideoSelect={setCurrentVideo}
        onTrackSelect={searchAndLoadTrack}
      />

      <SyncOffsetIndicator offset={syncOffset} />

      <ApiKeyPrompt
        isOpen={showApiKeyPrompt}
        onSubmit={handleApiKeySubmit}
        onCancel={() => setShowApiKeyPrompt(false)}
      />
    </div>
  )
}

export default App
