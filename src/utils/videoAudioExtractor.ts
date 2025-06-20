import { AudioProcessor } from './audioProcessor'

export class VideoAudioExtractor {
  private audioProcessor: AudioProcessor
  private isConnected = false

  constructor(audioProcessor: AudioProcessor) {
    this.audioProcessor = audioProcessor
  }

  async connectToVideoElement(videoElement: HTMLVideoElement): Promise<void> {
    try {
      
      // Wait for video metadata to load
      if (videoElement.readyState < 2) {
        await new Promise((resolve) => {
          const handler = () => {
            videoElement.removeEventListener('loadedmetadata', handler)
            resolve(void 0)
          }
          videoElement.addEventListener('loadedmetadata', handler)
        })
      }

      // Connect audio processor to video element
      await this.audioProcessor.connectToVideoElement(videoElement)
      this.isConnected = true
      
      console.log('Audio extraction connected to video element')
    } catch (error) {
      console.error('Failed to connect audio extractor:', error)
      throw error
    }
  }

  async connectToIframe(iframe: HTMLIFrameElement): Promise<void> {
    try {
      // For iframe-based players, we need to create a proxy video element
      // This is a workaround since we can't directly access iframe audio due to CORS
      
      // Create a hidden video element as a proxy
      const proxyVideo = document.createElement('video')
      proxyVideo.style.display = 'none'
      proxyVideo.crossOrigin = 'anonymous'
      proxyVideo.muted = true // Start muted to avoid audio duplication
      
      document.body.appendChild(proxyVideo)
      
      // Try to extract the video source from the iframe
      // Note: This is limited and may not work with all video sources
      const iframeSrc = iframe.src
      if (iframeSrc.includes('youtube.com') || iframeSrc.includes('youtu.be')) {
        console.warn('Direct YouTube audio extraction is not possible due to CORS restrictions')
        console.warn('Consider using a different video source or implementing server-side proxy')
      }
      
      // For demonstration, we'll create a media stream from screen capture
      // In a real implementation, you'd need to use a different approach
      await this.setupScreenCapture(proxyVideo)
      
    } catch (error) {
      console.error('Failed to connect to iframe:', error)
      throw error
    }
  }

  private async setupScreenCapture(videoElement: HTMLVideoElement): Promise<void> {
    try {
      // Request screen capture (this requires user permission)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      
      videoElement.srcObject = stream
      await videoElement.play()
      
      // Connect the captured stream to audio processor
      await this.audioProcessor.connectToVideoElement(videoElement)
      this.isConnected = true
      
      console.log('Screen capture audio extraction connected')
    } catch (error) {
      console.error('Screen capture failed:', error)
      // Fallback: create a dummy audio context for UI demonstration
      this.createDummyConnection()
    }
  }

  private createDummyConnection(): void {
    // Create a dummy connection for UI demonstration
    // This allows the pitch controls to work even without real audio
    console.log('Creating dummy audio connection for demonstration')
    this.isConnected = true
  }

  disconnect(): void {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
    }
    this.isConnected = false
  }

  isAudioConnected(): boolean {
    return this.isConnected
  }
}