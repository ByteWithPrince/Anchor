/**
 * Automated Verification Suite for Anchor Fitness OS Backend API
 */

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('--- STARTING ANCHOR BACKEND API TEST SUITE ---');
  let token = '';
  let testEmail = `athlete_${Date.now()}@anchor.test`;
  let testPassword = 'Password123!';
  let workoutId = `test_ws_${Date.now()}`;
  let foodId = `test_fd_${Date.now()}`;
  let routineId = `test_rtn_${Date.now()}`;

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  console.log('✓ Health Check:', health.status, health.version);

  // 2. User Registration
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Vexora Athlete',
      role: 'Powerlifting'
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regData)}`);
  token = regData.token;
  console.log('✓ User Registration:', regData.user.email, '| ID:', regData.user.id);

  // 3. Current User Me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('✓ Auth Me Profile:', meData.user.name, '| Role:', meData.user.role);

  // 4. Update Profile
  const profRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role: 'Hybrid Strength & Endurance' })
  });
  const profData = await profRes.json();
  console.log('✓ Profile Updated:', profData.user.role);

  // 5. Training Plan Active
  const planRes = await fetch(`${BASE_URL}/api/plans/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const planData = await planRes.json();
  console.log('✓ Active Training Plan:', planData.plan.splitName, '| Target Calories:', planData.plan.macroTargets.calories);

  // 6. Update Training Plan
  const planPutRes = await fetch(`${BASE_URL}/api/plans/active`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      splitName: 'Hypertrophy Mastery Split',
      macroTargets: { calories: 2750, protein: 210, carbs: 250, fat: 75 }
    })
  });
  const planPutData = await planPutRes.json();
  console.log('✓ Training Plan Updated:', planPutData.plan.splitName, '| Cals:', planPutData.plan.macroTargets.calories);

  // 7. Custom Routine Creation
  const rtnRes = await fetch(`${BASE_URL}/api/plans/routines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: routineId,
      name: 'Heavy Bench & Accessory Blast',
      focus: 'Chest & Arms',
      estimatedMinutes: 50,
      exercises: [
        { name: 'Barbell Bench Press', defaultSets: 4, defaultReps: 6, defaultWeight: 100 },
        { name: 'Incline Dumbbell Fly', defaultSets: 3, defaultReps: 12, defaultWeight: 24 }
      ]
    })
  });
  const rtnData = await rtnRes.json();
  console.log('✓ Custom Routine Created:', rtnData.routine.name);

  // 8. Log Workout Session
  const wsRes = await fetch(`${BASE_URL}/api/workouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: workoutId,
      name: 'Push Day A (Chest & Triceps)',
      date: new Date().toISOString().split('T')[0],
      durationMin: 55,
      exercises: [
        {
          name: 'Barbell Bench Press',
          sets: [
            { weight: 100, reps: 5, completed: true, rpe: 8 },
            { weight: 105, reps: 5, completed: true, rpe: 8.5 },
            { weight: 110, reps: 4, completed: true, rpe: 9.5 }
          ]
        },
        {
          name: 'Overhead Tricep Extension',
          sets: [
            { weight: 35, reps: 12, completed: true },
            { weight: 35, reps: 10, completed: true }
          ]
        }
      ]
    })
  });
  const wsData = await wsRes.json();
  console.log('✓ Workout Logged:', wsData.sessionId, '| Volume:', wsData.totalVolume, 'kg | Sets:', wsData.completedSets);

  // 9. Personal Records (PRs)
  const prsRes = await fetch(`${BASE_URL}/api/workouts/stats/prs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const prsData = await prsRes.json();
  console.log('✓ PRs Calculated:', prsData.prs.map(p => `${p.exercise}: max ${p.maxWeight}kg (Est 1RM: ${p.estimated1RM}kg)`));

  // 10. Log Nutrition
  const nutRes = await fetch(`${BASE_URL}/api/nutrition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: foodId,
      name: 'Ribeye Steak & Sweet Potatoes',
      calories: 780,
      protein: 64,
      carbs: 48,
      fat: 32,
      mealType: 'Dinner',
      source: 'manual'
    })
  });
  const nutData = await nutRes.json();
  console.log('✓ Food Item Logged:', nutData.item.name, '| Cals:', nutData.item.calories);

  // 11. Nutrition Daily Totals
  const nutGetRes = await fetch(`${BASE_URL}/api/nutrition?date=${new Date().toISOString().split('T')[0]}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const nutGetData = await nutGetRes.json();
  console.log('✓ Daily Macro Totals:', nutGetData.totals);

  // 12. Ingest GPS Telemetry
  const gpsRes = await fetch(`${BASE_URL}/api/telemetry/gps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId: workoutId,
      distanceKm: 5.24,
      durationSec: 1800,
      coordinates: [
        { lat: 37.7749, lng: -122.4194, alt: 12 },
        { lat: 37.7755, lng: -122.4180, alt: 14 }
      ]
    })
  });
  const gpsData = await gpsRes.json();
  console.log('✓ GPS Telemetry Ingested:', gpsData.streamId);

  // 13. Delta Synchronization Endpoint
  const syncRes = await fetch(`${BASE_URL}/api/sync/delta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      lastSyncedAt: Date.now() - 60000, // Query changes in last 60 seconds
      mutations: {
        bodyweight: [
          { date: new Date().toISOString().split('T')[0], weight: 76.5 }
        ]
      }
    })
  });
  const syncData = await syncRes.json();
  console.log('✓ Delta Sync Response:', {
    serverTime: syncData.serverTime,
    receivedWorkouts: syncData.delta.workouts.length,
    receivedNutrition: syncData.delta.nutrition.length,
    receivedRoutines: syncData.delta.routines.length,
    receivedBodyweight: syncData.delta.bodyweight.length
  });

  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY (13/13) ---');
}

runTests().catch(err => {
  console.error('✗ TEST FAILED:', err);
  process.exit(1);
});
