export function setupVoiceInput() {
  const voiceBtn = document.getElementById('voiceBtn');
  const input = document.getElementById('messageInput');
  if (!voiceBtn || !input) return;

  let recognition = null;

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (const result of event.results) {
        transcript += result[0].transcript;
      }
      input.value = transcript;
      input.dispatchEvent(new Event('input'));
    };

    recognition.onend = () => {
      voiceBtn.classList.remove('recording');
    };

    recognition.onerror = () => {
      voiceBtn.classList.remove('recording');
    };
  }

  voiceBtn.addEventListener('click', () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (voiceBtn.classList.contains('recording')) {
      recognition.stop();
      voiceBtn.classList.remove('recording');
    } else {
      recognition.start();
      voiceBtn.classList.add('recording');
    }
  });
}
