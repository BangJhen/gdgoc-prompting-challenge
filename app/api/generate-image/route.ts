import { NextRequest, NextResponse } from 'next/server';
import Together from 'together-ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const together = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
});

const googleGenerativeAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
        }

        if (!process.env.TOGETHER_API_KEY) {
            return NextResponse.json({ success: false, error: 'TOGETHER_API_KEY is not configured' }, { status: 500 });
        }

        // Enhance the prompt using Gemini
        const model = googleGenerativeAI('gemini-2.5-flash');
        const enhancementPrompt = `You are an expert prompt engineer for pixel art generation. 
The user has provided a base prompt. Your job is to improve it and make it highly descriptive, translating it to English if it's in another language (like Indonesian). 
Ensure the prompt specifies it should be in a 16-bit retro game art style with a limited color palette. 
Keep it concise but highly descriptive of the visual elements. Do not include introductory text, just output the final prompt.

User's prompt: "${prompt}"`;

        const { text: enhancedPrompt } = await generateText({
            model,
            prompt: enhancementPrompt,
        });

        const finalPrompt = enhancedPrompt.trim();
        console.log('[generate-image] Original prompt:', prompt);
        console.log('[generate-image] Enhanced prompt:', finalPrompt);

        const response = await together.images.generate({
            model: 'Rundiffusion/Juggernaut-Lightning-Flux',
            prompt: finalPrompt,
            width: 512,
            height: 512,
            steps: 4,
            n: 1,
        });

        const imageData = response.data?.[0];

        if (!imageData) {
            throw new Error('No image data returned from Together AI');
        }

        // Together AI returns either b64_json or url
        if ('b64_json' in imageData && imageData.b64_json) {
            return NextResponse.json({
                success: true,
                imageBase64: imageData.b64_json,
                imageUrl: null,
            });
        } else if ('url' in imageData && imageData.url) {
            return NextResponse.json({
                success: true,
                imageBase64: null,
                imageUrl: imageData.url,
            });
        } else {
            throw new Error('Image response did not contain b64_json or url');
        }
    } catch (error: any) {
        console.error('[generate-image] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}
