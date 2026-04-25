import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_GEMINI_API_KEY });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key is not configured' }, { status: 500 });
    }

    // 1. Fetch Google Street View image
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&fov=90&heading=235&pitch=10&key=${apiKey}`;
    const imageResponse = await fetch(streetViewUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch street view image');
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // 2. Analyze image with Gemini
    const prompt = `
      Analyze this street view image and provide a JSON response with the following boolean fields indicating if they are present in the image:
      - sunset (노을)
      - mountain (산)
      - flower (꽃)
      - river (강)
      - sea (바다)
      - stream (하천)
      Also provide a "totalScore" from 0 to 100 representing how relaxing and peaceful the scenery is.
      
      Respond ONLY with valid JSON in this exact format:
      {
        "sunset": boolean,
        "mountain": boolean,
        "flower": boolean,
        "river": boolean,
        "sea": boolean,
        "stream": boolean,
        "totalScore": number
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    const result = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Scenery API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze scenery', details: error.message },
      { status: 500 }
    );
  }
}
