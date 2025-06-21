declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerInstance {
  getCurrentTime(): number;
  getPlayerState(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getDuration(): number;
  getVolume(): number;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
}

interface YouTubePlayerOptions {
  videoId: string;
  onReady?: (player: YouTubePlayerInstance) => void;
  onStateChange?: (state: number) => void;
  onError?: (error: number) => void;
}

export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
} as const;

export class YouTubePlayerManager {
  private player: YT.Player | null = null;
  private isAPIReady = false;
  private isPlayerReady = false;
  private pendingInit: (() => void) | null = null;
  private pendingVideoId: string | null = null;
  private options: YouTubePlayerOptions;
  private containerId: string;

  constructor(containerId: string, options: YouTubePlayerOptions) {
    this.containerId = containerId;
    this.options = options;
    this.initializeAPI();
  }

  private initializeAPI() {
    if (window.YT && window.YT.Player) {
      this.isAPIReady = true;
      if (this.pendingInit) {
        this.pendingInit();
        this.pendingInit = null;
      }
    } else {
      window.onYouTubeIframeAPIReady = () => {
        this.isAPIReady = true;
        if (this.pendingInit) {
          this.pendingInit();
          this.pendingInit = null;
        }
      };
    }
  }

  initPlayer() {
    const init = () => {
      if (!document.getElementById(this.containerId)) {
        console.error(`Container element with id "${this.containerId}" not found`);
        return;
      }

      this.player = new window.YT.Player(this.containerId, {
        videoId: this.options.videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
          mute: 1 // Start muted to comply with autoplay policies
        },
        events: {
          onReady: (event: YT.PlayerEvent) => {
            this.isPlayerReady = true;
            const ytPlayer = event.target;
            
            // If there's a pending video to load, load it now
            if (this.pendingVideoId) {
              ytPlayer.loadVideoById(this.pendingVideoId);
              this.pendingVideoId = null;
            }
            
            const playerInstance: YouTubePlayerInstance = {
              getCurrentTime: () => ytPlayer.getCurrentTime(),
              getPlayerState: () => ytPlayer.getPlayerState(),
              playVideo: () => ytPlayer.playVideo(),
              pauseVideo: () => ytPlayer.pauseVideo(),
              seekTo: (seconds: number, allowSeekAhead?: boolean) => 
                ytPlayer.seekTo(seconds, allowSeekAhead ?? true),
              getDuration: () => ytPlayer.getDuration(),
              getVolume: () => ytPlayer.getVolume(),
              setVolume: (volume: number) => ytPlayer.setVolume(volume),
              setPlaybackRate: (rate: number) => ytPlayer.setPlaybackRate(rate),
              getPlaybackRate: () => ytPlayer.getPlaybackRate()
            };
            
            if (this.options.onReady) {
              this.options.onReady(playerInstance);
            }
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (this.options.onStateChange) {
              this.options.onStateChange(event.data);
            }
          },
          onError: (event: YT.OnErrorEvent) => {
            if (this.options.onError) {
              this.options.onError(event.data);
            }
          }
        }
      });
    };

    if (this.isAPIReady) {
      init();
    } else {
      this.pendingInit = init;
    }
  }

  loadVideoById(videoId: string) {
    if (this.player && this.isPlayerReady) {
      this.player.loadVideoById(videoId);
    } else {
      // Store the video ID to load when player is ready
      this.pendingVideoId = videoId;
    }
  }

  destroy() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.isPlayerReady = false;
    this.pendingVideoId = null;
  }

  getPlayer(): YT.Player | null {
    return this.player;
  }
}