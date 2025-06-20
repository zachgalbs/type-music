class PitchShiftProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'pitchFactor',
        defaultValue: 1.0,
        minValue: 0.25,
        maxValue: 4.0,
        automationRate: 'a-rate'
      }
    ];
  }

  constructor() {
    super();
    this.bufferSize = 4096;
    this.hopSize = this.bufferSize / 4;
    this.overlapBuffer = new Float32Array(this.bufferSize);
    this.grainWindow = this.createWindow(this.bufferSize);
    this.outputBuffer = new Float32Array(this.bufferSize);
    this.inputBuffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.outputIndex = 0;
  }

  createWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputData = input[0];
    const outputData = output[0];
    const pitchFactor = parameters.pitchFactor[0] || 1.0;

    for (let i = 0; i < inputData.length; i++) {
      // Fill input buffer
      this.inputBuffer[this.bufferIndex] = inputData[i];
      this.bufferIndex++;

      // Process when buffer is full
      if (this.bufferIndex >= this.hopSize) {
        this.pitchShift(pitchFactor);
        this.bufferIndex = 0;
      }

      // Output processed audio
      outputData[i] = this.outputBuffer[this.outputIndex];
      this.outputIndex = (this.outputIndex + 1) % this.bufferSize;
    }

    return true;
  }

  pitchShift(pitchFactor) {
    // Simple granular synthesis approach
    const grainSize = this.hopSize;
    const playbackRate = pitchFactor;
    
    // Copy input to overlap buffer with windowing
    for (let i = 0; i < grainSize; i++) {
      if (i < this.inputBuffer.length) {
        const windowValue = this.grainWindow[i * this.bufferSize / grainSize];
        this.overlapBuffer[i] = this.inputBuffer[i] * windowValue;
      }
    }

    // Simple time-domain pitch shifting using overlap-add
    const stretchedGrainSize = Math.floor(grainSize / playbackRate);
    
    for (let i = 0; i < stretchedGrainSize && i < this.bufferSize; i++) {
      const sourceIndex = Math.floor(i * playbackRate);
      if (sourceIndex < grainSize) {
        this.outputBuffer[i] += this.overlapBuffer[sourceIndex] * 0.5;
      }
    }

    // Shift output buffer for next grain
    for (let i = 0; i < this.bufferSize - this.hopSize; i++) {
      this.outputBuffer[i] = this.outputBuffer[i + this.hopSize];
    }
    
    // Clear the end of the buffer
    for (let i = this.bufferSize - this.hopSize; i < this.bufferSize; i++) {
      this.outputBuffer[i] = 0;
    }
  }
}

registerProcessor('pitch-shift-processor', PitchShiftProcessor);