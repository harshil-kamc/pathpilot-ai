const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let geminiApiKey = '';
let apiKeyConnected = false;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-flash-lite-latest,gemini-2.5-flash')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const RETRYABLE_ERROR_SNIPPETS = ['high demand', 'unavailable', 'deadline', '503', '500'];

function connectApiKey(apiKey) {
  if (!apiKey) return false;
  geminiApiKey = apiKey.trim(); 
  apiKeyConnected = true;
  return true;
}

function buildGeminiContents(history, message, file) {
  const contents = [];
  for (const item of history) {
    if (!item?.content) continue;
    if (item.role === 'user') contents.push({ role: 'user', parts: [{ text: item.content }] });
    if (item.role === 'assistant') contents.push({ role: 'model', parts: [{ text: item.content }] });
  }

  const currentParts = [];
  if (file && file.data && file.mimeType) {
    currentParts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
  }
  if (message) {
    currentParts.push({ text: message });
  }
  
  contents.push({ role: 'user', parts: currentParts });
  return contents;
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function callGemini(model, history, message, file) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: 'You are PathForge AI. You MUST respond with exactly ONE valid JSON object. Do not include markdown formatting like ```json. ' +
                  'Analyze the user\'s situation or uploaded resume and generate an exhaustive, deeply branching flowchart of career pathways. Do not limit the pathways. ' +
                  'Structure your JSON exactly like this: ' +
                  '{ "chatReply": "Your friendly text message analyzing their profile.", ' +
                  '"pathways": [ { "role": "Role Name", "salary": "Expected Salary", "demand": "High/Low", "automationRisk": "High/Low", "steps": ["Step 1"], "nextRoles": [ { "role": "Sub-Role", "salary": "...", "demand": "...", "automationRisk": "...", "steps": [], "nextRoles": [] } ] } ] }'
          }]
        },
        contents: buildGeminiContents(history, message, file),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000, 
          responseMimeType: "application/json" 
        }
      })
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Failed with status ${response.status}`);
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}

function isRetryableGeminiError(error) {
  const lowerError = String(error.message || '').toLowerCase();
  return RETRYABLE_ERROR_SNIPPETS.some((snippet) => lowerError.includes(snippet));
}

async function generateCareerReply(history, message, file) {
  let lastError = null;
  const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS.filter((model) => model !== DEFAULT_MODEL)];

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await callGemini(model, history, message, file);
      } catch (error) {
        lastError = error;
        if (!isRetryableGeminiError(error) || attempt === 3) break;
        await sleep(1500 * attempt);
      }
    }
  }
  throw lastError;
}

const startupApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
if (connectApiKey(startupApiKey)) console.log('Gemini API key loaded from environment');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/set-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ success: false, message: 'API Key is required' });
  
  try {
    const testKey = apiKey.trim();
    
    const verifyResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(testKey)}`
    );

    if (!verifyResponse.ok) {
      console.error("Key rejected by Google. Status:", verifyResponse.status);
      return res.status(400).json({ success: false, message: 'Invalid API Key. Please check and try again.' });
    }

    connectApiKey(testKey);
    return res.json({ success: true, message: 'Google Gemini connected. Chatbot is ready.' });
    
  } catch (err) {
    console.error("Network error verifying key:", err);
    return res.status(400).json({ success: false, message: 'Failed to verify key with Google.' });
  }
});

app.post('/api/chat', async (req, res) => {
  if (!apiKeyConnected || !geminiApiKey) {
    return res.json({ success: false, reply: 'Please connect your Google API key in Developer Mode first.' });
  }

  const { message, history = [], file } = req.body;

  try {
    const aiData = await generateCareerReply(history, message, file);
    const lowerMsg = message.toLowerCase();
    const showResults = lowerMsg.includes('analyze') || lowerMsg.includes('career') || lowerMsg.includes('path') || lowerMsg.includes('results');

    return res.json({ 
      success: true, 
      reply: aiData.chatReply, 
      pathways: aiData.pathways, 
      showResults 
    });
  } catch (error) {
    console.error('Gemini API Error:', error.message || error);
    let errorMsg = 'Gemini API error. Please try again.';
    const lowerError = String(error.message || '').toLowerCase();

    if (lowerError.includes('429')) errorMsg = 'Rate limit reached. Wait 15-30 seconds.';
    if (lowerError.includes('401') || lowerError.includes('api key not valid')) errorMsg = 'Invalid API key. Reconnect in Developer Mode.';
    if (lowerError.includes('400')) errorMsg = 'Bad request from Gemini. Try a smaller file or reconnect the API key.';
    if (lowerError.includes('quota')) errorMsg = 'This Gemini key has hit its quota limit.';

    return res.json({ success: false, reply: errorMsg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PathForge AI running at http://localhost:${PORT}`));