import { NextRequest, NextResponse } from 'next/server';
import { extractFormData, isAIConfigured } from '@/lib/services/groq';
import { z } from 'zod';

const ExtractionRequestSchema = z.object({
  text: z.string().min(1, 'Transcription text is required'),
  images: z.array(z.string()).default([]),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).default([]),
  vendors: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).default([]),
  existingTags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI features not configured. Please add GROQ_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = ExtractionRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { text, images, categories, vendors, existingTags } = validation.data;

    // Extract form data using AI
    const formData = await extractFormData(text, images, { categories, vendors, existingTags });

    return NextResponse.json(formData);
  } catch (error) {
    console.error('Extraction error:', error);
    const message = error instanceof Error ? error.message : 'Extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
