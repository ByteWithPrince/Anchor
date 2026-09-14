import { get, set } from 'idb-keyval';
import { foodService } from './foodService';

// Local high-speed lookup table for 50 common fitness foods (values per 100g / standard serving)
const LOCAL_FOOD_DB = {
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, defaultUnit: 'g', baseWeight: 100 },
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, defaultUnit: 'g', baseWeight: 100 },
  'egg': { calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, defaultUnit: 'piece', baseWeight: 50 },
  'eggs': { calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, defaultUnit: 'piece', baseWeight: 50 },
  'egg white': { calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, defaultUnit: 'piece', baseWeight: 33 },
  'egg whites': { calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, defaultUnit: 'piece', baseWeight: 33 },
  'whey protein': { calories: 120, protein: 24, carbs: 3, fat: 1.5, defaultUnit: 'scoop', baseWeight: 30 },
  'protein powder': { calories: 120, protein: 24, carbs: 3, fat: 1.5, defaultUnit: 'scoop', baseWeight: 30 },
  'oats': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, defaultUnit: 'g', baseWeight: 100 },
  'oatmeal': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, defaultUnit: 'g', baseWeight: 100 },
  'white rice': { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, defaultUnit: 'g', baseWeight: 100 },
  'brown rice': { calories: 111, protein: 2.6, carbs: 23, fat: 0.9, defaultUnit: 'g', baseWeight: 100 },
  'rice': { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, defaultUnit: 'g', baseWeight: 100 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, defaultUnit: 'g', baseWeight: 100 },
  'tuna': { calories: 132, protein: 28, carbs: 0, fat: 1, defaultUnit: 'g', baseWeight: 100 },
  'ground beef': { calories: 250, protein: 26, carbs: 0, fat: 17, defaultUnit: 'g', baseWeight: 100 },
  'beef': { calories: 250, protein: 26, carbs: 0, fat: 17, defaultUnit: 'g', baseWeight: 100 },
  'steak': { calories: 271, protein: 25, carbs: 0, fat: 19, defaultUnit: 'g', baseWeight: 100 },
  'greek yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, defaultUnit: 'g', baseWeight: 100 },
  'cottage cheese': { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, defaultUnit: 'g', baseWeight: 100 },
  'banana': { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, defaultUnit: 'piece', baseWeight: 118 },
  'apple': { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, defaultUnit: 'piece', baseWeight: 182 },
  'peanut butter': { calories: 588, protein: 25, carbs: 20, fat: 50, defaultUnit: 'tbsp', baseWeight: 16 },
  'milk': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, defaultUnit: 'ml', baseWeight: 100 },
  'bread': { calories: 75, protein: 2.5, carbs: 14, fat: 1, defaultUnit: 'slice', baseWeight: 30 },
  'toast': { calories: 75, protein: 2.5, carbs: 14, fat: 1, defaultUnit: 'slice', baseWeight: 30 },
  'sweet potato': { calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, defaultUnit: 'g', baseWeight: 100 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, defaultUnit: 'g', baseWeight: 100 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, defaultUnit: 'g', baseWeight: 100 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, defaultUnit: 'g', baseWeight: 100 },
  'avocado': { calories: 160, protein: 2, carbs: 8.5, fat: 14.7, defaultUnit: 'piece', baseWeight: 150 },
  'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, defaultUnit: 'tbsp', baseWeight: 14 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, defaultUnit: 'tbsp', baseWeight: 14 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, defaultUnit: 'g', baseWeight: 100 },
  'bagel': { calories: 250, protein: 10, carbs: 48, fat: 1.5, defaultUnit: 'piece', baseWeight: 100 },
  'turkey breast': { calories: 135, protein: 30, carbs: 0, fat: 1, defaultUnit: 'g', baseWeight: 100 },
  'shrimp': { calories: 99, protein: 24, carbs: 0.2, fat: 0.3, defaultUnit: 'g', baseWeight: 100 },
  'tofu': { calories: 76, protein: 8, carbs: 1.9, fat: 4.8, defaultUnit: 'g', baseWeight: 100 },
  'black beans': { calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, defaultUnit: 'g', baseWeight: 100 },
  'lentils': { calories: 116, protein: 9, carbs: 20, fat: 0.4, defaultUnit: 'g', baseWeight: 100 },
  'cheddar cheese': { calories: 403, protein: 25, carbs: 1.3, fat: 33, defaultUnit: 'g', baseWeight: 100 },
  'cheese': { calories: 403, protein: 25, carbs: 1.3, fat: 33, defaultUnit: 'g', baseWeight: 100 },
  'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, defaultUnit: 'g', baseWeight: 100 },
  'walnuts': { calories: 654, protein: 15, carbs: 14, fat: 65, defaultUnit: 'g', baseWeight: 100 },
  'honey': { calories: 304, protein: 0.3, carbs: 82, fat: 0, defaultUnit: 'tbsp', baseWeight: 21 },
  'blueberries': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, defaultUnit: 'g', baseWeight: 100 },
  'strawberries': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, defaultUnit: 'g', baseWeight: 100 }
};

/**
 * 3-Layer Food Parsing Service
 */
export const aiService = {
  /**
   * Layer 1: Instant local parsing via regex + local lookup table (<5ms)
   */
  parseLocal: (input) => {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim().toLowerCase();

    // Check if input directly matches or contains a quantity + food name
    const match = clean.match(/^([\d.]+)?\s*(g|grams|ml|oz|lb|cups?|serving|portions?|pieces?|slices?|scoops?|tbsp)?\s+(.*)$/i);
    let qty = 1;
    let unit = 'g';
    let foodKey = clean;

    if (match) {
      qty = match[1] ? parseFloat(match[1]) : 1;
      unit = match[2] ? match[2].toLowerCase() : 'g';
      foodKey = match[3] ? match[3].trim() : clean;
    }

    const item = LOCAL_FOOD_DB[foodKey];
    if (!item) return null;

    let multiplier = 1;
    if (['piece', 'pieces', 'slice', 'slices', 'scoop', 'scoops', 'tbsp'].includes(unit)) {
      multiplier = (qty * item.baseWeight) / 100;
    } else if (['oz'].includes(unit)) {
      multiplier = (qty * 28.35) / 100;
    } else if (['lb'].includes(unit)) {
      multiplier = (qty * 453.6) / 100;
    } else {
      multiplier = qty / 100;
    }

    return {
      name: foodKey.toUpperCase(),
      quantity: qty,
      unit: unit || item.defaultUnit,
      calories: Math.round(item.calories * multiplier),
      protein: Math.round(item.protein * multiplier * 10) / 10,
      carbs: Math.round(item.carbs * multiplier * 10) / 10,
      fat: Math.round(item.fat * multiplier * 10) / 10,
      source: 'local'
    };
  },

  /**
   * Layer 3: Gemini 2.0 Flash Natural Language Structured Parser (~400ms)
   */
  parseWithGemini: async (input) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    const cacheKey = `gemini_food_${input.toLowerCase().trim()}`;
    try {
      const cached = await get(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // cache read failed, proceed to API
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Parse the following food intake description into an array of food items with accurate macro estimates (conservative USDA standards).
Description: "${input}"`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              quantity: { type: 'NUMBER' },
              unit: { type: 'STRING' },
              calories: { type: 'NUMBER' },
              protein: { type: 'NUMBER' },
              carbs: { type: 'NUMBER' },
              fat: { type: 'NUMBER' }
            },
            required: ['name', 'calories', 'protein', 'carbs', 'fat']
          }
        }
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      const items = JSON.parse(text);
      if (Array.isArray(items) && items.length > 0) {
        const result = items.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'serving',
          calories: Math.round(Number(item.calories) || 0),
          protein: Math.round((Number(item.protein) || 0) * 10) / 10,
          carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
          fat: Math.round((Number(item.fat) || 0) * 10) / 10,
          source: 'ai'
        }));

        try {
          await set(cacheKey, result);
        } catch {
          // cache save failed, proceed
        }

        return result;
      }
    } catch (err) {
      console.warn('Gemini food parse failed:', err);
    }

    return null;
  },

  /**
   * Unified Pipeline:
   * 1. Try Local Table (<5ms)
   * 2. If compound or natural language (>2 words, contains "and", "with", etc.) -> Try Gemini
   * 3. Fall back to USDA Search
   */
  resolveFood: async (input) => {
    if (!input || !input.trim()) return [];

    // Check Layer 1: Local
    const localMatch = aiService.parseLocal(input);
    if (localMatch) {
      return [localMatch];
    }

    // Check if natural language
    const isNaturalLanguage = input.includes(' and ') || input.includes(' with ') || input.includes(',') || input.trim().split(/\s+/).length >= 3;
    if (isNaturalLanguage) {
      const aiItems = await aiService.parseWithGemini(input);
      if (aiItems && aiItems.length > 0) {
        return aiItems;
      }
    }

    // Fallback to Layer 2: USDA
    try {
      const usdaResults = await foodService.searchFoods(input);
      return usdaResults.map(item => ({
        ...item,
        source: 'usda'
      }));
    } catch (err) {
      console.warn('USDA search failed:', err);
      return [];
    }
  }
};
