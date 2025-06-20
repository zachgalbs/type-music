export interface YouTubePlayerInstance {
  getCurrentTime(): number;
  getPlayerState(): number;
  playVideo(): void;
  pauseVideo(): void;
}

export class YouTubePlayerManager {
  private player: YouTubePlayerInstance | null = null
  private messageListener: ((event: MessageEvent) => void) | null = null
  private onPlayerReady: (player: YouTubePlayerInstance) => void

  constructor(onPlayerReady: (player: YouTubePlayerInstance) => void) {
    this.onPlayerReady = onPlayerReady
  }

  initPlayer(_iframe: HTMLIFrameElement) {

    // Listen for messages from YouTube iframe
    this.messageListener = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return
      
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data)
          if (data.event === 'video-progress' && data.info) {
            // YouTube sends progress updates
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    window.addEventListener('message', this.messageListener)

    // Create a mock player for now since we can't directly access YouTube's API without additional setup
    this.player = this.createMockPlayer()
    this.onPlayerReady(this.player)
  }

  private createMockPlayer(): YouTubePlayerInstance {
    let currentTime = 0
    let isPlaying = false
    
    // Start a timer to simulate video progress
    window.setInterval(() => {
      if (isPlaying) {
        currentTime += 0.1
      }
    }, 100)

    return {
      getCurrentTime: () => currentTime,
      getPlayerState: () => isPlaying ? 1 : 2, // 1 = playing, 2 = paused
      playVideo: () => { isPlaying = true },
      pauseVideo: () => { isPlaying = false }
    }
  }

  destroy() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener)
    }
    this.player = null
  }

  getPlayer(): YouTubePlayerInstance | null {
    return this.player
  }
}