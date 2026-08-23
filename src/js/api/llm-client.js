// js/api/llm-client.js — Unified API Client for Gemini & OpenAI

export class LLMClient {
  constructor(provider = 'gemini', apiKey = '', model = '') {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages, systemInstruction = '') {
    if (!this.apiKey) {
      throw new Error('No API key provided. Please configure your API key in Settings ⚙️.');
    }

    if (this.provider === 'gemini') {
      return this.callGemini(messages, systemInstruction);
    } else if (this.provider === 'openai') {
      return this.callOpenAI(messages, systemInstruction);
    } else {
      throw new Error(`Provider ${this.provider} not supported.`);
    }
  }

  async callGemini(messages, systemInstruction) {
    const model = this.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = { contents };
    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API call failed (${response.status})`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Empty response from Gemini API.');
    return reply;
  }

  async callOpenAI(messages, systemInstruction) {
    const model = this.model || 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';

    const formattedMessages = [];
    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }
    messages.forEach(m => formattedMessages.push({ role: m.role, content: m.content }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API call failed (${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
