/**
 * Barbell Plate Loading Math Service
 */
export const plateService = {
  BAR_WEIGHT_LBS: 45,
  AVAILABLE_PLATES: [45, 35, 25, 10, 5, 2.5],

  /**
   * Calculates plate breakdown per side for standard 45lb barbell
   */
  calculatePlates: (totalWeightLbs) => {
    const total = Number(totalWeightLbs) || 0;
    if (total < plateService.BAR_WEIGHT_LBS) {
      return {
        barWeight: plateService.BAR_WEIGHT_LBS,
        weightPerSide: 0,
        platesPerSide: [],
        remainder: total > 0 ? total : 0,
        isValid: false,
        message: `Total weight is less than 45 lb bar`
      };
    }

    let remainingPerSide = (total - plateService.BAR_WEIGHT_LBS) / 2;
    const weightPerSide = remainingPerSide;
    const platesPerSide = [];

    for (const plate of plateService.AVAILABLE_PLATES) {
      if (remainingPerSide >= plate) {
        const count = Math.floor(remainingPerSide / plate);
        platesPerSide.push({ plate, count });
        remainingPerSide = Math.round((remainingPerSide - count * plate) * 10) / 10;
      }
    }

    return {
      barWeight: plateService.BAR_WEIGHT_LBS,
      weightPerSide,
      platesPerSide,
      remainder: remainingPerSide,
      isValid: true,
      summary: platesPerSide.map(p => `${p.count}×${p.plate}`).join(', ')
    };
  }
};
