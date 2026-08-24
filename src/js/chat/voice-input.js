// js/chat/voice-input.js — Speech-to-Text with Web Speech API & Multimodal AI Audio Fallback

import { LLMClient } from '../api/llm-client.js';
import { getStoredApiKeys } from '../ui/settings-modal.js';
import { addChatMessage } from './chat-ui.js';

export function setupVoiceInput() {
  const voiceBtn = document.getElementById('voiceBtn');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  if (!voiceBtn || !input) return;

  let recognition = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;

  // Initialize Web Speech API if supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isRecording = true;
        voiceBtn.classList.add('recording');
        voiceBtn.title = 'Recording speech... Click to stop';
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        input.value = transcript;
        input.dispatchEvent(new Event('input'));
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        if (sendBtn) sendBtn.disabled = !transcript.trim();
      };

      recognition.onend = () => {
        stopRecordingState();
      };

      recognition.onerror = (e) => {
        console.warn('SpeechRecognition error:', e.error);
        stopRecordingState();
        // If Web Speech API fails due to network or service errors, prompt to use audio recorder
        if (e.error === 'network' || e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          fallbackToMediaRecorder();
        }
      };
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
      recognition = null;
    }
  }

  function stopRecordingState() {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceBtn.classList.remove('transcribing');
    voiceBtn.title = 'Voice Input';
  }

  /**
   * MediaRecorder fallback for browsers without Web Speech API or when network speech fails
   */
  async function fallbackToMediaRecorder() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not supported on this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        
        if (audioBlob.size < 100) {
          stopRecordingState();
          return;
        }

        // Show transcribing visual state
        voiceBtn.classList.remove('recording');
        voiceBtn.classList.add('transcribing');
        const prevPlaceholder = input.placeholder;
        input.placeholder = '🎙️ Transcribing audio with AI...';

        try {
          const keys = getStoredApiKeys();
          const provider = keys.gemini ? 'gemini' : (keys.openai ? 'openai' : 'gemini');
          const apiKey = keys[provider] || keys.gemini || keys.openai;

          if (!apiKey) {
            throw new Error('Please configure your Gemini or OpenAI API Key in Settings ⚙️ for AI audio transcription.');
          }

          const selectedModel = document.getElementById('modelSelector')?.value || '';
          const llm = new LLMClient(provider, apiKey, selectedModel);
          const transcription = await llm.transcribeAudio(audioBlob);

          if (transcription) {
            input.value = transcription;
            input.dispatchEvent(new Event('input'));
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            if (sendBtn) sendBtn.disabled = false;
          }
        } catch (err) {
          console.error('Audio transcription failed:', err);
          addChatMessage('System', `⚠️ **Voice Error:** ${err.message}`, 'ai');
        } finally {
          input.placeholder = prevPlaceholder;
          stopRecordingState();
        }
      };

      mediaRecorder.start();
      isRecording = true;
      voiceBtn.classList.add('recording');
      voiceBtn.title = 'Recording audio... Click to stop';
    } catch (micErr) {
      console.error('Microphone permission error:', micErr);
      alert(`Microphone error: ${micErr.message}. Please allow microphone access.`);
      stopRecordingState();
    }
  }

  voiceBtn.addEventListener('click', async () => {
    if (isRecording) {
      if (recognition) {
        try { recognition.stop(); } catch (_) {}
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (_) {}
      }
      stopRecordingState();
    } else {
      if (recognition) {
        try {
          recognition.start();
        } catch (err) {
          console.warn('Recognition start failed, falling back to MediaRecorder:', err);
          fallbackToMediaRecorder();
        }
      } else {
        fallbackToMediaRecorder();
      }
    }
  });
}
