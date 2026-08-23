const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * POST /api/nlp/parse
 * Body: { text: string, lang?: string }
 * Returns structured intent: { action, itemName, quantity, unit }
 */
exports.parseIntent = async (req, res, next) => {
  try {
    const { text, lang = 'en-IN' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'text field is required for NLP parsing',
      });
    }

    const client = getGroqClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'GROQ_API_KEY is not configured on the server',
      });
    }

    const systemPrompt = `You are an expert NLP parser for a smart grocery shopping list voice assistant called ListEase.
Your task is to analyze user voice transcripts in English, Hindi, or Hinglish, and extract the intent and entities into structured JSON.

Supported actions:
- "add": User wants to add, buy, need, or get an item (e.g. "add 2 kg apples", "mujhe doodh chahiye", "buy 3 bottles of water", "tamatar le aao")
- "remove": User wants to remove, delete, drop, or cross off an item (e.g. "remove milk", "eggs hata do", "delete bread from my list")
- "search": User wants to find, look up, or search catalog items (e.g. "find olive oil", "spinach kahan hai", "show me dairy products")
- "unknown": No clear action verb or ambiguous intent (e.g. just saying "apples", "milk")

Output MUST be a strict JSON object with this exact schema:
{
  "action": "add" | "remove" | "search" | "unknown",
  "itemName": "clean singular/common item name without noise words (e.g. apple, milk, tomato, sparkling water)",
  "quantity": number (integer or float >= 1, default is 1),
  "unit": "standard unit like kg, g, l, ml, dozen, bottle, packet, pcs, or empty string ''",
  "originalText": "the input text"
}

Ensure item names in Hindi/Hinglish are translated/normalized to standard grocery names if possible (e.g. "doodh" -> "milk", "aalu" -> "potato", "pyaaz" -> "onion", "tamatar" -> "tomato").`;

    const completion = await client.chat.completions.create({
      model: 'groq/compound-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Language context: ${lang}. Parse this grocery voice command: "${text.trim()}"` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '';
    // Strip markdown code blocks if returned
    const cleaned = content.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse Groq response',
      });
    }

    const action = ['add', 'remove', 'search', 'unknown'].includes(parsed.action) ? parsed.action : 'add';
    const itemName = typeof parsed.itemName === 'string' ? parsed.itemName.trim().toLowerCase() : '';
    const quantity = typeof parsed.quantity === 'number' && parsed.quantity > 0 ? parsed.quantity : 1;
    const unit = typeof parsed.unit === 'string' ? parsed.unit.trim().toLowerCase() : '';

    return res.json({
      success: true,
      provider: 'groq-ai',
      intent: {
        action,
        itemName,
        quantity,
        unit,
      },
    });
  } catch (err) {
    console.error('Groq NLP parsing error:', err.message);
    next(err);
  }
};
