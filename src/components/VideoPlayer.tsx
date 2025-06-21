import { useEffect, useRef } from 'react'
import { YouTubePlayerManager, type YouTubePlayerInstance } from '../utils/youtubePlayer'

interface VideoPlayerProps {
  videoId: string
  onPlayerReady?: (player: YouTubePlayerInstance) => void
  startMuted?: boolean
}

export default function VideoPlayer({ videoId, onPlayerReady, startMuted = true }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerManagerRef = useRef<YouTubePlayerManager | null>(null)
  const playerIdRef = useRef<string>(`youtube-player-${Date.now()}`)

  useEffect(() => {
    if (!containerRef.current || !onPlayerReady) return

    // Create the player manager
    playerManagerRef.current = new YouTubePlayerManager(playerIdRef.current, {
      videoId,
      onReady: onPlayerReady,
      onStateChange: (state) => {
        console.log('Player state changed:', state)
      },
      onError: (error) => {
        console.error('YouTube player error:', error)
      },
      startMuted
    })

    // Initialize the player
    playerManagerRef.current.initPlayer()

    return () => {
      if (playerManagerRef.current) {
        playerManagerRef.current.destroy()
        playerManagerRef.current = null
      }
    }
  }, [startMuted]) // Re-create player if mute preference changes

  // Handle video ID changes (skip initial mount)
  useEffect(() => {
    if (playerManagerRef.current && videoId) {
      playerManagerRef.current.loadVideoById(videoId)
    }
  }, [videoId])


  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <div 
          ref={containerRef}
          id={playerIdRef.current}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  )
}