/**
 * AudioEngine.ts
 * -----------------------------------------------------
 * Smooth PCM16 TTS streaming engine
 * ChatGPT-style buffer scheduling
 * -----------------------------------------------------
 * - Plays streamed 16-bit linear PCM at 16 kHz
 * - No crackling, no gaps, no overlaps
 * - Uses AudioWorklet for sample-accurate playback
 * - Buffers incoming audio until the worklet pulls it
 */

class AudioEngine {
    private context: AudioContext | null = null;
    private workletNode: AudioWorkletNode | null = null;
  
    private initialized = false;
    private queue: Float32Array[] = [];
  
    private loadingPromise: Promise<void> | null = null;
  
    // -----------------------------------------------------
    // PUBLIC: Push incoming audio (PCM16 raw bytes)
    // -----------------------------------------------------
    push(buffer: ArrayBuffer) {
      if (!this.initialized) return;
  
      const samples = new Int16Array(buffer);
      const float32 = new Float32Array(samples.length);
  
      // Convert PCM16 → Float32
      for (let i = 0; i < samples.length; i++) {
        float32[i] = samples[i] / 32768;
      }
  
      this.queue.push(float32);
      this.flush();
    }
  
    // -----------------------------------------------------
    // PUBLIC: Reset all audio (stop playing + clear buffer)
    // -----------------------------------------------------
    reset() {
      this.queue.length = 0;
      if (this.workletNode) {
        this.workletNode.port.postMessage({ type: "clear" });
      }
    }
  
    // -----------------------------------------------------
    // PRIVATE: Flush queue to audio worklet when ready
    // -----------------------------------------------------
    private flush() {
      if (!this.workletNode) return;
      if (this.queue.length === 0) return;
  
      // Send queued audio to worklet
      for (const chunk of this.queue) {
        this.workletNode.port.postMessage({
          type: "chunk",
          samples: chunk,
        });
      }
  
      this.queue = [];
    }
  
    // -----------------------------------------------------
    // PUBLIC: Initialize engine (called by CallClient)
    // -----------------------------------------------------
    async init() {
      if (this.initialized) return this.loadingPromise;
  
      this.initialized = true;
  
      // Lazily load worklet
      this.loadingPromise = this._initWorklet();
      return this.loadingPromise;
    }
  
    // -----------------------------------------------------
    // INTERNAL: Setup worklet + audio graph
    // -----------------------------------------------------
    private async _initWorklet() {
      this.context = new AudioContext({
        sampleRate: 16000, // Match backend + OpenAI Realtime
        latencyHint: "interactive",
      });
  
      // Resume on Safari/Chrome
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
  
      // Load worklet processor
      await this.context.audioWorklet.addModule(
        URL.createObjectURL(
          new Blob([WORKLET_CODE], { type: "application/javascript" })
        )
      );
  
      this.workletNode = new AudioWorkletNode(
        this.context,
        "pcm16-playback-processor"
      );
  
      this.workletNode.connect(this.context.destination);
  
      // Pass any queued audio (if arrived before init completed)
      this.flush();
    }
  }
  
  export default AudioEngine;
  
  /* -------------------------------------------------------
   * AudioWorklet Processor (embedded as string)
   * -------------------------------------------------------
   * Runs sample-accurate playback of streaming PCM16 data.
   * Pulls buffers FIFO and outputs clean continuous audio.
   */
  
  const WORKLET_CODE = `
  class PCM16PlaybackProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
  
      this.queue = [];
      this.readIndex = 0;
      this.current = null;
  
      this.port.onmessage = (ev) => {
        const msg = ev.data;
  
        if (msg.type === "chunk") {
          this.queue.push(msg.samples);
        } else if (msg.type === "clear") {
          this.queue = [];
          this.current = null;
          this.readIndex = 0;
        }
      };
    }
  
    process(inputs, outputs) {
      const output = outputs[0][0];
  
      for (let i = 0; i < output.length; i++) {
        if (!this.current) {
          if (this.queue.length === 0) {
            // No audio → output silence
            output[i] = 0;
            continue;
          }
  
          // Load next buffer
          this.current = this.queue.shift();
          this.readIndex = 0;
        }
  
        output[i] = this.current[this.readIndex++] || 0;
  
        // If finished reading, move to next chunk
        if (this.readIndex >= this.current.length) {
          this.current = null;
          this.readIndex = 0;
        }
      }
      return true;
    }
  }
  
  registerProcessor("pcm16-playback-processor", PCM16PlaybackProcessor);
  `;
  