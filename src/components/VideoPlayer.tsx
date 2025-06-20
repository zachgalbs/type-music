import { useEffect, useRef } from 'react'
import { YouTubePlayerManager, type YouTubePlayerInstance } from '../utils/youtubePlayer'
import { AudioProcessor } from '../utils/audioProcessor'
import { VideoAudioExtractor } from '../utils/videoAudioExtractor'
import PitchControl from './PitchControl'

interface VideoPlayerProps {
  videoId: string
  onPlayerReady?: (player: YouTubePlayerInstance) => void
}

export default function VideoPlayer({ videoId, onPlayerReady }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerManagerRef = useRef<YouTubePlayerManager | null>(null)
  const playerIdRef = useRef<string>(`youtube-player-${Date.now()}`)
  const audioProcessorRef = useRef<AudioProcessor | null>(null)
  const audioExtractorRef = useRef<VideoAudioExtractor | null>(null)

  useEffect(() => {
    if (!containerRef.current || !onPlayerReady) return

    // Initialize audio processor
    audioProcessorRef.current = new AudioProcessor()
    audioExtractorRef.current = new VideoAudioExtractor(audioProcessorRef.current)

    // Create the player manager
    playerManagerRef.current = new YouTubePlayerManager(playerIdRef.current, {
      videoId,
      onReady: (player) => {
        onPlayerReady(player)
        
        // Connect audio processing after player is ready
        setTimeout(async () => {
          const iframe = document.querySelector(`#${playerIdRef.current} iframe`) as HTMLIFrameElement
          if (iframe && audioExtractorRef.current) {
            try {
              await audioExtractorRef.current.connectToIframe(iframe)
              console.log('Audio processing connected to video player')
            } catch (error) {
              console.error('Failed to connect audio processing:', error)
            }
          }
        }, 1000)
      },
      onStateChange: (state) => {
        console.log('Player state changed:', state)
      },
      onError: (error) => {
        console.error('YouTube player error:', error)
      }
    })

    // Initialize the player
    playerManagerRef.current.initPlayer()

    return () => {
      if (playerManagerRef.current) {
        playerManagerRef.current.destroy()
        playerManagerRef.current = null
      }
      if (audioExtractorRef.current) {
        audioExtractorRef.current.disconnect()
        audioExtractorRef.current = null
      }
      if (audioProcessorRef.current) {
        audioProcessorRef.current.destroy()
        audioProcessorRef.current = null
      }
    }
  }, []) // Only run once on mount

  // Handle video ID changes (skip initial mount)
  useEffect(() => {
    if (playerManagerRef.current && videoId) {
      playerManagerRef.current.loadVideoById(videoId)
    }
  }, [videoId])

  const handlePitchChange = (factor: number) => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.setPitchFactor(factor)
    }
  }

  const handleVolumeChange = (volume: number) => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.setVolume(volume)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <div 
          ref={containerRef}
          id={playerIdRef.current}
          className="absolute inset-0 w-full h-full"
        />
      </div>
      
      <PitchControl 
        onPitchChange={handlePitchChange}
        onVolumeChange={handleVolumeChange}
        disabled={!audioExtractorRef.current?.isAudioConnected()}
      />
    </div>
  )
}