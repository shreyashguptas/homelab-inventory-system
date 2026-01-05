import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, isAIConfigured } from '@/lib/services/groq';

export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI features not configured. Please add GROQ_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/m4a',
    ];

    if (!validTypes.includes(audioFile.type) && !audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid audio file type. Supported: webm, mp4, mp3, wav, ogg, flac' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe the audio
    const text = await transcribeAudio(buffer, audioFile.type);

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Transcription error:', error);
    const message = error instanceof Error ? error.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
