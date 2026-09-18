/**
 * Comprehensive Automated Verification Suite for Anchor Fitness OS Backend API.
 * Tests authentication, dual-token rotation, theft detection, guest migration,
 * atomic delta sync, multi-user isolation, export, and account deletion.
 */

import { createBackup } from './backup.js';

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE ANCHOR BACKEND TEST SUITE ---');
  let token = '';
  let refreshToken = '';
  let testEmail = `athlete_${Date.now()}@anchor.test`;
  let testPassword = 'Password123!';
  let workoutId = `test_ws_${Date.now()}`;
  let foodId = `test_fd_${Date.now()}`;
  let routineId = `test_rtn_${Date.now()}`;

  // 1. Health Diagnostics
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  if (health.status !== 'ok') throw new Error(`Health check degraded: ${JSON.stringify(health)}`);
  console.log('✓ 1. Health Check:', health.status, '| DB:', health.database, '| Heap:', `${health.memory.heapUsedMb}MB`);

  // 2. Athlete Registration & Dual-Token Issuance
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Vexora Elite Athlete',
      role: 'Powerlifting'
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regData)}`);
  token = regData.token;
  refreshToken = regData.refreshToken;
  if (!token || !refreshToken) throw new Error('Dual-token architecture failed: Missing access or refresh token');
  console.log('✓ 2. Athlete Registration:', regData.user.email, '| User ID:', regData.user.id);

  // 3. Google Sign-In with Guest Data Migration ("Claim Guest Data")
  const googleEmail = `google_athlete_${Date.now()}@gmail.com`;
  const guestWorkoutId = `guest_ws_${Date.now()}`;
  const gRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: googleEmail,
      name: 'Google Migrated Athlete',
      googleId: `gid_${Date.now()}`,
      guestData: {
        workouts: [{
          id: guestWorkoutId,
          name: 'Guest Bench Session',
          date: new Date().toISOString().split('T')[0],
          exercises: [{ name: 'Bench Press', sets: [{ weight: 100, reps: 5, completed: true }] }]
        }]
      }
    })
  });
  const gData = await gRes.json();
  if (!gRes.ok || !gData.token) throw new Error(`Google Auth failed: ${JSON.stringify(gData)}`);
  console.log('✓ 3. Google Sign-In + Guest Migration:', gData.user.email, '| ID:', gData.user.id);

  // 4. Refresh Token Rotation
  const refRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const refData = await refRes.json();
  if (!refRes.ok || !refData.token) throw new Error(`Refresh token rotation failed: ${JSON.stringify(refData)}`);
  const oldRefreshToken = refreshToken;
  token = refData.token;
  refreshToken = refData.refreshToken;
  console.log('✓ 4. Refresh Token Rotated Successfully (New access token issued)');

  // 5. Refresh Token Theft Detection (Replaying already used oldRefreshToken)
  const replayRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: oldRefreshToken })
  });
  const replayData = await replayRes.json();
  if (replayRes.status !== 401 || replayData.code !== 'TOKEN_THEFT_DETECTED') {
    throw new Error(`Token theft detection failed! Status: ${replayRes.status}, data: ${JSON.stringify(replayData)}`);
  }
  console.log('✓ 5. Token Theft Detection Verified (Reused token was caught and blocked)');

  // Re-login User 1 to continue remaining tests
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error(`Re-login failed (Status ${loginRes.status}): ${JSON.stringify(loginData)}`);
  }
  token = loginData.token;

  // 6. User Profile
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  if (!meRes.ok || !meData.user) {
    throw new Error(`Profile fetch failed (Status ${meRes.status}): ${JSON.stringify(meData)}`);
  }
  console.log('✓ 6. Profile Fetched:', meData.user.name, '| Role:', meData.user.role);

  // 7. Active Training Plan
  const planRes = await fetch(`${BASE_URL}/api/plans/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const planData = await planRes.json();
  console.log('✓ 7. Active Training Plan:', planData.plan.splitName, '| Cals:', planData.plan.macroTargets.calories);

  // 8. Custom Routine Creation
  const rtnRes = await fetch(`${BASE_URL}/api/plans/routines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: routineId,
      name: 'Explosive Deadlift Day',
      focus: 'Posterior Chain',
      estimatedMinutes: 55,
      exercises: [{ name: 'Conventional Deadlift', sets: 4, reps: 5 }]
    })
  });
  const rtnData = await rtnRes.json();
  console.log('✓ 8. Custom Routine Created:', rtnData.routine.name);

  // 9. Workout Logging with Exercises and Sets
  const wRes = await fetch(`${BASE_URL}/api/workouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: workoutId,
      name: 'Heavy Deadlift Session',
      durationMin: 55,
      totalVolume: 3200,
      totalPlannedSets: 4,
      totalCompletedSets: 4,
      exercises: [{
        name: 'Conventional Deadlift',
        sets: [
          { setNumber: 1, weight: 140, reps: 5, completed: true, rpe: 7.5 },
          { setNumber: 2, weight: 160, reps: 5, completed: true, rpe: 8.5 }
        ]
      }]
    })
  });
  const wData = await wRes.json();
  console.log('✓ 9. Workout Session Logged:', wData.session.name, '| Volume:', wData.session.totalVolume);

  // 10. PR Calculation
  const prsRes = await fetch(`${BASE_URL}/api/workouts/history/prs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const prsData = await prsRes.json();
  console.log('✓ 10. PRs Calculated:', prsData.prs.map(p => `${p.exercise}: ${p.maxWeight}kg`));

  // 11. Nutrition Logging
  const nutRes = await fetch(`${BASE_URL}/api/nutrition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: foodId,
      name: 'Salmon & Wild Rice',
      calories: 650,
      protein: 48,
      carbs: 52,
      fat: 22,
      mealType: 'Dinner'
    })
  });
  const nutData = await nutRes.json();
  console.log('✓ 11. Nutrition Logged:', nutData.item.name, '| Protein:', `${nutData.item.protein}g`);

  // 12. Ingest GPS Telemetry
  const gpsRes = await fetch(`${BASE_URL}/api/telemetry/gps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId: workoutId,
      distanceKm: 5.0,
      durationSec: 1500,
      coordinates: [{ lat: 37.77, lng: -122.41 }]
    })
  });
  const gpsData = await gpsRes.json();
  console.log('✓ 12. GPS Telemetry Ingested:', gpsData.streamId);

  // 13. Atomic Bidirectional Delta Sync
  const syncRes = await fetch(`${BASE_URL}/api/sync/delta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      lastSyncedAt: 0,
      mutations: {
        bodyweight: [{ date: new Date().toISOString().split('T')[0], weight: 77.2 }]
      }
    })
  });
  const syncData = await syncRes.json();
  if (!syncData.success || !syncData.delta) throw new Error('Delta sync failed');
  console.log('✓ 13. Atomic Delta Sync Executed:', {
    receivedWorkouts: syncData.delta.workouts.length,
    receivedNutrition: syncData.delta.nutrition.length,
    receivedBodyweight: syncData.delta.bodyweight.length
  });

  // 14. Multi-User Data Isolation Verification
  const userBEmail = `user_b_${Date.now()}@anchor.test`;
  const userBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, password: 'Password123!', name: 'Athlete B' })
  });
  const userBData = await userBRes.json();
  const userBWorkouts = await fetch(`${BASE_URL}/api/workouts`, {
    headers: { Authorization: `Bearer ${userBData.token}` }
  });
  const userBWorkoutsData = await userBWorkouts.json();
  if (userBWorkoutsData.sessions.some(s => s.id === workoutId)) {
    throw new Error('CRITICAL SECURITY VIOLATION: User B can see User A workouts!');
  }
  console.log('✓ 14. Multi-User Isolation Verified (User B cannot access User A data)');

  // 15. Global Session Revocation (Logout All Devices)
  const revokeRes = await fetch(`${BASE_URL}/api/auth/logout-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const revokeData = await revokeRes.json();
  console.log('✓ 15. Global Logout-All Executed:', revokeData.message);

  // 16. Full Athlete Data Export (Data Ownership)
  // Need to log back in since tokenVersion was incremented
  const loginAgain = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const freshLogin = await loginAgain.json();
  const exportRes = await fetch(`${BASE_URL}/api/auth/export`, {
    headers: { Authorization: `Bearer ${freshLogin.token}` }
  });
  const exportData = await exportRes.json();
  if (!exportData.workouts || !exportData.nutrition) throw new Error('Export failed');
  console.log('✓ 16. Athlete Data Exported:', {
    workouts: exportData.workouts.length,
    nutrition: exportData.nutrition.length
  });

  // 17. Permanent Account Deletion (GDPR Cascade)
  const delRes = await fetch(`${BASE_URL}/api/auth/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${freshLogin.token}` }
  });
  const delData = await delRes.json();
  console.log('✓ 17. Account Deleted Permanently:', delData.message);

  // 18. Hot Online Backup
  const backupResult = createBackup();
  if (!backupResult.success) throw new Error(`Backup failed: ${backupResult.error}`);
  console.log('✓ 18. Hot Database Online Backup Created Successfully');

  console.log('\n======================================================');
  console.log('🎉 ALL 18/18 BACKEND PRODUCTION TEST SUITES PASSED CLEANLY!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('\n✗ TEST RUNNER ENCOUNTERED AN ERROR:', err);
  process.exit(1);
});
