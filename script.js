const chatEl = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const inputEl = document.getElementById('userInput');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');
const languageModeEl = document.getElementById('languageMode');
const fallbackNoteEl = document.getElementById('fallbackNote');
const ttsEnabledEl = document.getElementById('ttsEnabled');
const stopSpeechEl = document.getElementById('stopSpeech');

const recognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let knowledge;

const addMessage = (text, role) => {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
};

const isHindiText = (text) => /[\u0900-\u097F]/.test(text);

const getLanguageForResponse = (text) => {
  const selected = languageModeEl.value;
  if (selected !== 'auto') {
    return selected;
  }
  return isHindiText(text) ? 'hi' : 'en';
};

const normalize = (text) => text.toLowerCase().trim();

const tokenize = (text) => normalize(text).split(/\s+/).filter(Boolean);

const scoreService = (service, text, lang) => {
  const tokens = tokenize(text);
  const keywords = lang === 'hi' ? service.keywords_hi : service.keywords_en;
  let score = 0;
  for (const key of keywords) {
    const k = normalize(key);
    if (normalize(text).includes(k)) {
      score += 2;
    }
    if (tokens.includes(k)) {
      score += 1;
    }
  }
  return score;
};

const greetReply = {
  en: 'Hello! I can help with Easy My Care Clinic services like diabetes, BP, heart tests, lab tests, and pharmacy support.',
  hi: 'नमस्ते! मैं Easy My Care Clinic की सेवाओं जैसे डायबिटीज, BP, हार्ट टेस्ट, लैब टेस्ट और फार्मेसी सहायता की जानकारी दे सकता/सकती हूँ।'
};

const fallbackReply = {
  en: 'I can help with Hypertension, Diabetes, Weight Loss, Heart tests (ECG/TMT), PFT, ABPM, Lab Tests, and Pharmacy. Ask about any one service.',
  hi: 'मैं हाइपरटेंशन, डायबिटीज, वजन प्रबंधन, हार्ट टेस्ट (ECG/TMT), PFT, ABPM, लैब टेस्ट और फार्मेसी की जानकारी दे सकता/सकती हूँ। किसी एक सेवा के बारे में पूछें।'
};

const buildServiceReply = (service, lang) =>
  lang === 'hi'
    ? `${service.title_hi}: ${service.description_hi}`
    : `${service.title_en}: ${service.description_en}`;

const respond = (userText) => {
  const lang = getLanguageForResponse(userText);
  const text = normalize(userText);

  if (['hi', 'hello', 'hey', 'namaste', 'नमस्ते', 'हेलो'].some((g) => text.includes(g))) {
    return { lang, text: greetReply[lang] };
  }

  if (!knowledge?.services?.length) {
    return { lang, text: fallbackReply[lang] };
  }

  let best = null;
  let bestScore = 0;
  for (const service of knowledge.services) {
    const score = scoreService(service, userText, lang);
    if (score > bestScore) {
      bestScore = score;
      best = service;
    }
  }

  if (best && bestScore > 0) {
    return { lang, text: `${buildServiceReply(best, lang)} ${knowledge.contact[lang]}` };
  }

  return { lang, text: fallbackReply[lang] };
};

const speak = (text, lang) => {
  if (!ttsEnabledEl.checked || !('speechSynthesis' in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  window.speechSynthesis.speak(utterance);
};

const handleSend = (message) => {
  if (!message.trim()) {
    return;
  }
  addMessage(message, 'user');
  const bot = respond(message);
  addMessage(bot.text, 'bot');
  speak(bot.text, bot.lang);
};

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = inputEl.value;
  inputEl.value = '';
  handleSend(message);
});

stopSpeechEl.addEventListener('click', () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});

const updateMicUi = (listening) => {
  micStatus.textContent = listening ? 'Microphone listening…' : 'Microphone idle';
  micStatus.classList.toggle('listening', listening);
  micBtn.textContent = listening ? '⏹ Stop mic' : '🎤 Speak';
};

if (recognitionClass) {
  recognition = new recognitionClass();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => updateMicUi(true);
  recognition.onend = () => updateMicUi(false);

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputEl.value = transcript;
    handleSend(transcript);
  };

  recognition.onerror = () => {
    updateMicUi(false);
  };

  micBtn.addEventListener('click', () => {
    if (micStatus.classList.contains('listening')) {
      recognition.stop();
      return;
    }
    const forcedLang = languageModeEl.value;
    recognition.lang = forcedLang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.start();
  });
} else {
  micBtn.disabled = true;
  micStatus.textContent = 'Speech recognition unavailable in this browser';
  fallbackNoteEl.textContent = 'Voice input is not supported here. Please type your question.';
}

const init = async () => {
  const response = await fetch('/data/clinic_knowledge.json');
  knowledge = await response.json();
  addMessage(
    'Hello / नमस्ते! Ask me about Easy My Care Clinic services in English or Hindi.',
    'bot'
  );
};

init();
