const LANGUAGES = {
  English: 'en',
  Tamil: 'ta',
  Hindi: 'hi',
  Malayalam: 'ml',
  French: 'fr',
  German: 'de',
  Japanese: 'ja'
};

const SPEECH_CODES = {
  English: 'en-US',
  Tamil: 'ta-IN',
  Hindi: 'hi-IN',
  Malayalam: 'ml-IN',
  French: 'fr-FR',
  German: 'de-DE',
  Japanese: 'ja-JP'
};

const MAX_CHARS = 2000;

const sourceText = document.getElementById('sourceText');
const resultText = document.getElementById('resultText');
const fromLang = document.getElementById('fromLang');
const toLang = document.getElementById('toLang');
const translateBtn = document.getElementById('translateBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const listenBtn = document.getElementById('listenBtn');
const swapBtn = document.getElementById('swapBtn');
const statusMessage = document.getElementById('statusMessage');
const charCount = document.getElementById('charCount');

function setStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function updateCharCount() {
  const count = sourceText.value.length;
  charCount.textContent = `${count} / ${MAX_CHARS}`;
}

function setCopyButtonDefault() {
  copyBtn.textContent = '📋 Copy';
  copyBtn.disabled = !resultText.value.trim();
}

function isValidPair(from, to) {
  if (from === 'auto') {
    return to !== 'auto' && to !== 'auto';
  }

  if (!from || !to || from === to) {
    return false;
  }

  const oneIsEnglish = from === 'English' || to === 'English';
  const bothAreEnglish = from === 'English' && to === 'English';
  return oneIsEnglish && !bothAreEnglish;
}

function getRequestConfig() {
  const from = fromLang.value;
  const to = toLang.value;

  if (!isValidPair(from, to)) {
    setStatus('Please select English and one supported language.', 'error');
    return null;
  }

  const sourceValue = from === 'auto' ? 'auto' : LANGUAGES[from];
  const targetValue = LANGUAGES[to];

  return {
    source: sourceValue,
    target: targetValue
  };
}

function validateInput() {
  const text = sourceText.value.trim();

  if (!text) {
    setStatus('Please enter some text to translate.', 'error');
    return null;
  }

  return text;
}

async function translateText() {
  const text = validateInput();
  if (!text) {
    return;
  }

  const config = getRequestConfig();
  if (!config) {
    return;
  }

  if (translateBtn.disabled) {
    return;
  }

  translateBtn.disabled = true;
  translateBtn.textContent = 'Translating...';
  setStatus('Translating...', 'info');

  try {
    const response = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: config.source,
        target: config.target,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error('Translation failed. Please try again.');
    }

    const data = await response.json();
    const translatedText = data.translatedText || '';

    if (!translatedText.trim()) {
      throw new Error('Translation failed. Please try again.');
    }

    resultText.value = translatedText;
    setStatus('Translation complete.', 'success');
    setCopyButtonDefault();
  } catch (error) {
    resultText.value = '';
    const message = error && error.message ? error.message : 'Something went wrong. Please try again.';
    setStatus(message, 'error');
    setCopyButtonDefault();
  } finally {
    translateBtn.disabled = false;
    translateBtn.textContent = 'Translate';
  }
}

function clearFields() {
  sourceText.value = '';
  resultText.value = '';
  updateCharCount();
  setCopyButtonDefault();
  setStatus('Ready to translate.', 'info');
}

async function copyTranslation() {
  const text = resultText.value.trim();

  if (!text) {
    setStatus('Please translate some text first.', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = '✓ Copied!';
    setStatus('Copied to clipboard.', 'success');
    setTimeout(() => {
      setCopyButtonDefault();
    }, 1500);
  } catch (error) {
    setStatus('Unable to copy. Please copy manually.', 'error');
  }
}

function listenToTranslation() {
  const text = resultText.value.trim();

  if (!text) {
    setStatus('Please translate some text first.', 'error');
    return;
  }

  if (!('speechSynthesis' in window)) {
    setStatus('Speech synthesis is not available in this browser.', 'error');
    return;
  }

  const target = toLang.value === 'auto' ? 'English' : toLang.value;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_CODES[target] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  setStatus('Speaking the translated text...', 'info');
}

function swapLanguages() {
  const currentFrom = fromLang.value;
  const currentTo = toLang.value;

  const temp = currentFrom;
  fromLang.value = currentTo;
  toLang.value = temp;

  if (!isValidPair(fromLang.value, toLang.value)) {
    fromLang.value = 'Tamil';
    toLang.value = 'English';
    setStatus('Please select English and one supported language.', 'error');
    return;
  }

  const inputValue = sourceText.value.trim();
  const outputValue = resultText.value.trim();

  if (inputValue && outputValue) {
    sourceText.value = outputValue;
    resultText.value = inputValue;
  }

  setStatus('Languages swapped.', 'success');
}

function handleKeyboardShortcut(event) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const isShortcut = isMac ? event.metaKey && event.key === 'Enter' : event.ctrlKey && event.key === 'Enter';

  if (isShortcut) {
    event.preventDefault();
    translateText();
  }
}

function setupInputLimit() {
  sourceText.addEventListener('input', function () {
    if (sourceText.value.length > MAX_CHARS) {
      sourceText.value = sourceText.value.slice(0, MAX_CHARS);
      setStatus('Maximum 2000 characters allowed.', 'info');
    }
    updateCharCount();
  });
}

function initialize() {
  fromLang.value = 'Tamil';
  toLang.value = 'English';
  updateCharCount();
  setCopyButtonDefault();
  setStatus('Ready to translate.', 'info');
}

sourceText.addEventListener('keydown', handleKeyboardShortcut);
translateBtn.addEventListener('click', translateText);
clearBtn.addEventListener('click', clearFields);
copyBtn.addEventListener('click', copyTranslation);
listenBtn.addEventListener('click', listenToTranslation);
swapBtn.addEventListener('click', swapLanguages);
fromLang.addEventListener('change', () => {
  if (fromLang.value === 'auto' && toLang.value === 'auto') {
    toLang.value = 'English';
  }
  setStatus('Ready to translate.', 'info');
});
toLang.addEventListener('change', () => {
  if (toLang.value === 'auto') {
    toLang.value = 'English';
  }
  setStatus('Ready to translate.', 'info');
});

setupInputLimit();
initialize();
