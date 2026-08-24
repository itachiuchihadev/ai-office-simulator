// js/api/llm-client.js — Official Google Gemini & OpenAI SDK Client with Native Structured Outputs & Audio Transcription

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export class LLMClient {
  constructor(provider = 'gemini', apiKey = '', model = '') {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Standard free-form text chat completion using official SDKs
   */
  async chat(messages, systemInstruction = '') {
    if (!this.apiKey) {
      throw new Error('No API key provided. Please configure your API key in Settings ⚙️.');
    }

    if (this.provider === 'gemini') {
      return this.callGeminiSDK(messages, systemInstruction);
    } else if (this.provider === 'openai') {
      return this.callOpenAISDK(messages, systemInstruction);
    } else {
      throw new Error(`Provider ${this.provider} not supported.`);
    }
  }

  /**
   * Native Structured Output with JSON Schema constraints using official SDKs
   */
  async chatStructured(messages, schema, systemInstruction = '') {
    if (!this.apiKey) {
      throw new Error('No API key provided. Please configure your API key in Settings ⚙️.');
    }

    let rawOutput;
    if (this.provider === 'gemini') {
      rawOutput = await this.callGeminiSDK(messages, systemInstruction, schema);
    } else if (this.provider === 'openai') {
      rawOutput = await this.callOpenAISDK(messages, systemInstruction, schema);
    } else {
      throw new Error(`Provider ${this.provider} not supported.`);
    }

    if (schema && typeof schema.parse === 'function') {
      return schema.parse(rawOutput);
    }
    return typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
  }

  /**
   * Transcribes an audio recording (Blob/File) to text using Gemini Multimodal or OpenAI Whisper
   */
  async transcribeAudio(audioBlob) {
    if (!this.apiKey) {
      throw new Error('Please configure your Gemini or OpenAI API key in Settings ⚙️ to enable AI voice transcription.');
    }

    if (this.provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const modelName = this.model || (JSON.parse(localStorage.getItem('cached_gemini_models') || '[]')[0]?.id);
      if (!modelName) {
        throw new Error('No model selected. Please select a model in the chat panel.');
      }
      const model = genAI.getGenerativeModel({ model: modelName });

      // Convert Blob to Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          const base64 = typeof res === 'string' && res.includes(',') ? res.split(',')[1] : res;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const mimeType = audioBlob.type && audioBlob.type.includes('audio') ? audioBlob.type.split(';')[0] : 'audio/webm';

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        {
          text: 'Transcribe this voice audio message accurately into text. Output ONLY the transcribed text with proper capitalization and punctuation. Do not add any conversational filler, markdown fences, or preamble.'
        }
      ]);

      const response = await result.response;
      return (response.text() || '').trim();
    } else if (this.provider === 'openai') {
      const openai = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });

      const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type || 'audio/webm' });
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1'
      });

      return (transcription.text || '').trim();
    } else {
      throw new Error(`Voice transcription not supported for provider ${this.provider}.`);
    }
  }

  /**
   * Official Google Generative AI SDK Call
   */
  async callGeminiSDK(messages, systemInstruction = '', schema = null) {
    if (!this.model) {
      throw new Error('No Gemini model selected. Please select a model from the selector.');
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const modelOptions = {
      model: this.model
    };

    if (systemInstruction) {
      modelOptions.systemInstruction = systemInstruction;
    }

    if (schema) {
      modelOptions.generationConfig = {
        responseMimeType: 'application/json',
        responseSchema: typeof schema.toGeminiSchema === 'function' ? schema.toGeminiSchema() : schema
      };
    }

    const generativeModel = genAI.getGenerativeModel(modelOptions);

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const result = await generativeModel.generateContent({ contents });
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error('Empty response from Google Gemini SDK.');
    return text;
  }

  /**
   * Official OpenAI SDK Call
   */
  async callOpenAISDK(messages, systemInstruction = '', schema = null) {
    if (!this.model) {
      throw new Error('No OpenAI model selected. Please select a model from the selector.');
    }

    const openai = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true
    });

    const formattedMessages = [];
    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }
    messages.forEach(m => formattedMessages.push({ role: m.role, content: m.content }));

    const params = {
      model: this.model,
      messages: formattedMessages
    };

    if (schema) {
      params.response_format = {
        type: 'json_schema',
        json_schema: typeof schema.toOpenAISchema === 'function' ? schema.toOpenAISchema() : schema
      };
    }

    const completion = await openai.chat.completions.create(params);
    const text = completion.choices?.[0]?.message?.content || '';

    if (!text) throw new Error('Empty response from OpenAI SDK.');
    return text;
  }
}

/**
 * Fetches available Gemini models dynamically directly from Google's Generative Language REST API
 * @param {string} apiKey - Google Gemini API Key
 * @returns {Promise<Array<{id: string, displayName: string, description: string}>>}
 */
export async function fetchGeminiModels(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key.');
  }

  const cleanKey = apiKey.trim();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    let errorMsg = `API Error (${response.status})`;
    try {
      const errData = await response.json();
      if (errData.error?.message) {
        errorMsg = errData.error.message;
      }
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (!data.models || !Array.isArray(data.models)) {
    return [];
  }

  // Filter models supporting 'generateContent' (chat & text generation)
  const chatModels = data.models
    .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map(m => {
      const id = m.name.replace(/^models\//, '');
      return {
        id,
        displayName: m.displayName || id,
        description: m.description || ''
      };
    });

  // Sort dynamically by version number (descending), then flash before pro/others, then displayName
  chatModels.sort((a, b) => {
    const getVersion = (name) => {
      const match = name.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };
    const vA = getVersion(a.id);
    const vB = getVersion(b.id);
    if (vB !== vA) return vB - vA;

    const isFlashA = a.id.toLowerCase().includes('flash');
    const isFlashB = b.id.toLowerCase().includes('flash');
    if (isFlashA && !isFlashB) return -1;
    if (!isFlashA && isFlashB) return 1;

    return a.displayName.localeCompare(b.displayName);
  });

  return chatModels;
}

/**
 * Fetches available OpenAI models dynamically from OpenAI API
 * @param {string} apiKey - OpenAI API Key
 * @returns {Promise<Array<{id: string, displayName: string}>>}
 */
export async function fetchOpenAIModels(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid OpenAI API key.');
  }

  const cleanKey = apiKey.trim();
  let rawList = [];

  try {
    const openai = new OpenAI({
      apiKey: cleanKey,
      dangerouslyAllowBrowser: true
    });
    const list = await openai.models.list();
    for await (const model of list) {
      rawList.push(model);
    }
  } catch (sdkErr) {
    // Direct REST fetch fallback
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${cleanKey}`
      }
    });

    if (!response.ok) {
      let errorMsg = `OpenAI API Error (${response.status})`;
      try {
        const err = await response.json();
        if (err.error?.message) errorMsg = err.error.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    rawList = data.data || [];
  }

  // Filter only chat and reasoning capable models (exclude embeddings, tts, realtime, etc.)
  const chatModels = rawList
    .filter(m => {
      const id = (m.id || '').toLowerCase();
      const isChat = id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('chatgpt-');
      const isExcluded = id.includes('instruct') || id.includes('realtime') || id.includes('audio') || id.includes('tts') || id.includes('embedding') || id.includes('dall-e');
      return isChat && !isExcluded;
    })
    .map(m => ({
      id: m.id,
      displayName: m.id,
      created: m.created || 0
    }));

  // Sort by newest created timestamp first, then alphabetical
  chatModels.sort((a, b) => {
    if (b.created && a.created && b.created !== a.created) {
      return b.created - a.created;
    }
    return a.id.localeCompare(b.id);
  });

  return chatModels;
}


/**
 * Populates the #modelSelector dropdown with dynamic models for a provider
 * @param {string} provider - 'gemini' | 'openai'
 * @param {Array<{id: string, displayName: string}>} models
 */
export function populateModelsInDropdown(provider, models) {
  const selector = document.getElementById('modelSelector');
  if (!selector || !Array.isArray(models) || models.length === 0) return;

  const groupLabel = provider === 'gemini' ? 'Google' : (provider === 'openai' ? 'OpenAI' : provider);
  let group = selector.querySelector(`optgroup[label="${groupLabel}"]`);
  if (!group) {
    group = document.createElement('optgroup');
    group.label = groupLabel;
    if (provider === 'gemini') {
      selector.prepend(group);
    } else {
      selector.appendChild(group);
    }
  }

  const currentVal = selector.value || localStorage.getItem('selected_model');

  // Clear existing options in group
  group.innerHTML = '';

  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.displayName || m.id;
    if (m.id === currentVal) {
      opt.selected = true;
    }
    group.appendChild(opt);
  });

  // Remove placeholder if options now exist
  const placeholder = selector.querySelector('option[disabled]');
  if (placeholder && selector.querySelectorAll('option:not([disabled])').length > 0) {
    placeholder.remove();
  }

  // Retain selection or select the top model if previous selection is missing or empty
  if (models.some(m => m.id === currentVal)) {
    selector.value = currentVal;
  } else if (!selector.value || selector.value === '') {
    selector.value = models[0].id;
  }

  localStorage.setItem('selected_model', selector.value);
  localStorage.setItem(`cached_${provider}_models`, JSON.stringify(models));
}

// Backward compatibility alias for Gemini
export const populateGeminiModelsInDropdown = (models) => populateModelsInDropdown('gemini', models);

/**
 * Initialize model selector on app start: restores cached dynamic models & user selection,
 * and refreshes in background if API keys are available.
 */
export function initModelSelector() {
  const selector = document.getElementById('modelSelector');
  if (!selector) return;

  // 1. Restore cached models for providers if present
  ['gemini', 'openai'].forEach(provider => {
    try {
      const cached = localStorage.getItem(`cached_${provider}_models`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          populateModelsInDropdown(provider, parsed);
        }
      }
    } catch (e) {
      console.warn(`Error reading cached ${provider} models:`, e);
    }
  });

  // 2. Restore selected model
  const savedModel = localStorage.getItem('selected_model');
  if (savedModel) {
    const optionExists = Array.from(selector.options).some(o => o.value === savedModel);
    if (optionExists) {
      selector.value = savedModel;
    }
  }

  // 3. Save selection changes
  selector.addEventListener('change', () => {
    localStorage.setItem('selected_model', selector.value);
  });

  // 4. Background refresh if API keys are configured
  const geminiKey = localStorage.getItem('api_key_gemini');
  if (geminiKey) {
    fetchGeminiModels(geminiKey)
      .then(models => {
        if (models && models.length > 0) {
          populateModelsInDropdown('gemini', models);
        }
      })
      .catch(err => {
        console.warn('Silent Gemini models refresh notice:', err.message);
      });
  }

  const openaiKey = localStorage.getItem('api_key_openai');
  if (openaiKey) {
    fetchOpenAIModels(openaiKey)
      .then(models => {
        if (models && models.length > 0) {
          populateModelsInDropdown('openai', models);
        }
      })
      .catch(err => {
        console.warn('Silent OpenAI models refresh notice:', err.message);
      });
  }
}


