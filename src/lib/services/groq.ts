import type { ExtractedFormData, AIContext, ExtractionValidation } from '@/lib/types/ai';
import { REQUIRED_EXTRACTION_FIELDS } from '@/lib/types/ai';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

// Vision-capable model for extraction with image support
const EXTRACTION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const EXTRACTION_SYSTEM_PROMPT = `You are an inventory data extraction assistant for a homelab inventory management system.
Given a voice transcription and/or images describing an item, extract structured data to fill out an inventory form.

IMPORTANT IMAGE ANALYSIS RULES:
1. If images are provided, PRIORITIZE extracting the item name from visible text/labels in the image
2. Look for product names, model numbers, part numbers, brand names on packaging or labels
3. Extract any visible prices, specifications, or technical details from the image
4. If the image shows a product page/screenshot, extract: title, price, seller/vendor, URL if visible
5. Cross-reference what you see in images with what the user said in the transcription
6. Generate tags based on what you can identify in the image (brand, category, color, size, etc.)
7. If the image shows a receipt or order confirmation, extract price, vendor, and date

GENERAL EXTRACTION RULES:
1. For category_id and vendor_id, ONLY use IDs from the provided lists if there's a confident match
2. If a category is mentioned but doesn't match existing ones closely, leave category_id empty and put the suggested name in category_name_suggestion
3. If a vendor is mentioned but doesn't match existing ones closely, leave vendor_id empty and put the suggested name in vendor_name_suggestion
4. For tracking_mode: use "individual" for unique items (electronics, devices, tools with serial numbers) and "quantity" for consumables, bulk items, or multiples
5. Extract specifications as key-value pairs from any technical details mentioned or visible (e.g., "RAM": "8GB", "Voltage": "5V")
6. Generate relevant tags as lowercase strings (e.g., ["raspberry-pi", "sbc", "arm", "amazon"])
7. For condition: use "new" if explicitly stated as new/unopened, "working" as default for used items
8. If quantity is mentioned (like "I have 5 of these"), extract it. Default to 1 if not mentioned.
9. Extract purchase_price if a price/cost is mentioned or visible (just the number, determine currency from context)
10. For dates, use ISO format YYYY-MM-DD if mentioned
11. ALWAYS try to extract: name, quantity, purchase_price, and purchase_url - these are important fields

The form has these fields:
- name (required): The primary name/title of the item
- description: A brief description
- tracking_mode: "quantity" or "individual"
- quantity: Number of items (for quantity mode) - IMPORTANT: always try to extract this
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
- tags: Array of relevant tags - IMPORTANT: always generate relevant tags
- purchase_price: Cost as a number - IMPORTANT: always try to extract this
- purchase_currency: "USD", "EUR", "GBP", "INR", "CAD", "AUD"
- purchase_url: Where to buy - IMPORTANT: extract if visible in screenshots
- datasheet_url: Link to documentation
- notes: Additional notes

Respond with a valid JSON object containing the extracted fields. Be thorough - extract as much information as possible from both the transcription and images.`;

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

  // Build the text content for the user message
  const textContent = `Voice transcription: "${text}"

Existing categories to match against:
${JSON.stringify(context.categories, null, 2)}

Existing vendors to match against:
${JSON.stringify(context.vendors, null, 2)}

${context.existingTags && context.existingTags.length > 0 ? `Existing tags in the system (use these if relevant, or suggest new ones):
${JSON.stringify(context.existingTags)}` : ''}

Please analyze ${images.length > 0 ? 'the attached image(s) and ' : ''}the transcription to extract item information. Return a JSON object with the extracted fields.`;

  // Build multimodal content array for vision model
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userContent: any[] = [
    { type: 'text', text: textContent },
  ];

  // Add images in the format required by the vision API
  for (const base64Image of images) {
    // Determine image type from base64 header or default to jpeg
    let mimeType = 'image/jpeg';
    if (base64Image.startsWith('/9j/')) {
      mimeType = 'image/jpeg';
    } else if (base64Image.startsWith('iVBORw')) {
      mimeType = 'image/png';
    } else if (base64Image.startsWith('UklGR')) {
      mimeType = 'image/webp';
    }

    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${base64Image}`,
      },
    });
  }

  const messages = [
    {
      role: 'system',
      content: EXTRACTION_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: userContent,
    },
  ];

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
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

/**
 * Validates extracted form data and returns information about missing required fields
 */
export function validateExtraction(data: ExtractedFormData): ExtractionValidation {
  const missingRequired: string[] = [];
  const fieldLabels: Record<string, string> = {
    name: 'Item Name',
    quantity: 'Quantity',
    purchase_price: 'Purchase Price',
    purchase_url: 'Purchase URL',
  };

  for (const field of REQUIRED_EXTRACTION_FIELDS) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingRequired.push(field);
    }
  }

  return {
    missingRequired,
    missingLabels: missingRequired.map(f => fieldLabels[f] || f),
    isComplete: missingRequired.length === 0,
  };
}
