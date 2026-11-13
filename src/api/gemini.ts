import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse } from './types.ts';
import { enforceRateLimit, setSecurityHeaders, validateOrigin } from './middleware.ts';

export async function handleGeminiProxy(req: ApiRequest, res: ApiResponse) {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed. Only POST requests are permitted.',
    });
  }

  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 10)) return;

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Malformed JSON payload.' });
    }
  }

  const { prompt } = body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Invalid request: "prompt" field is required and must be a string.',
    });
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return res.status(400).json({
      error: 'Invalid request: "prompt" cannot be empty.',
    });
  }

  if (trimmedPrompt.length > 4000) {
    return res.status(400).json({
      error: 'Prompt exceeds maximum permitted character limit (4000 chars).',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Gemini AI service is temporarily unavailable: GEMINI_API_KEY is not configured on the server.',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: trimmedPrompt,
    });

    return res.status(200).json({
      text: response.text || '',
    });
  } catch (err: any) {
    console.error('Server-side Gemini API invocation failed:', err?.message || err);
    return res.status(500).json({
      error: 'An internal error occurred while processing the request with Gemini AI.',
    });
  }
}
