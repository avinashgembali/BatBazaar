const SORT_OPTIONS = ['none', 'low-high', 'high-low'];
const GEMINI_MODEL = 'gemini-3.1-flash-lite';

const geminiFetch = (prompt, temperature = 0) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: 2000 },
      }),
    }
  );
};

const extractJSON = (rawText) => {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in response: ${rawText}`);
  return JSON.parse(match[0]);
};

const sanitizeFilters = (parsed, availableBrands, dataMin, dataMax) => {
  const brands = Array.isArray(parsed.brands)
    ? parsed.brands.filter(b => availableBrands.includes(b))
    : [];
  const rawMin = Number(parsed.priceRange?.[0]);
  const rawMax = Number(parsed.priceRange?.[1]);
  const pMin = isNaN(rawMin) ? dataMin : Math.max(dataMin, Math.min(rawMin, dataMax));
  const pMax = isNaN(rawMax) ? dataMax : Math.max(dataMin, Math.min(rawMax, dataMax));
  return {
    brands,
    priceRange: [Math.min(pMin, pMax), Math.max(pMin, pMax)],
    minRating: Math.max(0, Math.min(5, Number(parsed.minRating) || 0)),
    sort: SORT_OPTIONS.includes(parsed.sort) ? parsed.sort : 'none',
  };
};

/* ── Used by the floating chatbot ── */
export const getBotResponse = async (userMessage, bats, availableBrands, dataRange) => {
  const dataMin = dataRange[0];
  const dataMax = Math.min(dataRange[1], 30000);

  const catalog = bats
    .slice(0, 30)
    .map(b => `${b.name.toUpperCase()} ${b.type} — ₹${b.price.toLocaleString()} — ★${b.rating}`)
    .join('\n');

  const prompt = `You are BatBot, a friendly AI assistant for BatBazaar cricket bat shop.

Catalog:
${catalog}

Brands available: ${availableBrands.join(', ')}
Price range: ₹${dataMin} – ₹${dataMax}

User: "${userMessage}"

Instructions:
- Reply in 2–4 friendly, helpful sentences as a cricket expert.
- If the user wants to search, filter, or discover bats, set "applyFilters": true.
- For comparisons or general playing-style advice with no clear filter intent, set "applyFilters": false.

STRICT filter rules (read carefully):
- "sort": controls PRICE order ONLY.
    "low-high"  → cheapest first (use for: cheap, budget, affordable, low price, low to high)
    "high-low"  → most expensive first (use for: expensive, premium, high price, high to low)
    "none"      → no price sort (DEFAULT — use this unless the user explicitly mentions price order)
- "minRating": minimum star rating (0 = any). Use for quality/rating queries.
    Set minRating to 4.0 for: "top rated", "best rated", "highly rated", "good quality", "best bats"
    Set minRating to 4.5 for: "excellent", "top quality", "5 star", "best of best"
    NEVER use sort:"high-low" to mean "best quality" — use minRating instead.
- "priceRange": [min, max] within [${dataMin}, ${dataMax}]
- "brands": array from [${availableBrands.join(', ')}], or [] for all

Examples:
- "top rated bats"            → applyFilters:true, minRating:4.0, sort:"none"
- "best bats"                 → applyFilters:true, minRating:4.0, sort:"none"
- "cheap bats"                → applyFilters:true, minRating:0,   sort:"low-high"
- "premium bats"              → applyFilters:true, minRating:0,   sort:"high-low"
- "best bats under 10000"     → applyFilters:true, minRating:4.0, priceRange:[${dataMin},10000], sort:"none"
- "lightweight bat"           → applyFilters:false (no matching filter — answer conversationally)
- "compare MRF vs SS"         → applyFilters:false

Return ONLY this JSON (no markdown):
{
  "message": "your reply here",
  "applyFilters": true,
  "brands": [],
  "priceRange": [${dataMin}, ${dataMax}],
  "minRating": 0,
  "sort": "none"
}`;

  const response = await geminiFetch(prompt, 0.65);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  const parsed = extractJSON(rawText);

  const result = {
    message: parsed.message || "I'm not sure how to help with that. Try asking about a bat type or budget!",
    applyFilters: !!parsed.applyFilters,
  };

  if (result.applyFilters) {
    Object.assign(result, sanitizeFilters(parsed, availableBrands, dataMin, dataMax));
  }

  return result;
};
