import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_CONFIG, isValidKey } from '../config/api';

let genAIClient: GoogleGenerativeAI | null = null;

// Initialize Google Generative AI safely
function getClient(): GoogleGenerativeAI | null {
  if (genAIClient) return genAIClient;

  if (isValidKey(API_CONFIG.GEMINI_API_KEY)) {
    try {
      genAIClient = new GoogleGenerativeAI(API_CONFIG.GEMINI_API_KEY);
      return genAIClient;
    } catch (e) {
      console.error('Failed to initialize GoogleGenerativeAI client:', e);
    }
  }
  return null;
}

/**
 * Generate a standard AI response (non-streaming).
 */
export async function generateAIResponse(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const client = getClient();

  if (!client) {
    return `### AI Threat Console Error
VITE_GEMINI_API_KEY is not configured. Please supply a valid Google Gemini API Key in your environment variables/secrets.

**How to set up:**
1. Create a secret/environment variable named \`VITE_GEMINI_API_KEY\`
2. Set it to your Google AI Studio API Key.`;
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      ...(systemInstruction ? { systemInstruction } : {}),
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (error: any) {
    console.error('Gemini API call failed:', error);
    return `### AI Threat Console Connection Error
Failed to communicate with Google Gemini API:
\`\`\`text
${error.message || error}
\`\`\`
Please verify your API key validity and network connectivity.`;
  }
}

/**
 * Generate an AI response stream.
 * Calls onChunk for each stream slice and returns the complete text at the end.
 */
export async function generateAIResponseStream(
  prompt: string,
  onChunk: (text: string) => void,
  onComplete?: (text: string) => void,
  systemInstruction?: string
): Promise<string> {
  const client = getClient();

  if (!client) {
    const errText = `### AI Threat Console Error\nVITE_GEMINI_API_KEY is not configured. Please supply a valid Google Gemini API Key in your environment variables/secrets.\n\n**How to set up:**\n1. Create a secret/environment variable named \`VITE_GEMINI_API_KEY\`\n2. Set it to your Google AI Studio API Key.`;
    onChunk(errText);
    if (onComplete) onComplete(errText);
    return errText;
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      ...(systemInstruction ? { systemInstruction } : {}),
    });

    const result = await model.generateContentStream(prompt);
    let completeText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      completeText += chunkText;
      onChunk(completeText);
    }

    if (onComplete) onComplete(completeText);
    return completeText;
  } catch (error: any) {
    console.error('Gemini Streaming API call failed:', error);
    const errText = `### AI Threat Console Connection Error\nFailed to stream response from Google Gemini API:\n\`\`\`text\n${error.message || error}\n\`\`\`\nPlease verify your API key validity and network connectivity.`;
    onChunk(errText);
    if (onComplete) onComplete(errText);
    return errText;
  }
}
