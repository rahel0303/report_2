import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Get file mime type
    const mimeType = file.type;

    // Initialize Gemini model (use gemini-1.5-flash-latest for image analysis)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `Analyze this logo image and provide design recommendations for a PowerPoint cover slide. 

IMPORTANT: Extract the EXACT dominant colors from the logo. Use the actual hex color codes you see in the image, not generic approximations.

Return your response in the following JSON format:

{
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "colorPalette": {
    "primary": "#exact_hex_from_logo",
    "secondary": "#exact_hex_from_logo",
    "accent": "#exact_hex_from_logo"
  },
  "mood": "professional/modern/creative/elegant/bold",
  "industry": "detected industry or business type",
  "recommendedTemplates": [1, 2, 3],
  "designSuggestions": {
    "patternStyle": "geometric/waves/abstract/gradient/modern",
    "complexity": "minimal/moderate/complex",
    "contrast": "high/medium/low"
  }
}

Color Extraction Guidelines:
- primary: The MAIN/most prominent color in the logo
- secondary: The second most used color
- accent: A complementary or highlight color
- All colors MUST be in hex format with # (e.g., #FF5733)
- Extract actual colors from the image, not generic colors

Available templates:
1. Geometric Patterns - Modern geometric shapes with bold colors
2. Fluid Waves - Smooth flowing waves with gradients
3. Abstract Shapes - Creative abstract elements with dynamic composition
4. Minimal Gradient - Clean gradients with subtle patterns
5. Modern Grid - Contemporary grid-based design with depth

Analyze the logo's colors, style, and recommend which 3 templates (by number) would work best.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      jsonMatch = text.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', rawResponse: text },
        { status: 500 },
      );
    }

    const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
      logoData: `data:${mimeType};base64,${base64}`,
    });
  } catch (error: any) {
    console.error('Error analyzing logo:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze logo' }, { status: 500 });
  }
}
