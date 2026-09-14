const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';
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
   * Searches FoodData Central for a food item and returns basic info + 100g nutrient values.
   */
  searchFoods: async (query) => {
    if (!query) return [];
    
    try {
      const response = await fetch(`${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5`);
      if (!response.ok) throw new Error('API Request Failed');
      
      const data = await response.json();
      
      return data.foods.map(food => {
        const getNutrient = (id) => {
          const nut = food.foodNutrients.find(n => n.nutrientId === id);
          return nut ? nut.value : 0;
        };

        return {
          id: food.fdcId,
          name: food.description,
          provider: 'USDA',
          caloriesPer100g: getNutrient(1008), // Energy kcal
          proteinPer100g: getNutrient(1003),
          carbsPer100g: getNutrient(1005),
          fatPer100g: getNutrient(1004)
        };
      });
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
        // For servings, pieces, cups, fallback to assuming 1 "unit" = 100g equivalent for MVP
        // (Without a complex density DB, volumetric conversions are impossible)
        multiplier = quantity / 100; 
        break;
    }

    return {
      calories: Math.round(foodDefinition.caloriesPer100g * multiplier),
      protein: Math.round(foodDefinition.proteinPer100g * multiplier),
      carbs: Math.round(foodDefinition.carbsPer100g * multiplier),
      fat: Math.round(foodDefinition.fatPer100g * multiplier)
    };
  }
};
