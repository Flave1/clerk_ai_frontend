class PCMWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    // Copy PCM to a clean Float32Array
    const pcm = new Float32Array(input.length);
    pcm.set(input);

    // Compute RMS for VAD
    let sum = 0;
    for (let i = 0; i < pcm.length; i++) {
      const s = pcm[i];
      sum += s * s;
    }
    const rms = Math.sqrt(sum / pcm.length);

    // Send PCM & RMS back to main thread
    this.port.postMessage({
      pcm,
      rms,
    });

    return true;
  }
}

registerProcessor("pcm-worklet", PCMWorkletProcessor);
