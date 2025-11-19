import { useCallback, useEffect, useRef, useState } from "react";
import callClient from "../lib/callClient";

export interface RecorderState {
  listening: boolean;
  speaking: boolean;
  rms: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

const MIN_CHUNK_MS = 8;            // 128 samples @ 16kHz
const MIN_COMMIT_MS = 120;         // must have >=100ms real audio
const SILENCE_HANGOVER_MS = 350;   // how long to wait after last voice
const RMS_THRESHOLD = 0.005;       // VAD trigger level

export default function useAudioRecorder(): RecorderState {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [rms, setRms] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStoppedRef = useRef<boolean>(false);

  // STATE FOR VAD
  const lastVoiceTs = useRef<number>(0);
  const firstAudioTs = useRef<number | null>(null);
  const audioStarted = useRef<boolean>(false);

  // Indicates bot is speaking → if user talks, send interrupt
  const botSpeaking = useRef<boolean>(false);

  // Backend tells us when bot TTS starts
  useEffect(() => {
    const unsub = callClient.onMessage((msg) => {
      if (msg.type === "tts_audio") {
        botSpeaking.current = true;
      }
      if (msg.type === "tts_audio" && msg.audio.byteLength === 0) {
        botSpeaking.current = false;
      }
      if (msg.type === "tts_complete") {
        botSpeaking.current = false;
      }
    });
    return unsub;
  }, []);

  // Stop speaking flag if user begins talking
  function handleUserInterrupt() {
    if (botSpeaking.current) {
      callClient.sendInterrupt();
      botSpeaking.current = false;
    }
  }

  // -------------------------------------------------------------------
  // INITIALIZE RECORDER (ChatGPT-style)
  // -------------------------------------------------------------------
  const start = useCallback(async () => {
    // If already listening, don't start again
    if (listening) {
      return;
    }

    // Reset stopped flag - we're attempting to start
    isStoppedRef.current = false;
    
    setListening(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,  // Enable to prevent feedback loop
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
      },
    });

    streamRef.current = stream;

    ctxRef.current = new AudioContext({ sampleRate: 16000 });
    
    // Resume AudioContext if suspended (required by browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume();
    }
    
    await ctxRef.current.audioWorklet.addModule("/audio-worklet.js");

    const source = ctxRef.current.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ctxRef.current, "pcm-worklet");

    workletNodeRef.current = node;

    node.port.onmessage = (ev) => {
      const { pcm, rms } = ev.data;
      setRms(rms);

      const now = performance.now();

      // Voice detected
      const isUserVoice = rms > RMS_THRESHOLD;
      if (isUserVoice) {
        handleUserInterrupt();
        lastVoiceTs.current = now;

        if (!audioStarted.current) {
          audioStarted.current = true;
          firstAudioTs.current = now;
        }
      }

      // Send audio to backend only when:
      // 1. Bot is NOT speaking, OR
      // 2. User voice is detected (for interruption)
      // This prevents bot's own voice from being sent back (feedback loop)
      if (pcm && pcm.length > 0) {
        const shouldSendAudio = !botSpeaking.current || isUserVoice;
        
        if (shouldSendAudio) {
          // pcm is Float32Array → convert to PCM16
          const pcm16 = floatToPCM16(pcm);
          // Convert to ArrayBuffer (not ArrayBufferLike/SharedArrayBuffer)
          const buffer = new ArrayBuffer(pcm16.byteLength);
          new Uint8Array(buffer).set(new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength));
          callClient.sendAudio(buffer);
        }
      }

      checkForCommit();
    };

    source.connect(node);
    // DO NOT connect node to destination - this would create immediate feedback loop
    // The microphone should only be used for recording, not for playback monitoring
  }, [listening]);

  // -------------------------------------------------------------------
  // AUTO-COMMIT LOGIC (ChatGPT style)
  // -------------------------------------------------------------------
  function checkForCommit() {
    if (!audioStarted.current) return;

    const now = performance.now();
    const elapsed = now - (firstAudioTs.current ?? now);
    const sinceLastVoice = now - lastVoiceTs.current;

    // REQUIRE MINIMUM AUDIO FIRST (100ms)
    if (elapsed < MIN_COMMIT_MS) return;

    // SILENCE DETECTED → commit
    if (sinceLastVoice > SILENCE_HANGOVER_MS) {
      commit();
    }
  }

  // -------------------------------------------------------------------
  // COMMIT AUDIO
  // -------------------------------------------------------------------
  function commit() {
    if (!audioStarted.current) return;

    callClient.sendMessage({ type: "commit" });

    // Reset VAD state
    audioStarted.current = false;
    firstAudioTs.current = null;
    lastVoiceTs.current = 0;
  }

  // -------------------------------------------------------------------
  // STOP
  // -------------------------------------------------------------------
  const stop = useCallback(async () => {
    // Prevent multiple calls
    if (isStoppedRef.current) return;
    isStoppedRef.current = true;

    // Only update state if we're actually listening
    setListening((prevListening) => {
      if (prevListening) {
        return false;
      }
      return prevListening;
    });

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      try {
        await ctxRef.current.close();
      } catch (e) {
        // Ignore errors if already closed
      }
      ctxRef.current = null;
    }

    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.disconnect();
      } catch (e) {
        // Ignore errors
      }
      workletNodeRef.current = null;
    }

    setRms(0);
    audioStarted.current = false;
    firstAudioTs.current = null;
  }, []);

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  function floatToPCM16(float32: Float32Array): Int16Array {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 32768 : s * 32767;
    }
    return out;
  }

  return {
    listening,
    speaking: botSpeaking.current,
    rms,
    start,
    stop,
  };
}
