import { GoogleGenerativeAI } from '@google/generative-ai';

// --- GEMINI API HELPER ---
export const generateGeminiContent = async (
  prompt: string,
  systemInstruction: string = '',
  model: string = 'gemini-2.5-flash',
): Promise<string> => {
  // Try to get API key from environment or localStorage
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null);

  if (!apiKey || apiKey === '') {
    return 'API key not configured. Please add your Gemini API key.';
  }

  try {
    // Initialize GoogleGenerativeAI with API key
    const genAI = new GoogleGenerativeAI(apiKey);

    // Combine systemInstruction with prompt
    const fullPrompt = systemInstruction
      ? `${systemInstruction}\n\nUser request: ${prompt}`
      : prompt;

    // Generate content using the SDK
    const generativeModel = genAI.getGenerativeModel({ model });
    const result = await generativeModel.generateContent(fullPrompt);
    const response = await result.response;

    return response.text() || 'Analysis unavailable.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    return `Unable to connect to AI service: ${error instanceof Error ? error.message : 'Please try again.'}`;
  }
};
