import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import VideoPlayer from './components/VideoPlayer'
import StatsBar from './components/StatsBar'
import LyricsDisplay from './components/LyricsDisplay'
import TypingInput from './components/TypingInput'
import ActionButtons from './components/ActionButtons'
import SearchModal from './components/SearchModal'
import ExtensionRecommendation from './components/ExtensionRecommendation'
import SyncOffsetIndicator from './components/SyncOffsetIndicator'
import DebugPanel from './components/DebugPanel'
import type { YouTubePlayerInstance } from './utils/youtubePlayer'
import { parseLRC, getCurrentLyricIndex, type LyricLine } from './utils/lrcParser'
import { RICK_ASTLEY_LRC } from './data/sampleLyrics'
import { lyricsService } from './services/lyricsService'
import { youtubeService } from './services/youtubeService'

function App() {
  const sanitizeOffset = (value: number) => {
    const clamped = Math.min(3, Math.max(-3, value))
    return Math.round(clamped * 10) / 10
  }

  const [currentVideo, setCurrentVideo] = useState('E8gmARGvPlI')
  const [currentTrack, setCurrentTrack] = useState({ trackName: 'Last Christmas', artistName: 'Wham!' })
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
  const [videoSearchError, setVideoSearchError] = useState<string | null>(null)
  const [syncOffset, setSyncOffset] = useState(() => {
    const stored = localStorage.getItem(`syncOffset_${currentVideo}`)
    const parsed = stored ? parseFloat(stored) : 0.5
    return Number.isNaN(parsed) ? 0.5 : sanitizeOffset(parsed)
  })
  const [removeAdLibs, setRemoveAdLibs] = useState(() => {
    const stored = localStorage.getItem('removeAdLibs')
    return stored ? JSON.parse(stored) : true // Default to true (remove ad-libs)
  })
  const [videoTime, setVideoTime] = useState(0)
  const [showDebugPanel, setShowDebugPanel] = useState(() => {
    const stored = localStorage.getItem('showDebugPanel')
    return stored ? JSON.parse(stored) : false
  })
  const playerRef = useRef<YouTubePlayerInstance | null>(null)
  const syncIntervalRef = useRef<number | null>(null)
  const lastProcessedIndex = useRef<number>(-1)
  const lyricStartTime = useRef<number | null>(null)
  const pauseTimeoutRef = useRef<number | null>(null)
  const typedTextRef = useRef<string>('')
  const globalInputRef = useRef<HTMLInputElement | null>(null)
  const previousOffsetRef = useRef<number>(syncOffset)
  const isWaitingForTypingRef = useRef<boolean>(false)
  const syncOffsetRef = useRef<number>(syncOffset)

  // Keep refs updated with state changes
  useEffect(() => {
    typedTextRef.current = typedText
  }, [typedText])
  
  useEffect(() => {
    isWaitingForTypingRef.current = isWaitingForTyping
  }, [isWaitingForTyping])

  useEffect(() => {
    syncOffsetRef.current = syncOffset
  }, [syncOffset])

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
  
  // Check if offset change should resume video (only when offset actually changes)
  useEffect(() => {
    // Only run if offset actually changed value
    if (syncOffset === previousOffsetRef.current) {
      return
    }
    
    console.log('Sync offset actually changed:', previousOffsetRef.current, '->', syncOffset)
    previousOffsetRef.current = syncOffset
    
    // If waiting for typing, check if offset change should affect playback
    if (isWaitingForTyping && playerRef.current && lyricsData.length > 0) {
      const currentTime = playerRef.current.getCurrentTime()
      const adjustedTime = currentTime + 0.3 - syncOffset // Same calculation as sync logic
      const expectedIndex = getCurrentLyricIndex(lyricsData, adjustedTime)
      
      console.log('Checking if offset change should resume:', {
        currentTime,
        syncOffset,
        adjustedTime,
        currentLyricIndex,
        expectedIndex,
        playerState: playerRef.current.getPlayerState()
      })
      
      // Check if we should change lyrics based on new timing
      if (expectedIndex !== currentLyricIndex && expectedIndex >= 0 && expectedIndex < lyricsData.length) {
        // Jump to the expected lyric
        console.log('Jumping to lyric:', expectedIndex)
        const targetLyric = lyricsData[expectedIndex]
        const targetLyricTime = targetLyric?.time ?? 0
        console.log('Lyric sync (offset adjust -> jump)', {
          videoTime: currentTime.toFixed(2),
          lyricTimestamp: targetLyricTime.toFixed(2),
          adjustedTime: adjustedTime.toFixed(2),
          lyricIndex: expectedIndex,
          lyric: targetLyric?.text || ''
        })
        setCurrentLyricIndex(expectedIndex)
        setCurrentLyrics(lyricsData[expectedIndex].text)
        lastProcessedIndex.current = expectedIndex
        setTypedText('')
        typedTextRef.current = ''
        setIsWaitingForTyping(false)
        playerRef.current.playVideo()
      } else if (expectedIndex === currentLyricIndex) {
        // Same lyric index, but check if we're past the next lyric's start time
        const nextLyric = lyricsData[currentLyricIndex + 1]
        if (nextLyric && adjustedTime >= nextLyric.time) {
          // We should be at the next lyric already
          console.log('Time passed next lyric, advancing')
          const newIndex = currentLyricIndex + 1
          const advancedLyric = lyricsData[newIndex]
          const advancedLyricTime = advancedLyric?.time ?? 0
          console.log('Lyric sync (offset adjust -> advance)', {
            videoTime: currentTime.toFixed(2),
            lyricTimestamp: advancedLyricTime.toFixed(2),
            adjustedTime: adjustedTime.toFixed(2),
            lyricIndex: newIndex,
            lyric: advancedLyric?.text || ''
          })
          setCurrentLyricIndex(newIndex)
          setCurrentLyrics(lyricsData[newIndex].text)
          lastProcessedIndex.current = newIndex
          setTypedText('')
          typedTextRef.current = ''
          setIsWaitingForTyping(false)
          playerRef.current.playVideo()
        } else {
          // Check if offset is large enough that we should just resume
          const currentLyric = lyricsData[currentLyricIndex]
          const timeSinceLyricStart = adjustedTime - currentLyric.time
          
          // If we're more than 2 seconds past the lyric start, resume anyway
          if (timeSinceLyricStart > 2.0) {
            console.log('Far past lyric start, resuming playback')
            setIsWaitingForTyping(false)
            playerRef.current.playVideo()
          }
        }
      }
    }
  }, [syncOffset]) // Only run when offset changes

  // Load sync offset when video changes
  useEffect(() => {
    const stored = localStorage.getItem(`syncOffset_${currentVideo}`)
    const parsed = stored ? parseFloat(stored) : 0.5
    setSyncOffset(Number.isNaN(parsed) ? 0.5 : sanitizeOffset(parsed))
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
      
      // Handle debug panel toggle (D key)
      if (e.code === 'KeyD' && e.shiftKey) {
        e.preventDefault()
        setShowDebugPanel((prev: boolean) => {
          const newValue = !prev
          localStorage.setItem('showDebugPanel', JSON.stringify(newValue))
          console.log('Debug panel:', newValue ? 'ON' : 'OFF')
          return newValue
        })
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
            return sanitizeOffset(newOffset)
          })
        } else if (e.code === 'BracketRight') {
          setSyncOffset(prev => {
            const newOffset = Math.round((prev + adjustment) * 10) / 10
            console.log('Increasing offset:', prev, '->', newOffset)
            return sanitizeOffset(newOffset)
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

  const fetchLyrics = async () => {
    setIsLoadingLyrics(true)
    setLyricsError(null)
    
    try {
      const lrcLyrics = await lyricsService.getLrcFormatLyrics({
        trackName: currentTrack.trackName,
        artistName: currentTrack.artistName
      })
      
      if (lrcLyrics) {
        const previewLines = lrcLyrics.split('\n').slice(0, 5)
        console.log('Using LRCLib lyrics', {
          track: currentTrack.trackName,
          artist: currentTrack.artistName,
          preview: previewLines
        })
        const lyrics = parseLRC(lrcLyrics, { removeAdLibs })
        console.log('Loaded lyrics:', lyrics.length, 'lines')
        setLyricsData(lyrics)
        setCurrentLyrics('Play the video to start typing!')
      } else {
        console.warn('No lyrics found, using fallback')
        console.log('Using fallback lyrics', {
          track: currentTrack.trackName,
          artist: currentTrack.artistName,
          preview: RICK_ASTLEY_LRC.split('\n').slice(0, 5)
        })
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
      console.log('Using fallback lyrics due to error', {
        track: currentTrack.trackName,
        artist: currentTrack.artistName,
        preview: RICK_ASTLEY_LRC.split('\n').slice(0, 5)
      })
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
        const offset = syncOffsetRef.current
        const currentTime = playerRef.current.getCurrentTime()
        setVideoTime(currentTime) // Update video time for debug panel
        // Add 300ms buffer - advance lyrics 300ms before actual timestamp
        const LYRIC_ADVANCE_BUFFER = 0.3
        // Positive offset = delay lyrics (they appear later in video time)
        // So subtract offset to get the effective lyric lookup time
        const adjustedTime = currentTime + LYRIC_ADVANCE_BUFFER - offset
        const newIndex = getCurrentLyricIndex(lyricsData, adjustedTime)
        
        // Update player state
        const currentPlayerState = playerRef.current.getPlayerState()
        if (currentPlayerState !== playerState) {
          setPlayerState(currentPlayerState)
        }
        
        // Safeguard: If video is playing but we think we're waiting, fix the state
        if (currentPlayerState === 1 && isWaitingForTypingRef.current) {
          console.log('WARNING: Video playing but waiting flag is set, clearing it')
          setIsWaitingForTyping(false)
        }
        
        // FIRST: Check if we should pause at the next lyric's timestamp (before advancing)
        // Only check if video is playing (state 1)
        // Use lastProcessedIndex as source of truth
        const currentIndex = lastProcessedIndex.current
        if (currentIndex >= 0 && !isWaitingForTypingRef.current && currentPlayerState === 1) {
          const nextLyricIndex = currentIndex + 1
          if (nextLyricIndex < lyricsData.length) {
            const nextLyricTime = lyricsData[nextLyricIndex].time
            const currentTypedText = typedTextRef.current
            // Get the actual current lyric text from data, not state
            const currentLyricText = lyricsData[currentIndex]?.text || ''
            
            // Debug logging for pause check
            const shouldPause = adjustedTime >= nextLyricTime && currentTypedText.length < currentLyricText.length
            
            if (Math.abs(adjustedTime - nextLyricTime) < 1) { // Log when close to next lyric
              console.log('Near next lyric:', {
                adjustedTime: adjustedTime.toFixed(2),
                nextLyricTime: nextLyricTime.toFixed(2),
                shouldPause,
                typed: currentTypedText.length,
                total: currentLyricText.length,
                currentIndex
              })
            }
            
            // Use the same adjusted time as lyric selection
            // Pause if adjusted time reaches next lyric and user hasn't finished current
            if (shouldPause) {
            console.log('Pausing at timestamp - unfinished typing', {
              currentTime,
              syncOffset: offset,
              adjustedTime,
              nextLyricTime,
              timeUntilNext: nextLyricTime - adjustedTime,
              typedLength: currentTypedText.length,
              lyricLength: currentLyricText.length,
                currentIndex
              })
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
        
        // Don't process new index if we're waiting for typing
        if (shouldProcessNewIndex && !isWaitingForTypingRef.current) {
          const currentTypedText = typedTextRef.current
          
          // If we're at the initial state (-1), advance to first lyric (0) immediately
          if (currentProcessedIndex === -1) {
            const firstLyric = lyricsData[0]?.text || ''
            const firstLyricTime = lyricsData[0]?.time ?? 0
            console.log('Lyric sync (initial)', {
              videoTime: currentTime.toFixed(2),
              lyricTimestamp: firstLyricTime.toFixed(2),
              adjustedTime: adjustedTime.toFixed(2),
              lyric: firstLyric
            })
            setCurrentLyricIndex(0)
            setCurrentLyrics(firstLyric)
            lastProcessedIndex.current = 0
            lyricStartTime.current = currentTime
            setIsWaitingForTyping(false)
            return
          }
          
          // For normal lyric advancement, check if user finished current lyric
          const currentLyricText = lyricsData[currentProcessedIndex]?.text || ''
          
          // Only pause if we haven't typed enough AND we're actually at this lyric's time
          if (currentTypedText.length < currentLyricText.length) {
            // Check if we're past this lyric's reasonable display time
            const currentLyricTime = lyricsData[currentProcessedIndex]?.time || 0
            const timeSinceStart = adjustedTime - currentLyricTime
            
            // Only skip if we're not already waiting and way past the lyric
            // Don't skip if we're paused - let the user type!
            if (timeSinceStart > 3.0 && !isWaitingForTypingRef.current && currentPlayerState === 1) {
              console.log('Skipping untyped lyric - too far past', { timeSinceStart })
              // Continue to advance logic below
            } else {
              // Normal pause for typing (or already paused)
              if (!isWaitingForTypingRef.current && currentPlayerState === 1) {
                console.log('Pausing for typing')
                playerRef.current.pauseVideo()
                setIsWaitingForTyping(true)
              } else if (isWaitingForTypingRef.current) {
                console.log('Already waiting, maintaining pause')
              }
              return
            }
          }
          
          // User finished current lyric, advance to next
          const nextLyricIndex = currentProcessedIndex + 1
          if (nextLyricIndex < lyricsData.length) {
            const nextLyric = lyricsData[nextLyricIndex]
            const nextLyricTime = nextLyric?.time ?? 0
            console.log('Lyric sync (advance)', {
              videoTime: currentTime.toFixed(2),
              lyricTimestamp: nextLyricTime.toFixed(2),
              adjustedTime: adjustedTime.toFixed(2),
              lyricIndex: nextLyricIndex,
              lyric: nextLyric?.text || ''
            })
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
    setVideoSearchError(null)
    setIsSearchingVideo(true)
    
    try {
      // Search for the best matching YouTube video
      const videoId = await youtubeService.searchBestMatch(track.trackName, track.artistName)
      
      if (videoId) {
        console.log(`Found video for ${track.artistName} - ${track.trackName}:`, videoId)
        setCurrentVideo(videoId)
      } else {
        console.warn(`No video found for ${track.artistName} - ${track.trackName}, keeping current video`)
        setVideoSearchError('No matching YouTube video found.')
      }
    } catch (error) {
      console.error('Error searching for video:', error)
      const message = error instanceof Error ? error.message : 'Failed to search YouTube.'
      setVideoSearchError(message)
    } finally {
      setIsSearchingVideo(false)
    }

    // Reset typing state when switching songs
    handleReset()
  }

  const handleAdLibToggle = (enabled: boolean) => {
    setRemoveAdLibs(enabled)
    localStorage.setItem('removeAdLibs', JSON.stringify(enabled))
    handleReset() // Reset typing state when changing ad-lib setting
  }

  const handleSyncOffsetChange = (value: number) => {
    setSyncOffset(sanitizeOffset(value))
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
            {videoSearchError && (
              <div className="text-center text-red-400 text-sm">
                {videoSearchError}
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
            syncOffset={syncOffset}
            onSyncOffsetChange={handleSyncOffsetChange}
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

      {showDebugPanel && (
        <DebugPanel
          videoTime={videoTime}
          syncOffset={syncOffset}
          currentLyricIndex={currentLyricIndex}
          lyricsData={lyricsData}
          isWaitingForTyping={isWaitingForTyping}
          playerState={playerState}
          typedText={typedText}
          currentLyrics={currentLyrics}
        />
      )}
    </div>
  )
}

export default App
