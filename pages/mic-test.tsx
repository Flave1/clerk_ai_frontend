import React from 'react';
import Head from 'next/head';
import { useAudioRecording } from '@/hooks/useAudioRecording';

const MicTestPage: React.FC = () => {
  const {
    isRecording,
    isSpeaking,
    audioLevel,
    error,
    toggleRecording,
  } = useAudioRecording({
    onTranscript: (transcript: string) => {
      console.log('Transcript received:', transcript);
      alert(`You said: "${transcript}"`);
    }
  });

  return (
    <>
      <Head>
        <title>Microphone Test - AI Receptionist</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🎤 Microphone Test
          </h1>
          
          <div className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className={`inline-block p-4 rounded-full ${
                isRecording 
                  ? isSpeaking 
                    ? 'bg-red-500 text-white' 
                    : 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isRecording ? (
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${
                      isSpeaking ? 'bg-white animate-pulse' : 'bg-red-400'
                    }`} />
                    <span className="font-medium">
                      {isSpeaking ? 'Speaking!' : 'Listening...'}
                    </span>
                  </div>
                ) : (
                  <span>Click to start recording</span>
                )}
              </div>
            </div>

            {/* Audio Level */}
            {isRecording && (
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-sm text-gray-600">Audio Level: </span>
                  <span className="font-mono text-lg font-bold text-blue-600">
                    {audioLevel.toFixed(3)}
                  </span>
                </div>
                
                {/* Visual Audio Level */}
                <div className="flex justify-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full transition-all duration-100 ${
                        audioLevel > (i + 1) * 0.1
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        height: `${Math.max(8, audioLevel * 40 + 8)}px`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Record Button */}
            <button
              onClick={toggleRecording}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Instructions:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Start Recording"</li>
                <li>Allow microphone permission when prompted</li>
                <li>Speak into your microphone</li>
                <li>Watch the audio level bars and "Speaking!" indicator</li>
                <li>Stop recording to see speech-to-text result</li>
              </ol>
            </div>

            {/* Browser Support */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p><strong>Browser Support:</strong></p>
              <p>✅ Chrome, Edge: Full support</p>
              <p>✅ Firefox: Full support</p>
              <p>⚠️ Safari: Limited support (requires HTTPS)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MicTestPage;
