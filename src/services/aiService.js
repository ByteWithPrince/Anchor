import { get, set } from 'idb-keyval';
import { foodService } from './foodService.js';

export const roundMacro = (val) => Math.round((Number(val) || 0) * 10) / 10;

/**
 * Atwater General Factor System:
 * 1g Protein = 4 kcal
 * 1g Carbohydrates = 4 kcal
 * 1g Fat = 9 kcal
 */
export const calculateAtwaterCalories = (protein, carbs, fat) => {
  const p = Math.max(0, Number(protein) || 0);
  const c = Math.max(0, Number(carbs) || 0);
  const f = Math.max(0, Number(fat) || 0);
  return Math.round((p * 4) + (c * 4) + (f * 9));
};

// Word-to-number mapping for natural language parsing (e.g. "two eggs", "half avocado")
const WORD_TO_NUM = {
  'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'half': 0.5, 'quarter': 0.25, 'double': 2, 'triple': 3, 'couple': 2, 'few': 3
};

/**
 * Comprehensive 60+ Whole Foods, Athletic Staples, Fast Food, and Indian/Global Culinary Database.
 * Exact base macros with default serving standards (unit vs 100g).
 */
export const LOCAL_FOOD_DB = {
  // --- COUNTABLE WHOLE FOODS & ATHLETIC STAPLES ---
  'egg': { displayName: 'Large Egg', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, baseWeight: 50 },
  'eggs': { displayName: 'Whole Eggs', isCountable: true, defaultUnit: 'whole', defaultQty: 2, baseQty: 1, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, baseWeight: 50 },
  'boiled egg': { displayName: 'Boiled Egg', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, baseWeight: 50 },
  'boiled eggs': { displayName: 'Boiled Eggs', isCountable: true, defaultUnit: 'whole', defaultQty: 2, baseQty: 1, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, baseWeight: 50 },
  'whole egg': { displayName: 'Whole Egg', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, baseWeight: 50 },
  'egg white': { displayName: 'Egg White', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, baseWeight: 33 },
  'egg whites': { displayName: 'Egg Whites', isCountable: true, defaultUnit: 'whole', defaultQty: 2, baseQty: 1, calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, baseWeight: 33 },
  'banana': { displayName: 'Medium Banana', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 105, protein: 1.3, carbs: 27, fat: 0.4, baseWeight: 118 },
  'bananas': { displayName: 'Medium Bananas', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 105, protein: 1.3, carbs: 27, fat: 0.4, baseWeight: 118 },
  'avocado': { displayName: 'Medium Avocado', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 240, protein: 3, carbs: 12, fat: 22, baseWeight: 150 },
  'avocados': { displayName: 'Medium Avocados', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 240, protein: 3, carbs: 12, fat: 22, baseWeight: 150 },
  'apple': { displayName: 'Medium Apple', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 95, protein: 0.5, carbs: 25, fat: 0.3, baseWeight: 182 },
  'apples': { displayName: 'Medium Apples', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 95, protein: 0.5, carbs: 25, fat: 0.3, baseWeight: 182 },
  'orange': { displayName: 'Orange', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2, baseWeight: 130 },
  'roti': { displayName: 'Whole Wheat Roti', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 104, protein: 3.1, carbs: 22, fat: 0.4, baseWeight: 40 },
  'rotis': { displayName: 'Whole Wheat Rotis', isCountable: true, defaultUnit: 'whole', defaultQty: 2, baseQty: 1, calories: 104, protein: 3.1, carbs: 22, fat: 0.4, baseWeight: 40 },
  'chapati': { displayName: 'Chapati', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 104, protein: 3.1, carbs: 22, fat: 0.4, baseWeight: 40 },
  'chapatis': { displayName: 'Chapatis', isCountable: true, defaultUnit: 'whole', defaultQty: 2, baseQty: 1, calories: 104, protein: 3.1, carbs: 22, fat: 0.4, baseWeight: 40 },
  'paratha': { displayName: 'Paratha', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 180, protein: 4, carbs: 25, fat: 7, baseWeight: 75 },
  'parathas': { displayName: 'Parathas', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 180, protein: 4, carbs: 25, fat: 7, baseWeight: 75 },
  'aloo paratha': { displayName: 'Aloo Paratha', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 290, protein: 6, carbs: 42, fat: 11, baseWeight: 110 },
  'paneer paratha': { displayName: 'Paneer Paratha', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 340, protein: 14, carbs: 36, fat: 16, baseWeight: 120 },
  'idli': { displayName: 'Idli', isCountable: true, defaultUnit: 'piece', defaultQty: 2, baseQty: 1, calories: 58, protein: 2, carbs: 12, fat: 0.2, baseWeight: 45 },
  'idlis': { displayName: 'Idlis', isCountable: true, defaultUnit: 'piece', defaultQty: 2, baseQty: 1, calories: 58, protein: 2, carbs: 12, fat: 0.2, baseWeight: 45 },
  'dosa': { displayName: 'Plain Dosa', isCountable: true, defaultUnit: 'medium', defaultQty: 1, baseQty: 1, calories: 133, protein: 3.2, carbs: 23, fat: 3, baseWeight: 100 },
  'masala dosa': { displayName: 'Masala Dosa', isCountable: true, defaultUnit: 'medium', defaultQty: 1, baseQty: 1, calories: 250, protein: 5, carbs: 36, fat: 9, baseWeight: 160 },
  'bread': { displayName: 'Bread Slice', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 79, protein: 2.7, carbs: 15, fat: 1, baseWeight: 30 },
  'toast': { displayName: 'Toast', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 79, protein: 2.7, carbs: 15, fat: 1, baseWeight: 30 },
  'brown bread': { displayName: 'Brown Bread', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 79, protein: 2.7, carbs: 15, fat: 1, baseWeight: 30 },
  'bagel': { displayName: 'Plain Bagel', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 250, protein: 10, carbs: 48, fat: 1.5, baseWeight: 100 },
  'whey': { displayName: 'Whey Protein (1 Scoop)', isCountable: true, defaultUnit: 'scoop', defaultQty: 1, baseQty: 1, calories: 120, protein: 24, carbs: 3, fat: 1.5, baseWeight: 30 },
  'whey protein': { displayName: 'Whey Protein', isCountable: true, defaultUnit: 'scoop', defaultQty: 1, baseQty: 1, calories: 120, protein: 24, carbs: 3, fat: 1.5, baseWeight: 30 },
  'protein shake': { displayName: 'Protein Shake', isCountable: true, defaultUnit: 'scoop', defaultQty: 1, baseQty: 1, calories: 120, protein: 24, carbs: 3, fat: 1.5, baseWeight: 30 },
  'protein powder': { displayName: 'Protein Powder', isCountable: true, defaultUnit: 'scoop', defaultQty: 1, baseQty: 1, calories: 120, protein: 24, carbs: 3, fat: 1.5, baseWeight: 30 },
  'scoop whey': { displayName: 'Whey Protein Scoop', isCountable: true, defaultUnit: 'scoop', defaultQty: 1, baseQty: 1, calories: 120, protein: 24, carbs: 3, fat: 1.5, baseWeight: 30 },
  'almond': { displayName: 'Almond', isCountable: true, defaultUnit: 'piece', defaultQty: 1, baseQty: 1, calories: 7, protein: 0.25, carbs: 0.25, fat: 0.6, baseWeight: 1.2 },
  'almonds': { displayName: 'Raw Almonds (10 pcs)', isCountable: true, defaultUnit: 'piece', defaultQty: 10, baseQty: 1, calories: 7, protein: 0.25, carbs: 0.25, fat: 0.6, baseWeight: 1.2 },
  'walnut': { displayName: 'Walnut', isCountable: true, defaultUnit: 'piece', defaultQty: 1, baseQty: 1, calories: 26, protein: 0.6, carbs: 0.6, fat: 2.6, baseWeight: 4 },
  'walnuts': { displayName: 'Walnuts (5 pcs)', isCountable: true, defaultUnit: 'piece', defaultQty: 5, baseQty: 1, calories: 26, protein: 0.6, carbs: 0.6, fat: 2.6, baseWeight: 4 },
  'peanut butter': { displayName: 'Peanut Butter (1 tbsp)', isCountable: false, defaultUnit: 'tbsp', defaultQty: 16, baseQty: 16, calories: 94, protein: 4, carbs: 3.2, fat: 8, baseWeight: 16 },
  'olive oil': { displayName: 'Olive Oil (1 tbsp)', isCountable: false, defaultUnit: 'tbsp', defaultQty: 14, baseQty: 14, calories: 124, protein: 0, carbs: 0, fat: 14, baseWeight: 14 },
  'butter': { displayName: 'Butter (1 tbsp)', isCountable: false, defaultUnit: 'tbsp', defaultQty: 14, baseQty: 14, calories: 100, protein: 0.1, carbs: 0, fat: 11.3, baseWeight: 14 },
  'ghee': { displayName: 'Desi Ghee (1 tbsp)', isCountable: false, defaultUnit: 'tbsp', defaultQty: 14, baseQty: 14, calories: 120, protein: 0, carbs: 0, fat: 13.5, baseWeight: 14 },
  'milk': { displayName: 'Whole Milk (1 Glass)', isCountable: false, defaultUnit: 'ml', defaultQty: 250, baseQty: 250, calories: 155, protein: 8, carbs: 12, fat: 8, baseWeight: 250 },

  // --- FAST FOOD, RESTAURANTS & BURGERS ---
  'maharaja mac': { displayName: 'Chicken Maharaja Mac Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 680, protein: 26, carbs: 62, fat: 36, baseWeight: 250 },
  'maharaja mac burger': { displayName: 'Maharaja Mac Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 680, protein: 26, carbs: 62, fat: 36, baseWeight: 250 },
  'chicken maharaja mac': { displayName: 'Chicken Maharaja Mac Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 680, protein: 26, carbs: 62, fat: 36, baseWeight: 250 },
  'veg maharaja mac': { displayName: 'Veg Maharaja Mac Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 610, protein: 17, carbs: 75, fat: 27, baseWeight: 240 },
  'mcspicy': { displayName: 'McSpicy Chicken Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 510, protein: 22, carbs: 48, fat: 26, baseWeight: 200 },
  'mcspicy chicken': { displayName: 'McSpicy Chicken Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 510, protein: 22, carbs: 48, fat: 26, baseWeight: 200 },
  'mcchicken': { displayName: 'McChicken Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 400, protein: 15, carbs: 40, fat: 20, baseWeight: 160 },
  'whopper': { displayName: 'BK Whopper Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 660, protein: 28, carbs: 49, fat: 40, baseWeight: 270 },
  'burger': { displayName: 'Classic Burger', isCountable: true, defaultUnit: 'burger', defaultQty: 1, baseQty: 1, calories: 450, protein: 20, carbs: 42, fat: 22, baseWeight: 200 },
  'pizza slice': { displayName: 'Pizza (1 Slice)', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 270, protein: 11, carbs: 32, fat: 10, baseWeight: 100 },
  'pizza': { displayName: 'Personal Pizza', isCountable: true, defaultUnit: 'whole', defaultQty: 1, baseQty: 1, calories: 800, protein: 34, carbs: 95, fat: 31, baseWeight: 300 },
  'samosa': { displayName: 'Samosa', isCountable: true, defaultUnit: 'piece', defaultQty: 1, baseQty: 1, calories: 260, protein: 4, carbs: 32, fat: 13, baseWeight: 90 },

  // --- NOODLES, PASTA & DESSERTS ---
  'maggi': { displayName: 'Maggi 2-Minute Noodles (1 Pack/Plate)', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 310, protein: 6, carbs: 44, fat: 12, baseWeight: 70 },
  'maggie': { displayName: 'Maggi Noodles (1 Pack/Plate)', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 310, protein: 6, carbs: 44, fat: 12, baseWeight: 70 },
  'plate maggi': { displayName: 'Plate of Maggi', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 310, protein: 6, carbs: 44, fat: 12, baseWeight: 70 },
  'plate maggie': { displayName: 'Plate of Maggi', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 310, protein: 6, carbs: 44, fat: 12, baseWeight: 70 },
  'chowmein': { displayName: 'Veg Chowmein (1 Plate)', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 350, protein: 8, carbs: 52, fat: 12, baseWeight: 250 },
  'ramen': { displayName: 'Ramen Noodles (1 Bowl)', isCountable: true, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 380, protein: 8, carbs: 54, fat: 14, baseWeight: 300 },
  'lotus biscoff cake': { displayName: 'Lotus Biscoff Cake (1 Slice)', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 440, protein: 5, carbs: 58, fat: 21, baseWeight: 120 },
  'biscoff cake': { displayName: 'Lotus Biscoff Cake (1 Slice)', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 440, protein: 5, carbs: 58, fat: 21, baseWeight: 120 },
  'lotus biscoff': { displayName: 'Lotus Biscoff Cheesecake/Cake', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 440, protein: 5, carbs: 58, fat: 21, baseWeight: 120 },
  'cheesecake': { displayName: 'NY Cheesecake (1 Slice)', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 400, protein: 7, carbs: 32, fat: 28, baseWeight: 125 },
  'chocolate cake': { displayName: 'Chocolate Cake (1 Slice)', isCountable: true, defaultUnit: 'slice', defaultQty: 1, baseQty: 1, calories: 380, protein: 5, carbs: 52, fat: 17, baseWeight: 100 },
  'brownie': { displayName: 'Fudge Brownie', isCountable: true, defaultUnit: 'piece', defaultQty: 1, baseQty: 1, calories: 250, protein: 3, carbs: 34, fat: 12, baseWeight: 60 },
  'pastry': { displayName: 'Pastry', isCountable: true, defaultUnit: 'piece', defaultQty: 1, baseQty: 1, calories: 310, protein: 4, carbs: 40, fat: 15, baseWeight: 90 },
  'ice cream': { displayName: 'Ice Cream (1 Scoop)', isCountable: true, defaultUnit: 'scoop', defaultQty: 1, baseQty: 1, calories: 160, protein: 3, carbs: 18, fat: 9, baseWeight: 75 },
  'cookie': { displayName: 'Chocolate Chip Cookie', isCountable: true, defaultUnit: 'piece', defaultQty: 1, baseQty: 1, calories: 145, protein: 1.8, carbs: 20, fat: 6.7, baseWeight: 30 },
  'gulab jamun': { displayName: 'Gulab Jamun (2 pcs)', isCountable: true, defaultUnit: 'serving', defaultQty: 1, baseQty: 1, calories: 300, protein: 4, carbs: 50, fat: 10, baseWeight: 80 },

  // --- INDIAN MEALS & CURRIES ---
  'biryani': { displayName: 'Chicken Dum Biryani (1 Plate)', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 550, protein: 32, carbs: 65, fat: 16, baseWeight: 350 },
  'chicken biryani': { displayName: 'Chicken Dum Biryani (1 Plate)', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 550, protein: 32, carbs: 65, fat: 16, baseWeight: 350 },
  'mutton biryani': { displayName: 'Mutton Biryani (1 Plate)', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 650, protein: 35, carbs: 62, fat: 28, baseWeight: 350 },
  'veg biryani': { displayName: 'Veg Biryani (1 Plate)', isCountable: true, defaultUnit: 'plate', defaultQty: 1, baseQty: 1, calories: 420, protein: 10, carbs: 68, fat: 12, baseWeight: 300 },
  'dal': { displayName: 'Yellow Dal (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 198, protein: 12, carbs: 34, fat: 1.5, baseWeight: 200 },
  'dal makhani': { displayName: 'Dal Makhani (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 310, protein: 11, carbs: 30, fat: 16, baseWeight: 200 },
  'lentils': { displayName: 'Cooked Lentils (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 198, protein: 12, carbs: 34, fat: 1.5, baseWeight: 200 },
  'chole': { displayName: 'Chole Masala (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 280, protein: 12, carbs: 38, fat: 8, baseWeight: 200 },
  'rajma': { displayName: 'Rajma Masala (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 260, protein: 13, carbs: 40, fat: 5, baseWeight: 200 },
  'paneer butter masala': { displayName: 'Paneer Butter Masala (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 420, protein: 16, carbs: 14, fat: 34, baseWeight: 200 },
  'shahi paneer': { displayName: 'Shahi Paneer (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 390, protein: 15, carbs: 16, fat: 30, baseWeight: 200 },
  'palak paneer': { displayName: 'Palak Paneer (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 290, protein: 16, carbs: 10, fat: 20, baseWeight: 200 },
  'butter chicken': { displayName: 'Butter Chicken (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 490, protein: 34, carbs: 14, fat: 32, baseWeight: 250 },
  'chicken curry': { displayName: 'Home Chicken Curry (1 Bowl)', isCountable: false, defaultUnit: 'bowl', defaultQty: 1, baseQty: 1, calories: 340, protein: 36, carbs: 8, fat: 18, baseWeight: 250 },
  'curd': { displayName: 'Fresh Curd / Dahi', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 98, protein: 10, carbs: 3.6, fat: 5, baseWeight: 150 },
  'dahi': { displayName: 'Fresh Dahi / Curd', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 98, protein: 10, carbs: 3.6, fat: 5, baseWeight: 150 },
  'greek yogurt': { displayName: 'Greek Yogurt', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 98, protein: 10, carbs: 3.6, fat: 5, baseWeight: 150 },

  // --- UNCOUNTABLE WHOLE WEIGHT FOODS (Per 100g Standard) ---
  'chicken': { displayName: 'Chicken Breast', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'chicken breast': { displayName: 'Chicken Breast', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'chicken thigh': { displayName: 'Chicken Thigh', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 209, protein: 26, carbs: 0, fat: 10.9 },
  'paneer': { displayName: 'Fresh Paneer', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8 },
  'tofu': { displayName: 'Firm Tofu', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 144, protein: 15.7, carbs: 3.9, fat: 8 },
  'soya chunks': { displayName: 'Soya Chunks (Dry)', isCountable: false, defaultUnit: 'g', defaultQty: 50, baseQty: 50, calories: 172, protein: 26, carbs: 16, fat: 0.5 },
  'soy chunks': { displayName: 'Soya Chunks (Dry)', isCountable: false, defaultUnit: 'g', defaultQty: 50, baseQty: 50, calories: 172, protein: 26, carbs: 16, fat: 0.5 },
  'rice': { displayName: 'Cooked White Rice', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, baseWeight: 150 },
  'white rice': { displayName: 'Cooked White Rice', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, baseWeight: 150 },
  'brown rice': { displayName: 'Cooked Brown Rice', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 111, protein: 2.6, carbs: 23, fat: 0.9, baseWeight: 150 },
  'oats': { displayName: 'Rolled Oats (Dry)', isCountable: false, defaultUnit: 'g', defaultQty: 50, baseQty: 100, calories: 389, protein: 16.9, carbs: 66, fat: 6.9, baseWeight: 50 },
  'oatmeal': { displayName: 'Oatmeal', isCountable: false, defaultUnit: 'g', defaultQty: 50, baseQty: 100, calories: 389, protein: 16.9, carbs: 66, fat: 6.9, baseWeight: 50 },
  'salmon': { displayName: 'Wild Salmon', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 208, protein: 20, carbs: 0, fat: 13 },
  'fish': { displayName: 'White Fish', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 105, protein: 22, carbs: 0, fat: 1.5 },
  'tuna': { displayName: 'Canned Tuna in Water', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 132, protein: 28, carbs: 0, fat: 1 },
  'beef': { displayName: 'Lean Beef', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 250, protein: 26, carbs: 0, fat: 15 },
  'steak': { displayName: 'Sirloin Steak', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 250, protein: 26, carbs: 0, fat: 15 },
  'turkey breast': { displayName: 'Turkey Breast', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 135, protein: 30, carbs: 0, fat: 1 },
  'shrimp': { displayName: 'Shrimp', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  'potato': { displayName: 'Boiled Potato', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'potatoes': { displayName: 'Boiled Potatoes', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'sweet potato': { displayName: 'Sweet Potato', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'sweet potatoes': { displayName: 'Sweet Potatoes', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  'pasta': { displayName: 'Cooked Pasta', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  'broccoli': { displayName: 'Steamed Broccoli', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'spinach': { displayName: 'Fresh Spinach', isCountable: false, defaultUnit: 'g', defaultQty: 100, baseQty: 100, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }
};

/**
 * Clean and parse natural language quantity/unit from a food fragment.
 * e.g., "3 maharaja mac burger" -> { qty: 3, unit: 'burger', cleanQuery: 'maharaja mac burger', hasExplicitQty: true }
 * e.g., "2 plate maggie" -> { qty: 2, unit: 'plate', cleanQuery: 'maggie', hasExplicitQty: true }
 * e.g., "lotus biscoff cake" -> { qty: 1, unit: null, cleanQuery: 'lotus biscoff cake', hasExplicitQty: false }
 */
export function extractQuantityAndUnit(text) {
  let str = text.trim();
  let qty = 1;
  let unit = null;
  let hasExplicitQty = false;

  // 1. Check for leading word number like "two", "three", "half"
  const firstWordMatch = str.match(/^([a-zA-Z]+)\s+(.*)$/);
  if (firstWordMatch) {
    const w = firstWordMatch[1].toLowerCase();
    if (WORD_TO_NUM[w] !== undefined) {
      qty = WORD_TO_NUM[w];
      hasExplicitQty = true;
      str = firstWordMatch[2].trim();
    }
  }

  // 2. Check for numeric digits like "200g", "3", "2.5"
  const numMatch = str.match(/^([\d.]+)\s*([a-zA-Z]+)?\s*(.*)$/);
  if (numMatch && !isNaN(parseFloat(numMatch[1]))) {
    qty = parseFloat(numMatch[1]);
    hasExplicitQty = true;
    const potentialUnit = numMatch[2] ? numMatch[2].toLowerCase() : null;
    const rest = numMatch[3] ? numMatch[3].trim() : '';

    const knownUnits = [
      'g', 'gram', 'grams', 'kg', 'ml', 'oz', 'lb', 'lbs',
      'plate', 'plates', 'bowl', 'bowls', 'slice', 'slices', 'burger', 'burgers',
      'cup', 'cups', 'scoop', 'scoops', 'piece', 'pieces', 'pc', 'pcs',
      'pack', 'packs', 'packet', 'packets', 'tbsp', 'tsp', 'serving', 'servings'
    ];

    if (potentialUnit && knownUnits.includes(potentialUnit)) {
      unit = potentialUnit.replace(/s$/, ''); // singularize
      str = rest;
    } else if (potentialUnit) {
      // Potential unit was part of the food name, e.g. "3 maharaja mac"
      str = (potentialUnit + (rest ? ' ' + rest : '')).trim();
    } else {
      str = rest;
    }
  }

  // 3. Check for unit phrases like "plate of maggie", "slice of cake", "bowl of rice"
  const unitPhraseMatch = str.match(/^(plate|bowl|slice|cup|piece|serving|pack|packet)\s+(?:of\s+)?(.*)$/i);
  if (unitPhraseMatch) {
    if (!unit) unit = unitPhraseMatch[1].toLowerCase();
    str = unitPhraseMatch[2].trim();
  }

  return {
    quantity: qty,
    unit: unit,
    hasExplicitQty,
    cleanQuery: str.toLowerCase().trim()
  };
}

/**
 * Lookup food in OpenFoodFacts Global API.
 * Free, open crowd-sourced worldwide food & restaurant database.
 */
async function fetchOpenFoodFacts(foodName) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&action=process&json=1&page_size=5`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.products || !Array.isArray(data.products) || data.products.length === 0) return null;

    // Find first product with valid nutritional macros
    for (const p of data.products) {
      const nut = p.nutriments || {};
      const proteins = Number(nut.proteins_100g || nut.proteins || nut.proteins_serving);
      const carbs = Number(nut.carbohydrates_100g || nut.carbohydrates || nut.carbohydrates_serving);
      const fat = Number(nut.fat_100g || nut.fat || nut.fat_serving);
      let calories = Number(nut['energy-kcal_100g'] || nut['energy-kcal'] || nut['energy-kcal_serving'] || nut.energy_100g);

      if (!isNaN(proteins) || !isNaN(carbs) || !isNaN(fat)) {
        const safeP = roundMacro(proteins || 0);
        const safeC = roundMacro(carbs || 0);
        const safeF = roundMacro(fat || 0);

        if (!calories || isNaN(calories) || calories === 0) {
          calories = calculateAtwaterCalories(safeP, safeC, safeF);
        }

        if (calories > 0 || safeP > 0 || safeC > 0 || safeF > 0) {
          return {
            name: p.product_name || foodName.toUpperCase(),
            calories: Math.round(calories),
            protein: safeP,
            carbs: safeC,
            fat: safeF,
            servingWeightGrams: Number(p.serving_quantity) || 100,
            source: 'openfoodfacts'
          };
        }
      }
    }
  } catch (err) {
    console.warn('[OpenFoodFacts] search error:', err.message);
  }
  return null;
}

/**
 * 3-Tier Single Segment Resolver:
 * 1. Local Database Match
 * 2. OpenFoodFacts Global Search API
 * 3. USDA FoodData Central API
 * 4. Fallback culinary heuristics
 */
export async function resolveSingleFoodSegment(rawSegment) {
  const { quantity, unit, hasExplicitQty, cleanQuery } = extractQuantityAndUnit(rawSegment);
  const q = cleanQuery;

  // 1. Direct or Partial Local Lookup
  let localItem = LOCAL_FOOD_DB[q];
  if (!localItem) {
    // Try singular / plural
    if (q.endsWith('s') && LOCAL_FOOD_DB[q.slice(0, -1)]) {
      localItem = LOCAL_FOOD_DB[q.slice(0, -1)];
    } else if (LOCAL_FOOD_DB[q + 's']) {
      localItem = LOCAL_FOOD_DB[q + 's'];
    }
  }
  if (!localItem) {
    // Fuzzy key match
    const keys = Object.keys(LOCAL_FOOD_DB);
    const match = keys.find(k => k === q || q.includes(k) || k.includes(q));
    if (match) localItem = LOCAL_FOOD_DB[match];
  }

  if (localItem) {
    let effectiveQty = quantity;
    let effectiveUnit = unit;

    if (!hasExplicitQty) {
      effectiveQty = localItem.defaultQty || (localItem.isCountable ? 1 : 100);
      if (!effectiveUnit) {
        effectiveUnit = localItem.defaultUnit || (localItem.isCountable ? 'whole' : 'g');
      }
    } else {
      if (!effectiveUnit) {
        effectiveUnit = localItem.defaultUnit || (localItem.isCountable ? 'whole' : 'g');
      }
    }

    let multiplier = 1;
    if (localItem.isCountable) {
      multiplier = effectiveQty / (localItem.baseQty || 1);
    } else {
      // Uncountable / weight / volume item
      if (effectiveUnit === 'g' || effectiveUnit === 'gram' || effectiveUnit === 'grams' || effectiveUnit === 'ml') {
        if (localItem.baseWeight && localItem.defaultUnit !== 'g') {
          // e.g. 200g of dal where 1 bowl = 200g
          multiplier = effectiveQty / localItem.baseWeight;
        } else {
          multiplier = effectiveQty / (localItem.baseQty || 100);
        }
      } else if (effectiveUnit === 'kg') {
        const grams = effectiveQty * 1000;
        multiplier = (localItem.baseWeight && localItem.defaultUnit !== 'g') ? grams / localItem.baseWeight : grams / (localItem.baseQty || 100);
      } else if (effectiveUnit === 'oz') {
        const grams = effectiveQty * 28.35;
        multiplier = (localItem.baseWeight && localItem.defaultUnit !== 'g') ? grams / localItem.baseWeight : grams / (localItem.baseQty || 100);
      } else if (effectiveUnit === 'lb' || effectiveUnit === 'lbs') {
        const grams = effectiveQty * 453.6;
        multiplier = (localItem.baseWeight && localItem.defaultUnit !== 'g') ? grams / localItem.baseWeight : grams / (localItem.baseQty || 100);
      } else if (['bowl', 'plate', 'serving', 'glass', 'tbsp', 'cup'].includes(effectiveUnit)) {
        if (localItem.defaultUnit === effectiveUnit) {
          multiplier = effectiveQty / (localItem.baseQty || 1);
        } else {
          const portionGrams = localItem.baseWeight || 100;
          multiplier = (effectiveQty * portionGrams) / (localItem.baseQty || 100);
        }
      } else {
        multiplier = effectiveQty / (localItem.baseQty || (localItem.isCountable ? 1 : 100));
      }
    }

    const safeP = roundMacro(localItem.protein * multiplier);
    const safeC = roundMacro(localItem.carbs * multiplier);
    const safeF = roundMacro(localItem.fat * multiplier);
    const calculatedCals = calculateAtwaterCalories(safeP, safeC, safeF);
    const cals = Math.round(localItem.calories * multiplier) || calculatedCals;

    const displayName = localItem.displayName || q;
    const namePrefix = (localItem.isCountable && effectiveQty > 1) ? `${effectiveQty}x ` : (
      !localItem.isCountable && hasExplicitQty ? `${effectiveQty}${effectiveUnit ? effectiveUnit : 'g'} ` : ''
    );

    return {
      name: namePrefix ? `${namePrefix}${displayName}` : displayName,
      rawQuery: rawSegment,
      quantity: effectiveQty,
      unit: effectiveUnit,
      calories: cals,
      protein: safeP,
      carbs: safeC,
      fat: safeF,
      baseRef: {
        calories: localItem.calories,
        protein: localItem.protein,
        carbs: localItem.carbs,
        fat: localItem.fat,
        baseQty: localItem.baseQty || (localItem.isCountable ? 1 : 100),
        isCountable: localItem.isCountable,
        defaultUnit: localItem.defaultUnit
      },
      source: 'local'
    };
  }

  // 2. OpenFoodFacts Global API
  const offResult = await fetchOpenFoodFacts(q);
  if (offResult) {
    const effectiveQty = hasExplicitQty ? quantity : (offResult.servingWeightGrams || 100);
    const effectiveUnit = unit || (unit === 'g' ? 'g' : 'serving');
    const portionFactor = effectiveUnit === 'g' ? effectiveQty / 100 : effectiveQty * ((offResult.servingWeightGrams || 100) / 100);
    const safeP = roundMacro(offResult.protein * portionFactor);
    const safeC = roundMacro(offResult.carbs * portionFactor);
    const safeF = roundMacro(offResult.fat * portionFactor);
    const cals = calculateAtwaterCalories(safeP, safeC, safeF);

    return {
      name: (hasExplicitQty && quantity > 1 ? `${quantity}x ` : '') + offResult.name,
      rawQuery: rawSegment,
      quantity: effectiveQty,
      unit: effectiveUnit,
      calories: cals,
      protein: safeP,
      carbs: safeC,
      fat: safeF,
      baseRef: {
        calories: offResult.calories,
        protein: offResult.protein,
        carbs: offResult.carbs,
        fat: offResult.fat,
        baseQty: offResult.servingWeightGrams || 100,
        isCountable: false,
        defaultUnit: 'g'
      },
      source: 'openfoodfacts'
    };
  }

  // 3. USDA FoodData Central API
  try {
    const usdaResults = await foodService.searchFoods(q);
    if (usdaResults && usdaResults.length > 0) {
      const top = usdaResults[0];
      const effectiveQty = hasExplicitQty ? quantity : 100;
      const effectiveUnit = unit || 'g';
      const factor = (effectiveUnit === 'g' ? effectiveQty / 100 : effectiveQty);
      const safeP = roundMacro((top.protein || top.proteinPer100g || 0) * factor);
      const safeC = roundMacro((top.carbs || top.carbsPer100g || 0) * factor);
      const safeF = roundMacro((top.fat || top.fatPer100g || 0) * factor);
      const cals = calculateAtwaterCalories(safeP, safeC, safeF);

      return {
        name: (hasExplicitQty && quantity > 1 ? `${quantity}x ` : '') + top.name,
        rawQuery: rawSegment,
        quantity: effectiveQty,
        unit: effectiveUnit,
        calories: cals,
        protein: safeP,
        carbs: safeC,
        fat: safeF,
        baseRef: {
          calories: top.caloriesPer100g || top.calories,
          protein: top.proteinPer100g || top.protein,
          carbs: top.carbsPer100g || top.carbs,
          fat: top.fatPer100g || top.fat,
          baseQty: 100,
          isCountable: false,
          defaultUnit: 'g'
        },
        source: 'usda'
      };
    }
  } catch (err) {
    console.warn('[USDA] lookup fallback:', err.message);
  }



  // 4. Culinary Heuristic Fallback
  // If no database has the item, provide a realistic estimated standard so it never returns 0g macros
  const isSweet = /cake|cookie|sweet|chocolate|pastry|dessert|sugar|ice cream/i.test(q);
  const isFriedOrFast = /burger|pizza|fry|fried|samosa|crispy|patty/i.test(q);
  const isProtein = /meat|chicken|fish|egg|protein|paneer|tofu/i.test(q);

  let estP = 10;
  let estC = 30;
  let estF = 10;

  if (isSweet) {
    estP = 5; estC = 55; estF = 18;
  } else if (isFriedOrFast) {
    estP = 18; estC = 45; estF = 24;
  } else if (isProtein) {
    estP = 28; estC = 4; estF = 8;
  }

  const p = roundMacro(estP * quantity);
  const c = roundMacro(estC * quantity);
  const f = roundMacro(estF * quantity);
  const calories = calculateAtwaterCalories(p, c, f);

  return {
    name: (quantity > 1 ? `${quantity}x ` : '') + q.replace(/\b\w/g, l => l.toUpperCase()),
    rawQuery: rawSegment,
    quantity,
    unit: unit || 'serving',
    calories,
    protein: p,
    carbs: c,
    fat: f,
    baseRef: { calories: Math.round(calories / quantity), protein: estP, carbs: estC, fat: estF, isCountable: true, defaultUnit: 'serving' },
    source: 'heuristic'
  };
}

/**
 * Gemini Structured Multi-Item Parser with tools: [{ google_search: {} }] fallback
 */
async function parseCompoundWithGemini(input) {
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || null;
  if (!apiKey) return null;

  const cacheKey = `gemini_compound_${input.toLowerCase().trim()}`;
  try {
    const cached = await get(cacheKey);
    if (cached) return cached;
  } catch {
    // Continue to network
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a certified sports nutrition database parser.
Analyze this meal description and compute exact, realistic nutritional macros (Protein, Carbs, Fat in grams) and calories for every food item and quantity mentioned:
"${input}"

Return a single JSON array of items with these exact keys:
[
  {
    "name": "Title of food item (e.g. Lotus Biscoff Cake)",
    "quantity": number (e.g. 1),
    "unit": "string (e.g. slice, burger, plate, piece, g)",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
]`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error(`Gemini status ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const items = parsed.map(item => {
        const p = roundMacro(item.protein);
        const c = roundMacro(item.carbs);
        const f = roundMacro(item.fat);
        const atwaterCals = calculateAtwaterCalories(p, c, f);
        return {
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'serving',
          calories: Number(item.calories) || atwaterCals,
          protein: p,
          carbs: c,
          fat: f,
          source: 'gemini'
        };
      });

      try {
        await set(cacheKey, items);
      } catch {
        // Cache write deferred
      }

      return items;
    }
  } catch (err) {
    console.warn('[Gemini] parse failed, switching to local multi-item parser:', err.message);
  }

  return null;
}

export const aiService = {
  /**
   * Primary resolver supporting single items, complex meals, and multi-item strings:
   * e.g., "lotus biscoff cake and 3 maharaja mac burger and 2 plate maggie"
   */
  resolveFood: async (input) => {
    if (!input || typeof input !== 'string' || !input.trim()) return [];

    const raw = input.trim();

    // 1. If Gemini API Key is configured, attempt intelligent web-grounded AI parsing
    const geminiKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      const geminiItems = await parseCompoundWithGemini(raw);
      if (geminiItems && geminiItems.length > 0) {
        if (geminiItems.length === 1) {
          return geminiItems;
        }
        // Multi-item meal: combine totals into a single composite log entry with item details
        const combinedTitle = geminiItems.map(i => `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.name}`).join(' + ');
        const totalP = roundMacro(geminiItems.reduce((acc, i) => acc + (Number(i.protein) || 0), 0));
        const totalC = roundMacro(geminiItems.reduce((acc, i) => acc + (Number(i.carbs) || 0), 0));
        const totalF = roundMacro(geminiItems.reduce((acc, i) => acc + (Number(i.fat) || 0), 0));
        const totalCalories = calculateAtwaterCalories(totalP, totalC, totalF);

        return [{
          name: combinedTitle,
          quantity: 1,
          unit: 'meal',
          calories: totalCalories,
          protein: totalP,
          carbs: totalC,
          fat: totalF,
          items: geminiItems,
          baseRef: { calories: totalCalories, protein: totalP, carbs: totalC, fat: totalF, isCountable: true, defaultUnit: 'meal' },
          source: 'gemini'
        }];
      }
    }

    // 2. Offline / Local Multi-Item Parser:
    // Split on connectors: "and", "with", "plus", "+", "&", ","
    const segments = raw
      .split(/\s+(?:and|with|plus)\s+|[,+&]/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (segments.length > 1) {
      // Resolve all items in parallel
      const resolvedSegments = await Promise.all(segments.map(seg => resolveSingleFoodSegment(seg)));
      const validItems = resolvedSegments.filter(Boolean);

      if (validItems.length > 0) {
        const combinedTitle = validItems.map(i => i.name).join(' + ');
        const totalP = roundMacro(validItems.reduce((acc, i) => acc + (Number(i.protein) || 0), 0));
        const totalC = roundMacro(validItems.reduce((acc, i) => acc + (Number(i.carbs) || 0), 0));
        const totalF = roundMacro(validItems.reduce((acc, i) => acc + (Number(i.fat) || 0), 0));
        const totalCalories = calculateAtwaterCalories(totalP, totalC, totalF);

        return [{
          name: combinedTitle,
          quantity: 1,
          unit: 'meal',
          calories: totalCalories,
          protein: totalP,
          carbs: totalC,
          fat: totalF,
          items: validItems,
          baseRef: { calories: totalCalories, protein: totalP, carbs: totalC, fat: totalF, isCountable: true, defaultUnit: 'meal' },
          source: 'compound-local'
        }];
      }
    }

    // 3. Single Item Lookup
    const single = await resolveSingleFoodSegment(raw);
    if (single) {
      return [single];
    }

    return [];
  }
};
