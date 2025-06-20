export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private destination: AudioDestinationNode | null = null
  private pitchShiftNode: AudioWorkletNode | null = null
  private isInitialized = false

  constructor() {
    this.initializeAudioContext()
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.destination = this.audioContext.destination
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 1.0
      
      // Load pitch shift processor
      await this.loadPitchShiftProcessor()
      
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  private async loadPitchShiftProcessor() {
    if (!this.audioContext) return

    try {
      // Register the pitch shift processor
      await this.audioContext.audioWorklet.addModule('/pitch-shift-processor.js')
      
      // Create the pitch shift node
      this.pitchShiftNode = new AudioWorkletNode(this.audioContext, 'pitch-shift-processor', {
        parameterData: { pitchFactor: 0.8 } // Default to lower pitch
      })
    } catch (error) {
      console.error('Failed to load pitch shift processor:', error)
    }
  }

  async connectToVideoElement(videoElement: HTMLVideoElement) {
    if (!this.audioContext || !this.isInitialized) {
      await this.initializeAudioContext()
    }

    if (!this.audioContext || !this.gainNode || !this.destination) {
      throw new Error('Audio context not initialized')
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }


    // Disconnect existing source if any
    if (this.sourceNode) {
      this.sourceNode.disconnect()
    }

    // Create new source from video element
    this.sourceNode = this.audioContext.createMediaElementSource(videoElement)

    // Connect the audio graph
    if (this.pitchShiftNode) {
      this.sourceNode
        .connect(this.pitchShiftNode)
        .connect(this.gainNode)
        .connect(this.destination)
    } else {
      // Fallback without pitch shifting
      this.sourceNode
        .connect(this.gainNode)
        .connect(this.destination)
    }
  }

  setPitchFactor(factor: number) {
    if (this.pitchShiftNode) {
      const pitchParam = this.pitchShiftNode.parameters.get('pitchFactor')
      if (pitchParam) {
        pitchParam.value = factor
      }
    }
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  disconnect() {
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
  }

  destroy() {
    this.disconnect()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.isInitialized = false
  }
}