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
      const model = genAI.getGenerativeModel({ model: this.model || 'gemini-2.5-flash' });

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
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const modelName = this.model || 'gemini-2.5-flash';

    const modelOptions = {
      model: modelName
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
    const openai = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true
    });

    const modelName = this.model || 'gpt-4o-mini';

    const formattedMessages = [];
    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }
    messages.forEach(m => formattedMessages.push({ role: m.role, content: m.content }));

    const params = {
      model: modelName,
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
