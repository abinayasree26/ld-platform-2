/**
 * SpeechInputOffline — Offline Speech-to-Text using local Whisper.cpp
 * 
 * Records audio via MediaRecorder API → sends to backend → gets transcript.
 * 100% private — no audio leaves the device.
 * 
 * Replaces the original SpeechInput that used Web Speech API (sent audio to Google).
 * 
 * Usage:
 *   <SpeechInputOffline onResult={(text) => handleAnswer(text)} />
 *   <SpeechInputOffline onResult={handleAnswer} autoSubmit placeholder="Tap mic and speak" />
 */

import React, { useState, useRef } from 'react';
import { ldAPI } from '../../services/api';

const SpeechInputOffline = ({
  onResult,
  placeholder = 'Tap the mic and speak your answer',
  disabled = false,
  showSubmit = true,
  autoSubmit = false,
  className = '',
}) => {
  const [state, setState] = useState('idle'); // idle | recording | processing | done
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError('');
      setTranscript('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks (release microphone)
        stream.getTracks().forEach((track) => track.stop());

        // Send to backend for transcription
        setState('processing');
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        try {
          const response = await ldAPI.post('/stt', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000, // 30s timeout for transcription
          });

          if (response.data.success && response.data.transcript) {
            const text = response.data.transcript;
            setTranscript(text);
            setState('done');
            if (autoSubmit && text.trim()) {
              onResult(text.trim());
            }
          } else {
            setError('Could not understand. Please try again.');
            setState('idle');
          }
        } catch (err) {
          console.error('[SpeechInputOffline] Error:', err);
          setError('Speech service unavailable. Please type your answer.');
          setState('idle');
        }
      };

      mediaRecorder.start();
      setState('recording');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permission.');
      } else {
        setError('Could not access microphone. Please check your device.');
      }
      setState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const submit = () => {
    if (transcript.trim()) {
      onResult(transcript.trim());
      setTranscript('');
      setState('idle');
    }
  };

  const retry = () => {
    setTranscript('');
    setError('');
    setState('idle');
  };

  return (
    <div className={`flex flex-col items-center gap-3 py-3 ${className}`}>
      {/* Transcript display */}
      {state === 'done' && transcript ? (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">You said:</p>
          <p className="text-base font-semibold text-slate-800">"{transcript}"</p>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <p className="text-sm text-slate-500">
          {state === 'recording' && '🎙️ Recording… speak now'}
          {state === 'processing' && '⏳ Processing your speech…'}
          {state === 'idle' && placeholder}
        </p>
      )}

      {/* Mic button */}
      <button
        type="button"
        onClick={state === 'recording' ? stopRecording : startRecording}
        disabled={disabled || state === 'processing'}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all
          ${state === 'recording'
            ? 'bg-red-600 text-white animate-pulse scale-110'
            : state === 'processing'
            ? 'bg-amber-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}
          ${disabled || state === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {state === 'recording' ? '⏹' : state === 'processing' ? '⏳' : '🎤'}
      </button>

      {/* Privacy badge */}
      <p className="text-[10px] text-slate-400 flex items-center gap-1">
        🔒 100% private — audio never leaves this device
      </p>

      {/* Action buttons after speech is captured */}
      {state === 'done' && transcript && showSubmit && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:border-slate-300"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={disabled}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeechInputOffline;
