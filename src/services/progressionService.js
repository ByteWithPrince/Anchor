/**
 * Sports Science Progressive Overload & 1RM Service
 */
export const progressionService = {
  /**
   * Epley 1RM formula: 1RM = weight * (1 + reps / 30)
   */
  calculate1RM: (weight, reps) => {
    const w = Number(weight) || 0;
    const r = Number(reps) || 0;
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30));
  },

  /**
   * Generates deterministic progressive overload suggestion for the next session:
   * - If user completed all sets at target reps: suggest +5 lbs (+2.5 kg)
   * - If user missed reps: suggest staying at same weight
   */
  getOverloadSuggestion: (previousSets) => {
    if (!previousSets || previousSets.length === 0) return null;
    
    const completedSets = previousSets.filter(s => s.completed);
    if (completedSets.length === 0) return null;

    const maxWeight = Math.max(...completedSets.map(s => Number(s.weight) || 0));
    const allHit = completedSets.every(s => (Number(s.reps) || 0) >= 8); // baseline target check

    if (allHit && maxWeight > 0) {
      return {
        type: 'increase',
        suggestedWeight: maxWeight + 5,
        text: `Target: +5 lbs (${maxWeight + 5} lbs) — All reps completed last time`
      };
    }

    return {
      type: 'maintain',
      suggestedWeight: maxWeight,
      text: `Target: ${maxWeight} lbs — Consolidate volume before adding weight`
    };
  },

  /**
   * Total training volume for a session: Σ(weight × reps)
   */
  calculateSessionVolume: (exercises) => {
    if (!exercises || !Array.isArray(exercises)) return 0;
    return exercises.reduce((acc, ex) => {
      const sets = ex.sets || [];
      const exVol = sets
        .filter(s => s.completed)
        .reduce((sAcc, s) => sAcc + ((Number(s.weight) || 0) * (Number(s.reps) || 0)), 0);
      return acc + exVol;
    }, 0);
  },

  /**
   * Extracts historical volume trend from workout logs
   */
  getVolumeTrend: (workoutLogs) => {
    if (!workoutLogs || workoutLogs.length === 0) return [];
    return [...workoutLogs]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => ({
        date: log.date,
        volume: progressionService.calculateSessionVolume(log.exercises)
      }));
  }
};
