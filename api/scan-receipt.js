import Anthropic from '@anthropic-ai/sdk';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const client = new Anthropic({ apiKey });

    // Extract base64 data and media type from data URL
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image format. Must be a base64 data URL.' });

    const mediaType = match[1];
    const base64Data = match[2];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
            {
              type: 'text',
              text: `You are a receipt/invoice data extractor. Analyze this image of a receipt or invoice and extract the following information. Return ONLY a valid JSON object with these fields:

{
  "title": "brief description of the purchase (e.g. 'Woolworths Groceries', 'Bunnings Supplies')",
  "amount": number (total amount as a number, e.g. 45.90),
  "date": "YYYY-MM-DD format if visible, otherwise null",
  "supplier": "store/vendor name",
  "category": "one of: office-supplies, utilities, rent, maintenance, medical-supplies, food-grocery, transport, training, insurance, equipment, subscriptions, cleaning, IT, uniforms, general, other",
  "payment_method": "one of: card, cash, bank-transfer, petty-cash (infer from receipt if possible, default to card)",
  "receipt_ref": "receipt/invoice number if visible, otherwise empty string",
  "description": "brief list of key items if visible (max 100 chars), otherwise empty string"
}

Rules:
- For groceries/supermarkets, use category "food-grocery"
- For hardware stores, use "maintenance" or "equipment"
- For medical/pharmacy, use "medical-supplies"
- For fuel/transport, use "transport"
- Amount must be a number, not a string
- If you cannot read the receipt clearly, still try your best guess
- Return ONLY the JSON, no other text`,
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.text || '';
    // Parse JSON from response, handling potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'Could not extract data from receipt' });

    const extracted = JSON.parse(jsonMatch[0]);
    return res.status(200).json(extracted);
  } catch (err) {
    console.error('Receipt scan error:', err);
    return res.status(500).json({ error: err.message || 'Failed to scan receipt' });
  }
}
