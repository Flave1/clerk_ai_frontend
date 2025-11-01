import { useState, useRef, useCallback } from 'react';

// Extend Window interface for speech monitoring intervals
declare global {
  interface Window {
    speechMonitorIntervals?: NodeJS.Timeout[];
  }
}

interface AudioRecordingState {
  isRecording: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  error: string | null;
}

interface AudioRecordingControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => Promise<void>;
  requestMicrophonePermission: () => Promise<boolean>;
}

interface AudioRecordingOptions {
  onAudioData?: (audioBlob: Blob) => void;
  onTranscript?: (transcript: string) => void;
  onAudioChunk?: (audioChunk: ArrayBuffer) => void;
  onAudioStream?: (audioChunk: ArrayBuffer, format: string) => void;
}

export const useAudioRecording = (options?: AudioRecordingOptions): AudioRecordingState & AudioRecordingControls => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Voice Activity Detection (VAD) settings
  const vadThreshold = 0.005; // Lowered threshold to be more sensitive to initial speech
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceDelay = 4000; // Increased delay to give more time for speech recognition to complete
  const currentAudioLevelRef = useRef<number>(0);
  const lastTranscriptRef = useRef<string>('');
  const restartCountRef = useRef<number>(0);
  const lastTranscriptTimeRef = useRef<number>(0);
  const transcriptCallbackRef = useRef<((transcript: string) => void) | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const isRecognitionActiveRef = useRef<boolean>(false);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Prevent multiple instances from running using ref
      if (isStartingRef.current) {
        return;
      }
      isStartingRef.current = true;
      
      // Check if we already have a stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Check if we already have a media recorder
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
      }
      
      // First, check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }

      // Get available audio devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      if (audioInputs.length === 0) {
        throw new Error('No microphone devices found. Please connect a microphone.');
      }


      // Try to get user media with more flexible constraints
      let stream: MediaStream;
      try {
        // First try with specific constraints
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
      } catch (error) {
        // Fallback to basic audio constraints
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true
        });
      }
      
      streamRef.current = stream;
      
      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Send audio data to callback if provided
        if (options?.onAudioData && audioBlob.size > 0) {
          options.onAudioData(audioBlob);
        }
        
        // Try speech-to-text using browser API
        try {
          const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim() && options?.onTranscript) {
              options.onTranscript(transcript);
            }
          };
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
          };
          
          // Note: Browser speech recognition doesn't work with audio blobs directly
          // We'll need to use the microphone stream for speech recognition
        } catch (error) {
          // Speech recognition not available
        }
      };
      
      // Start recording with small time slices for real-time processing
      mediaRecorder.start(100); // 100ms chunks
      setIsRecording(true);
      isStartingRef.current = false; // Reset the starting flag
      isRecordingRef.current = true; // Update recording ref
      
      // Reset restart counter and transcript tracking
      restartCountRef.current = 0;
      lastTranscriptRef.current = '';
      lastTranscriptTimeRef.current = 0;
      transcriptCallbackRef.current = options?.onTranscript || null;
      
      // Set up real-time speech recognition
      try {
        // Clean up any existing recognition instance
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            recognitionRef.current.abort();
          } catch (error) {
            // Error cleaning up previous recognition
          }
          recognitionRef.current = null;
        }
        
        const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true; // Changed to true for better speech recognition
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1; // Only get the best result
        
        // Configure speech recognition to be more tolerant
        if ('webkitSpeechRecognition' in window) {
          // WebKit-specific settings for better handling
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
        }
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Send final transcript to callback with deduplication
          if (finalTranscript.trim() && transcriptCallbackRef.current) {
            const trimmedTranscript = finalTranscript.trim();
            const currentTime = Date.now();
            
            // Prevent duplicate transcripts (both text and time-based)
            const isDuplicateText = trimmedTranscript === lastTranscriptRef.current;
            const isDuplicateTime = currentTime - lastTranscriptTimeRef.current < 2000; // 2 seconds
            
            if (!isDuplicateText || !isDuplicateTime) {
              lastTranscriptRef.current = trimmedTranscript;
              lastTranscriptTimeRef.current = currentTime;
              transcriptCallbackRef.current(trimmedTranscript);
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          // Handle different error types appropriately
          if (event.error === 'no-speech') {
            // This is normal - just means no speech was detected, don't restart
            return;
          } else if (event.error === 'aborted') {
            // Recognition was manually stopped, don't restart
            return;
          } else if (event.error === 'not-allowed') {
            // Permission denied, don't restart
            return;
          } else if (event.error === 'network') {
            // Network error, could retry but for now just log
            console.log('Speech recognition network error, will retry on next attempt');
            return;
          } else if (event.error === 'audio-capture') {
            // Audio capture issue, don't restart
            console.log('Speech recognition audio capture error');
            return;
          }
          
          // For other errors, log but don't restart automatically
          console.log(`Speech recognition error: ${event.error}`);
        };
        
        recognition.onend = () => {
          // Reset the recognition active state
          isRecognitionActiveRef.current = false;
          
          // With continuous = true, we don't need to restart as frequently
          if (isRecordingRef.current) {
            // Only restart if recognition actually ended unexpectedly
            setTimeout(() => {
              if (recognitionRef.current && streamRef.current && isRecordingRef.current) {
                try {
                  // Check if recognition is already running before starting
                  if (isRecognitionActiveRef.current) {
                    console.log('Speech recognition already running, skipping restart');
                    return;
                  }
                  
                  // Give more time for speech recognition to complete before restarting
                  setTimeout(() => {
                    if (recognitionRef.current && streamRef.current && isRecordingRef.current && !isRecognitionActiveRef.current) {
                      try {
                        recognitionRef.current.start();
                        isRecognitionActiveRef.current = true;
                      } catch (startError) {
                        console.log('Failed to restart speech recognition:', startError);
                        // Recognition might be in an invalid state, try to recreate
                        try {
                          const newRecognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
                          newRecognition.continuous = true;
                          newRecognition.interimResults = true;
                          newRecognition.lang = 'en-US';
                          newRecognition.maxAlternatives = 1;
                          
                          // Copy event handlers from the old recognition
                          newRecognition.onresult = recognitionRef.current.onresult;
                          newRecognition.onerror = recognitionRef.current.onerror;
                          newRecognition.onend = recognitionRef.current.onend;
                          
                          recognitionRef.current = newRecognition;
                          newRecognition.start();
                          isRecognitionActiveRef.current = true;
                        } catch (recreateError) {
                          console.log('Failed to recreate speech recognition:', recreateError);
                        }
                      }
                    }
                  }, 2000); // Wait 2 seconds before restarting
                } catch (error) {
                  console.log('Error in speech recognition restart logic:', error);
                }
              }
            }, 500); // Shorter delay for faster restart
          }
        };
        
        // Start speech recognition
        try {
          // Check if recognition is already running before starting
          if (!isRecognitionActiveRef.current) {
            recognition.start();
            isRecognitionActiveRef.current = true;
          } else {
            console.log('Speech recognition already running, skipping initial start');
          }
        } catch (startError) {
          console.log('Failed to start speech recognition initially:', startError);
        }
        
        // Add proactive monitoring to prevent speech recognition timeouts
        const monitorSpeechRecognition = () => {
          if (recognitionRef.current && isRecordingRef.current) {
            try {
              // Check if recognition is still active, if not, restart it
              if (recognitionRef.current.state === 'idle' || recognitionRef.current.state === 'stopped') {
                recognitionRef.current.start();
              }
            } catch (error) {
              // Recognition might be in an invalid state, try to recreate
              try {
                const newRecognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
                newRecognition.continuous = true;
                newRecognition.interimResults = true;
                newRecognition.lang = 'en-US';
                newRecognition.maxAlternatives = 1;
                
                // Copy event handlers from the old recognition
                newRecognition.onresult = recognitionRef.current.onresult;
                newRecognition.onerror = recognitionRef.current.onerror;
                newRecognition.onend = recognitionRef.current.onend;
                
                recognitionRef.current = newRecognition;
                newRecognition.start();
              } catch (recreateError) {
                // If recreation fails, just continue
              }
            }
          }
        };
        
        // Monitor every 3 seconds to prevent timeouts
        const speechMonitorInterval = setInterval(monitorSpeechRecognition, 3000);
        
        // Store interval reference for cleanup
        if (!window.speechMonitorIntervals) {
          window.speechMonitorIntervals = [];
        }
        window.speechMonitorIntervals.push(speechMonitorInterval);
        
      } catch (error) {
        // Speech recognition not available
      }
      
      // Start audio level monitoring with Voice Activity Detection
      const monitorAudio = () => {
        if (analyserRef.current && streamRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate RMS (Root Mean Square) for better volume detection
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const normalizedLevel = Math.min(rms / 128, 1); // Normalize to 0-1
          
          setAudioLevel(normalizedLevel);
          currentAudioLevelRef.current = normalizedLevel; // Store for use in MediaRecorder callback
          
          // Voice Activity Detection
          const isVoiceActive = normalizedLevel > vadThreshold;
          setIsSpeaking(isVoiceActive);
          
          // Handle silence timeout
          if (isVoiceActive) {
            // Clear any existing silence timeout
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
          } else {
            // Start silence timeout if not already started
            if (!silenceTimeoutRef.current) {
              silenceTimeoutRef.current = setTimeout(() => {
                // Silence detected, stopping audio streaming
              }, silenceDelay);
            }
          }
          
          // Continue monitoring while recording
          animationFrameRef.current = requestAnimationFrame(monitorAudio);
        }
      };
      
      // Start monitoring after a short delay to ensure everything is set up
      setTimeout(() => {
        if (analyserRef.current && streamRef.current) {
          monitorAudio();
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      isStartingRef.current = false; // Reset the starting flag on error
      isRecordingRef.current = false; // Update recording ref on error
      
      let errorMessage = 'Failed to access microphone. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage += 'No microphone device found. Please connect a microphone and try again.';
        } else if (error.name === 'NotAllowedError') {
          errorMessage += 'Microphone permission denied. Please allow microphone access and refresh the page.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Microphone is being used by another application. Please close other applications using the microphone.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += 'Microphone constraints not supported. Trying with basic settings...';
        } else {
          errorMessage += error.message;
        }
      }
      
      setError(errorMessage);
    }
  }, []);

  const stopRecording = useCallback(() => {
    isStartingRef.current = false; // Reset the starting flag
    isRecordingRef.current = false; // Update recording ref
    isRecognitionActiveRef.current = false; // Reset recognition active state
    
    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Stop media recorder and clear reference
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop speech recognition and clear reference
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (error) {
        // Error stopping speech recognition
      }
      recognitionRef.current = null;
    }
    
    // Stop media stream and clear reference
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Close audio context and clear reference
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear speech recognition monitoring intervals
    if (window.speechMonitorIntervals) {
      window.speechMonitorIntervals.forEach(interval => clearInterval(interval));
      window.speechMonitorIntervals = [];
    }
    
    // Reset all state
    analyserRef.current = null;
    currentAudioLevelRef.current = 0;
    lastTranscriptRef.current = '';
    restartCountRef.current = 0;
    lastTranscriptTimeRef.current = 0;
    transcriptCallbackRef.current = null;
    setIsRecording(false);
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just wanted to check permissions
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Check permissions first
      const hasPermission = await requestMicrophonePermission();
      if (hasPermission) {
        startRecording();
      } else {
        setError('Microphone permission is required to start recording.');
      }
    }
  }, [isRecording, startRecording, stopRecording, requestMicrophonePermission]);

  return {
    isRecording,
    isSpeaking,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    requestMicrophonePermission,
  };
};
