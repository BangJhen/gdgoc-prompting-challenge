import { NextRequest, NextResponse } from 'next/server';
import Together from 'together-ai';

const together = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
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

        // Build a pixel-art focused prompt
        const pixelArtPrompt = `pixel art style, 16-bit retro game art, clean pixel art, ${prompt}, simple shapes, limited color palette, no anti-aliasing, crisp edges`;

        console.log('[generate-image] Generating image with prompt:', pixelArtPrompt);

        const response = await together.images.generate({
            model: 'black-forest-labs/FLUX.1-schnell-Free',
            prompt: pixelArtPrompt,
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
