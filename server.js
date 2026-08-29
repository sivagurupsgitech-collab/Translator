const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const LANGUAGE_CODES = {
  English: 'en',
  Tamil: 'ta',
  Hindi: 'hi',
  Malayalam: 'ml',
  French: 'fr',
  German: 'de',
  Japanese: 'ja'
};

const VALID_PAIRS = new Set([
  'English-Tamil',
  'English-Hindi',
  'English-Malayalam',
  'English-French',
  'English-German',
  'English-Japanese',
  'Tamil-English',
  'Hindi-English',
  'Malayalam-English',
  'French-English',
  'German-English',
  'Japanese-English'
]);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/translate', async (req, res) => {
  const { text, from, to } = req.body || {};

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'Please enter some text.' });
  }

  if (!from || !to || !VALID_PAIRS.has(`${from}-${to}`)) {
    return res.status(400).json({
      message: 'Unsupported language combination. Use English ↔ one of Tamil, Hindi, Malayalam, French, German, or Japanese.'
    });
  }

  const sourceCode = LANGUAGE_CODES[from];
  const targetCode = LANGUAGE_CODES[to];

  if (!sourceCode || !targetCode) {
    return res.status(400).json({ message: 'Unsupported language combination.' });
  }

  try {
    const response = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: sourceCode,
        target: targetCode,
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

    return res.json({ translatedText });
  } catch (error) {
    const message = error && error.message ? error.message : 'Translation failed. Please try again.';
    return res.status(502).json({ message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MiniTranslate server running on http://localhost:${PORT}`);
});
