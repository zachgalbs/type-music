import { useState } from 'react'
import type { LyricLine } from '../utils/lrcParser'

interface DebugPanelProps {
  videoTime: number
  syncOffset: number
  currentLyricIndex: number
  lyricsData: LyricLine[]
  isWaitingForTyping: boolean
  playerState: number
  typedText: string
  currentLyrics: string
}

export default function DebugPanel({
  videoTime,
  syncOffset,
  currentLyricIndex,
  lyricsData,
  isWaitingForTyping,
  playerState,
  typedText,
  currentLyrics
}: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(2)
    return `${mins}:${secs.padStart(5, '0')}`
  }
  
  const getPlayerStateText = (state: number): string => {
    switch(state) {
      case -1: return 'UNSTARTED'
      case 0: return 'ENDED'
      case 1: return 'PLAYING'
      case 2: return 'PAUSED'
      case 3: return 'BUFFERING'
      case 5: return 'CUED'
      default: return `UNKNOWN (${state})`
    }
  }
  
  // Calculate timing details
  const LYRIC_ADVANCE_BUFFER = 0.3
  // Positive offset = delay lyrics (they appear later in video)
  const adjustedTime = videoTime + LYRIC_ADVANCE_BUFFER - syncOffset
  const currentLyric = lyricsData[currentLyricIndex]
  const nextLyric = lyricsData[currentLyricIndex + 1]
  const prevLyric = lyricsData[currentLyricIndex - 1]
  
  // Calculate time differences
  const timeToCurrentLyric = currentLyric ? adjustedTime - currentLyric.time : null
  const timeToNextLyric = nextLyric ? nextLyric.time - adjustedTime : null
  const timeToPrevLyric = prevLyric ? adjustedTime - prevLyric.time : null
  
  // Find which lyric index we should be at based on adjusted time
  let expectedIndex = -1
  for (let i = lyricsData.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyricsData[i].time) {
      expectedIndex = i
      break
    }
  }
  
  const typingProgress = currentLyrics.length > 0 
    ? Math.round((typedText.length / currentLyrics.length) * 100) 
    : 0
    
  const isIndexMismatch = expectedIndex !== currentLyricIndex && expectedIndex >= 0
  
  return (
    <div className="fixed top-20 right-4 bg-gray-900 text-white text-xs font-mono rounded-lg shadow-xl z-50 border border-gray-700 max-w-md">
      <div 
        className="flex items-center justify-between px-3 py-2 border-b border-gray-700 cursor-pointer hover:bg-gray-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-bold text-green-400">🔍 SYNC DEBUG</span>
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="p-3 space-y-2">
          {/* Video & Sync Info */}
          <div className="border-b border-gray-800 pb-2">
            <div className="text-blue-400 font-bold mb-1">TIMING</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Video Time:</span>
                <span className="text-yellow-300">{formatTime(videoTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sync Offset:</span>
                <span className={syncOffset !== 0 ? 'text-orange-400' : 'text-gray-500'}>
                  {syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s {syncOffset > 0 ? '(delay)' : syncOffset < 0 ? '(earlier)' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Advance Buffer:</span>
                <span className="text-gray-500">+{LYRIC_ADVANCE_BUFFER}s</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-gray-300">Lyric Lookup Time:</span>
                <span className="text-green-400" title="Time used to find which lyric to show">{formatTime(adjustedTime)}</span>
              </div>
            </div>
          </div>
          
          {/* Player State */}
          <div className="border-b border-gray-800 pb-2">
            <div className="text-blue-400 font-bold mb-1">PLAYER STATE</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">State:</span>
                <span className={playerState === 1 ? 'text-green-400' : 'text-yellow-400'}>
                  {getPlayerStateText(playerState)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Waiting for Typing:</span>
                <span className={isWaitingForTyping ? 'text-red-400' : 'text-gray-500'}>
                  {isWaitingForTyping ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Lyric Indices */}
          <div className="border-b border-gray-800 pb-2">
            <div className="text-blue-400 font-bold mb-1">LYRIC TRACKING</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Index:</span>
                <span className="text-white">{currentLyricIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expected Index:</span>
                <span className={isIndexMismatch ? 'text-red-400' : 'text-white'}>
                  {expectedIndex} {isIndexMismatch && '⚠️'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Lyrics:</span>
                <span className="text-gray-500">{lyricsData.length}</span>
              </div>
            </div>
          </div>
          
          {/* Lyric Timing */}
          <div className="border-b border-gray-800 pb-2">
            <div className="text-blue-400 font-bold mb-1">LYRIC TIMING</div>
            <div className="space-y-1">
              {prevLyric && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Prev Lyric [{currentLyricIndex - 1}]:</span>
                  <span className="text-gray-500">
                    {formatTime(prevLyric.time)} ({timeToPrevLyric ? `+${timeToPrevLyric.toFixed(1)}s ago` : ''})
                  </span>
                </div>
              )}
              
              {currentLyric && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Lyric [{currentLyricIndex}]:</span>
                  <span className="text-yellow-300">
                    {formatTime(currentLyric.time)} 
                    {timeToCurrentLyric !== null && (
                      <span className={Math.abs(timeToCurrentLyric) < 0.5 ? 'text-green-400' : 'text-orange-400'}>
                        {' '}({timeToCurrentLyric > 0 ? '+' : ''}{timeToCurrentLyric.toFixed(1)}s)
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {nextLyric && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Next Lyric [{currentLyricIndex + 1}]:</span>
                  <span className="text-cyan-300">
                    {formatTime(nextLyric.time)} 
                    {timeToNextLyric !== null && (
                      <span className={timeToNextLyric < 1 ? 'text-red-400' : 'text-gray-500'}>
                        {' '}(in {timeToNextLyric.toFixed(1)}s)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Typing Progress */}
          <div className="border-b border-gray-800 pb-2">
            <div className="text-blue-400 font-bold mb-1">TYPING PROGRESS</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Typed/Total:</span>
                <span className={typingProgress === 100 ? 'text-green-400' : 'text-yellow-300'}>
                  {typedText.length}/{currentLyrics.length} ({typingProgress}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    typingProgress === 100 ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${typingProgress}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Current Lyric Text */}
          <div>
            <div className="text-blue-400 font-bold mb-1">CURRENT LYRIC</div>
            <div className="bg-gray-800 p-2 rounded text-gray-300 break-words">
              {currentLyrics || '(no lyric)'}
            </div>
            {currentLyric && currentLyric.text !== currentLyrics && (
              <div className="mt-1 text-red-400 text-xs">
                ⚠️ Display mismatch! Expected: "{currentLyric.text}"
              </div>
            )}
          </div>
          
          {/* Upcoming Lyrics Preview */}
          <div>
            <div className="text-blue-400 font-bold mb-1">UPCOMING</div>
            <div className="space-y-1 text-gray-500">
              {[1, 2, 3].map(offset => {
                const lyric = lyricsData[currentLyricIndex + offset]
                if (!lyric) return null
                return (
                  <div key={currentLyricIndex + offset} className="text-xs">
                    [{currentLyricIndex + offset}] {formatTime(lyric.time)}: {lyric.text.substring(0, 40)}...
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}