import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

const googleGenerativeAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const originalImage = formData.get('original') as File;
    const generatedImage = formData.get('generated') as File | null;
    const generatedImageUrl = formData.get('generatedUrl') as string | null;
    const username = formData.get('username') as string | null;
    const cardId = formData.get('cardId') as string | null;

    if (!originalImage || (!generatedImage && !generatedImageUrl)) {
      return NextResponse.json(
        { error: 'Both original and generated images are required' },
        { status: 400 }
      );
    }

    // Convert original image to base64
    const originalBuffer = await originalImage.arrayBuffer();
    const originalBase64 = Buffer.from(originalBuffer).toString('base64');
    
    // Handle generated image (could be File, data URL, or external URL)
    let generatedBase64 = '';
    let generatedImageType = 'image/png';

    if (generatedImage) {
      const generatedBuffer = await generatedImage.arrayBuffer();
      generatedBase64 = Buffer.from(generatedBuffer).toString('base64');
      generatedImageType = generatedImage.type;
    } else if (generatedImageUrl) {
      if (generatedImageUrl.startsWith('data:')) {
        const parts = generatedImageUrl.split(',');
        generatedBase64 = parts[1];
        generatedImageType = parts[0].split(':')[1].split(';')[0];
      } else {
        const response = await fetch(generatedImageUrl);
        if (!response.ok) throw new Error('Failed to fetch generated image from URL');
        const arrayBuffer = await response.arrayBuffer();
        generatedBase64 = Buffer.from(arrayBuffer).toString('base64');
        generatedImageType = response.headers.get('content-type') || 'image/png';
      }
    }

    // Use Gemini to analyze similarity
    const model = googleGenerativeAI('gemini-2.5-flash');

    const prompt = `Compare these two images and provide a similarity score from 0 to 100, where:
- 100 means the images are identical or nearly identical
- 0 means the images are completely different
- Consider visual similarity, composition, colors, content, and overall appearance

Please analyze both images carefully and provide only a numerical score between 0 and 100 as your response. Do not include any additional text or explanation.`;

    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: `data:${originalImage.type};base64,${originalBase64}`,
            },
            {
              type: 'image',
              image: `data:${generatedImageType};base64,${generatedBase64}`,
            },
          ],
        },
      ],
    });

    // Extract the score from the response
    const responseText = result.text.trim();
    const scoreMatch = responseText.match(/\b(\d{1,3})\b/);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 0;

    // Save the submission locally if username is provided
    let savedImagePath = null;
    if (username && generatedBase64) {
      try {
        const submissionsDir = path.join(process.cwd(), 'public', 'submissions');
        if (!fs.existsSync(submissionsDir)) {
          fs.mkdirSync(submissionsDir, { recursive: true });
        }
        
        // Clean username for safe filename
        const safeUsername = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = new Date().getTime(); // Unix timestamp
        const filename = `${safeUsername}_card${cardId || 'unknown'}_score${score}_${timestamp}.png`;
        const filePath = path.join(submissionsDir, filename);
        
        fs.writeFileSync(filePath, Buffer.from(generatedBase64, 'base64'));
        savedImagePath = `/submissions/${filename}`;
        console.log(`Saved submission to ${filePath}`);
      } catch (saveError) {
        console.error('Error saving submission image:', saveError);
      }
    }

    return NextResponse.json({
      score,
      originalImageType: originalImage.type,
      generatedImageType: generatedImageType,
      savedImagePath,
    });

  } catch (error) {
    console.error('Error analyzing image similarity:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image similarity' },
      { status: 500 }
    );
  }
}
