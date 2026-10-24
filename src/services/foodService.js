const USDA_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USDA_API_KEY) || 'DEMO_KEY';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export const foodService = {
  /**
   * Parses user input to extract quantity, unit, and food query.
   * e.g., "200g chicken" -> { quantity: 200, unit: 'g', query: 'chicken' }
   */
  parseFoodInput: (input) => {
    const match = input.match(/^([\d.]+)\s*(g|grams|ml|oz|lb|cups?|serving|portions?|pieces?)?\s+(.*)$/i);
    if (match) {
      return { 
        quantity: Number(match[1]), 
        unit: match[2] ? match[2].toLowerCase() : 'g', 
        query: match[3].trim() 
      };
    }
    return { quantity: 100, unit: 'g', query: input.trim() };
  },

  /**
   * Searches FoodData Central prioritizing Foundation and SR Legacy whole foods
   * and extracts nutrients via both nutrientId and nutrientNumber.
   */
  searchFoods: async (query) => {
    if (!query) return [];
    
    try {
      const response = await fetch(
        `${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=20&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS),Branded`
      );
      if (!response.ok) throw new Error(`USDA API Request Failed with status ${response.status}`);
      
      const data = await response.json();
      if (!data?.foods || !Array.isArray(data.foods)) return [];

      // Prioritize Foundation & SR Legacy whole foods ahead of branded items
      const sortedFoods = [...data.foods].sort((a, b) => {
        const getScore = (f) => {
          const dt = (f.dataType || '').toLowerCase();
          if (dt.includes('foundation')) return 3;
          if (dt.includes('sr legacy') || dt.includes('legacy')) return 2;
          if (dt.includes('survey') || dt.includes('fndds')) return 1;
          return 0;
        };
        return getScore(b) - getScore(a);
      });

      const extracted = sortedFoods.map(food => {
        const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];

        const findNutrient = (targetId, targetNums, keywords = []) => {
          const nut = nutrients.find(n => {
            if (n.nutrientId === targetId) return true;
            if (n.nutrientNumber && targetNums.includes(String(n.nutrientNumber).trim())) return true;
            if (keywords.length > 0 && n.nutrientName) {
              const nameLower = n.nutrientName.toLowerCase();
              return keywords.some(kw => nameLower.includes(kw));
            }
            return false;
          });
          return nut ? Math.round((Number(nut.value) || 0) * 10) / 10 : 0;
        };

        let calories = findNutrient(1008, ['208', '268'], ['energy']);
        const protein = findNutrient(1003, ['203'], ['protein']);
        const carbs = findNutrient(1005, ['205'], ['carbohydrate']);
        const fat = findNutrient(1004, ['204'], ['total lipid', 'fat']);

        // Calculate Atwater calories if USDA record is missing or zero energy
        if (!calories || calories === 0 || isNaN(calories)) {
          calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
        }

        return {
          id: food.fdcId,
          name: food.description,
          provider: 'USDA',
          dataType: food.dataType,
          calories: Math.round(calories),
          protein,
          carbs,
          fat,
          caloriesPer100g: Math.round(calories),
          proteinPer100g: protein,
          carbsPer100g: carbs,
          fatPer100g: fat
        };
      });

      // Filter out broken database entries where calories and all macros are 0
      const validFoods = extracted.filter(f => (
        f.calories > 0 && ((f.protein > 0) || (f.carbs > 0) || (f.fat > 0))
      ));

      return validFoods.slice(0, 5);
    } catch (err) {
      console.error("Food search error:", err);
      throw new Error("Unable to search foods. Please check your connection or try again later.");
    }
  },

  /**
   * Calculates the macro values for a given quantity and unit.
   */
  calculatePortion: (foodDefinition, quantity, unit) => {
    let multiplier = 1;
    switch(unit) {
      case 'g':
      case 'grams':
      case 'ml':
        multiplier = quantity / 100;
        break;
      case 'oz':
        multiplier = (quantity * 28.3495) / 100;
        break;
      case 'lb':
        multiplier = (quantity * 453.592) / 100;
        break;
      default:
        multiplier = quantity / 100; 
        break;
    }

    const roundVal = (v) => Math.round(v * 10) / 10;

    return {
      calories: Math.round(foodDefinition.caloriesPer100g * multiplier),
      protein: roundVal(foodDefinition.proteinPer100g * multiplier),
      carbs: roundVal(foodDefinition.carbsPer100g * multiplier),
      fat: roundVal(foodDefinition.fatPer100g * multiplier)
    };
  }
};
