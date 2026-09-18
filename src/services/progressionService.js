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
   * - If user completed all sets at target reps: suggest +2.5 kg
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
        suggestedWeight: maxWeight + 2.5,
        text: `Target: +2.5 kg (${maxWeight + 2.5} kg) — All reps completed last time`
      };
    }

    return {
      type: 'maintain',
      suggestedWeight: maxWeight,
      text: `Target: ${maxWeight} kg — Consolidate volume before adding weight`
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
  },

  /**
   * In-Workout Autoregulation Engine (APRE & RPE):
   * Dynamically evaluates performance in real-time during a session.
   * Adjusts subsequent sets of an exercise if reps are missed or if exertion was easy/failed.
   */
  getInWorkoutAutoregulation: ({ currentWeight, targetReps, actualReps, exertion }) => {
    const weight = Number(currentWeight) || 0;
    const target = Number(targetReps) || 8;
    const actual = Number(actualReps) || 0;

    if (weight <= 0) return null;

    const missedReps = target - actual;

    // 1. Definite failure: user missed 2+ reps OR marked 'failed'
    if (exertion === 'failed' || missedReps >= 2) {
      const deloadAmount = weight >= 80 ? 5 : 2.5;
      const newWeight = Math.max(0, weight - deloadAmount);
      return {
        action: 'deload',
        adjustment: -deloadAmount,
        newWeight,
        reason: missedReps >= 2 ? `Missed planned target by ${missedReps} reps` : 'Muscle failure / fatigue ceiling reached',
        message: `⚡ Auto-Regulated: Reduced next sets to ${newWeight} kg (-${deloadAmount} kg) to maintain hypertrophy without form breakdown.`
      };
    }

    // 2. Heavy struggle / grind near failure
    if (exertion === 'hard' || missedReps === 1) {
      const deloadAmount = 2.5;
      const newWeight = Math.max(0, weight - deloadAmount);
      return {
        action: 'deload',
        adjustment: -deloadAmount,
        newWeight,
        reason: 'RPE 9.5 near technical failure',
        message: `⚡ Auto-Regulated: Reduced next sets by 2.5 kg (${newWeight} kg) to prevent fatigue accumulation.`
      };
    }

    // 3. High ease / explosive speed: marked 'easy' or exceeded target reps
    if (exertion === 'easy' || (actual - target >= 2 && exertion !== 'hard' && exertion !== 'failed')) {
      const boostAmount = 2.5;
      const newWeight = weight + boostAmount;
      return {
        action: 'boost',
        adjustment: boostAmount,
        newWeight,
        reason: 'Sub-maximal exertion (RPE ≤ 6) & high bar speed',
        message: `🚀 Auto-Boost: +${boostAmount} kg applied for remaining sets (${newWeight} kg) based on explosive completion!`
      };
    }

    return null;
  }
};
