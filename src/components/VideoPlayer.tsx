import { useEffect, useRef } from 'react'
import { YouTubePlayerManager, type YouTubePlayerInstance } from '../utils/youtubePlayer'

interface VideoPlayerProps {
  videoId: string
  onPlayerReady?: (player: YouTubePlayerInstance) => void
}

export default function VideoPlayer({ videoId, onPlayerReady }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerManagerRef = useRef<YouTubePlayerManager | null>(null)

  useEffect(() => {
    if (iframeRef.current && onPlayerReady) {
      playerManagerRef.current = new YouTubePlayerManager(onPlayerReady)
      
      const handleLoad = () => {
        if (iframeRef.current && playerManagerRef.current) {
          playerManagerRef.current.initPlayer(iframeRef.current)
        }
      }

      iframeRef.current.addEventListener('load', handleLoad)
      handleLoad()

      return () => {
        if (playerManagerRef.current) {
          playerManagerRef.current.destroy()
        }
      }
    }
  }, [onPlayerReady])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&enablejsapi=1&origin=${window.location.origin}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </div>
    </div>
  )
}