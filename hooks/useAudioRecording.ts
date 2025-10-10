import { useState, useRef, useCallback } from 'react';

interface AudioRecordingState {
  isRecording: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  error: string | null;
}

interface AudioRecordingControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => void;
}

interface AudioRecordingOptions {
  onAudioData?: (audioBlob: Blob) => void;
  onTranscript?: (transcript: string) => void;
  onAudioChunk?: (audioChunk: ArrayBuffer) => void;
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

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
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
          
          // Send audio chunk to callback for real-time processing
          if (options?.onAudioChunk) {
            event.data.arrayBuffer().then(buffer => {
              options.onAudioChunk!(buffer);
            });
          }
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Recording completed, audio blob size:', audioBlob.size);
        
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
            console.log('Speech recognition result:', transcript);
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
          console.log('Speech recognition not available:', error);
        }
      };
      
      // Start recording with small time slices for real-time processing
      mediaRecorder.start(100); // 100ms chunks
      setIsRecording(true);
      
      // Set up real-time speech recognition
      try {
        const recognition = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
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
          
          // Send final transcript to callback
          if (finalTranscript.trim() && options?.onTranscript) {
            options.onTranscript(finalTranscript.trim());
          }
          
          // Log interim results for debugging
          if (interimTranscript) {
            console.log('Interim transcript:', interimTranscript);
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };
        
        recognition.onend = () => {
          // Restart recognition if we're still recording
          if (streamRef.current) {
            recognition.start();
          }
        };
        
        // Start speech recognition
        recognition.start();
        
      } catch (error) {
        console.log('Speech recognition not available:', error);
      }
      
      // Start audio level monitoring
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
          const speaking = normalizedLevel > 0.05; // Lower threshold for better detection
          setIsSpeaking(speaking);
          
          // Debug logging
          if (normalizedLevel > 0.01) {
            console.log(`Audio level: ${normalizedLevel.toFixed(3)}, Speaking: ${speaking}`);
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
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    analyserRef.current = null;
    setIsRecording(false);
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSpeaking,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
  };
};
