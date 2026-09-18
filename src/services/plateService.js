/**
 * Olympic Barbell Plate Loading Math Service (Metric Standards)
 */
export const plateService = {
  BAR_WEIGHT_KG: 20,
  AVAILABLE_PLATES: [25, 20, 15, 10, 5, 2.5, 1.25],

  /**
   * Calculates plate breakdown per side for standard 20kg Olympic barbell
   */
  calculatePlates: (totalWeightKg) => {
    const total = Number(totalWeightKg) || 0;
    if (total < plateService.BAR_WEIGHT_KG) {
      return {
        barWeight: plateService.BAR_WEIGHT_KG,
        weightPerSide: 0,
        platesPerSide: [],
        remainder: total > 0 ? total : 0,
        isValid: false,
        message: `Total weight is less than 20 kg Olympic bar`
      };
    }

    let remainingPerSide = (total - plateService.BAR_WEIGHT_KG) / 2;
    const weightPerSide = remainingPerSide;
    const platesPerSide = [];

    for (const plate of plateService.AVAILABLE_PLATES) {
      if (remainingPerSide >= plate) {
        const count = Math.floor(remainingPerSide / plate);
        platesPerSide.push({ plate, count });
        remainingPerSide = Math.round((remainingPerSide - count * plate) * 100) / 100;
      }
    }

    return {
      barWeight: plateService.BAR_WEIGHT_KG,
      weightPerSide,
      platesPerSide,
      remainder: remainingPerSide,
      isValid: true,
      summary: platesPerSide.map(p => `${p.count}×${p.plate}kg`).join(', ')
    };
  }
};
