// --- GEMINI API HELPER ---
export const generateGeminiContent = async (
  prompt: string,
  systemInstruction: string = ''
): Promise<string> => {
  const apiKey = ''; // Runtime environment provides this
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis unavailable.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'Unable to connect to AI service. Please try again.';
  }
};
