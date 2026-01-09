import type { ExtractedFormData, AIContext } from '@/lib/types/ai';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

const EXTRACTION_SYSTEM_PROMPT = `You are an inventory data extraction assistant for a homelab inventory management system.
Given a voice transcription describing an item, extract structured data to fill out an inventory form.

IMPORTANT RULES:
1. For category_id and vendor_id, ONLY use IDs from the provided lists if there's a confident match
2. If a category is mentioned but doesn't match existing ones closely, leave category_id empty and put the suggested name in category_name_suggestion
3. If a vendor is mentioned but doesn't match existing ones closely, leave vendor_id empty and put the suggested name in vendor_name_suggestion
4. Be conservative - only extract data you're confident about from the transcription
5. For tracking_mode: use "individual" for unique items (electronics, devices, tools with serial numbers) and "quantity" for consumables, bulk items, or multiples
6. Extract specifications as key-value pairs from any technical details mentioned (e.g., "RAM": "8GB", "Voltage": "5V")
7. Generate relevant tags as lowercase strings (e.g., ["raspberry-pi", "sbc", "arm"])
8. For condition: use "new" if explicitly stated as new/unopened, "working" as default for used items, or other values if damage/issues are mentioned
9. If quantity is mentioned (like "I have 5 of these"), extract it. Otherwise default to 1 for individual items
10. Extract purchase_price if a price/cost is mentioned (just the number, determine currency from context)
11. For dates, use ISO format YYYY-MM-DD if mentioned

The form has these fields:
- name (required): The primary name/title of the item
- description: A brief description
- tracking_mode: "quantity" or "individual"
- quantity: Number of items (for quantity mode)
- min_quantity: Low stock alert threshold
- unit: Unit of measure (pcs, meters, etc.)
- serial_number: For individual items
- asset_tag: Internal asset ID
- condition: "new", "working", "needs_repair", "broken", or "retired"
- purchase_date: When purchased (YYYY-MM-DD)
- warranty_expiry: Warranty end date (YYYY-MM-DD)
- location: Physical storage location
- category_id: UUID of existing category (or leave empty)
- category_name_suggestion: Suggested new category name
- vendor_id: UUID of existing vendor (or leave empty)
- vendor_name_suggestion: Suggested vendor/store name
- specifications: Object of technical specs {"key": "value"}
- tags: Array of relevant tags
- purchase_price: Cost as a number
- purchase_currency: "USD", "EUR", "GBP", "INR", "CAD", "AUD"
- purchase_url: Where to buy
- datasheet_url: Link to documentation
- notes: Additional notes

Respond with a valid JSON object containing only the fields you can confidently extract.`;

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  // Create a blob from the buffer for form data
  // Convert Buffer to Uint8Array for compatibility
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });

  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };
  const ext = extMap[mimeType] || 'webm';

  const formData = new FormData();
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');
  formData.append('language', 'en');

  const response = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Transcription error:', errorText);

    // Try to parse the Groq error response for a human-readable message
    let errorMessage = `Transcription failed (HTTP ${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
      // JSON parsing failed, use status-based fallback messages
    }

    // Map common HTTP status codes to user-friendly messages
    if (response.status === 401) {
      errorMessage = 'Invalid Groq API key. Please check your GROQ_API_KEY environment variable.';
    } else if (response.status === 429) {
      errorMessage = 'Groq API rate limit exceeded. Please wait a moment and try again.';
    } else if (response.status === 400) {
      errorMessage = errorMessage || 'Invalid audio format or request. Please try recording again.';
    } else if (response.status === 503) {
      errorMessage = 'Groq API is temporarily unavailable. Please try again later.';
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.text;
}

export async function extractFormData(
  text: string,
  images: string[],
  context: AIContext
): Promise<ExtractedFormData> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  // Build the messages for Groq compound model
  // Note: groq/compound-mini doesn't support images directly, so we only use text
  const messages = [
    {
      role: 'system',
      content: EXTRACTION_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `Voice transcription: "${text}"

Existing categories to match against:
${JSON.stringify(context.categories, null, 2)}

Existing vendors to match against:
${JSON.stringify(context.vendors, null, 2)}

${images.length > 0 ? `Note: ${images.length} image(s) were uploaded with this item and will be attached after form submission.` : ''}

Please extract the item information from the transcription and return a JSON object with the extracted fields.`,
    },
  ];

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'groq/compound-mini',
      messages,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Extraction error:', errorText);

    // Try to parse the Groq error response for a human-readable message
    let errorMessage = `Data extraction failed (HTTP ${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
      // JSON parsing failed, use status-based fallback messages
    }

    // Map common HTTP status codes to user-friendly messages
    if (response.status === 401) {
      errorMessage = 'Invalid Groq API key. Please check your GROQ_API_KEY environment variable.';
    } else if (response.status === 429) {
      errorMessage = 'Groq API rate limit exceeded. Please wait a moment and try again.';
    } else if (response.status === 503) {
      errorMessage = 'Groq API is temporarily unavailable. Please try again later.';
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in AI response');
  }

  try {
    return JSON.parse(content) as ExtractedFormData;
  } catch {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI response as JSON');
  }
}

export function isAIConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}
