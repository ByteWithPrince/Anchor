import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../services/db';
import { authService } from '../services/authService';
import { WORKOUT_PRESETS } from '../data/workoutPresets';

export const getTodayStr = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const createDefaultUserData = (targetCalories = 2500) => {
  const defaultSchedule = {
    0: { isRest: true, name: "Rest", exercises: [] },
    1: { isRest: false, name: "Push", exercises: [ { id: "1", name: "Bench Press", sets: 3, reps: 8, weight: "" }, { id: "2", name: "Incline Dumbbell Press", sets: 3, reps: 10, weight: "" }, { id: "3", name: "Tricep Pushdown", sets: 3, reps: 12, weight: "" } ] },
    2: { isRest: false, name: "Pull", exercises: [ { id: "4", name: "Pull-ups", sets: 3, reps: 8, weight: "" }, { id: "5", name: "Barbell Row", sets: 3, reps: 10, weight: "" } ] },
    3: { isRest: false, name: "Legs", exercises: [ { id: "6", name: "Squats", sets: 3, reps: 8, weight: "" } ] },
    4: { isRest: true, name: "Rest", exercises: [] },
    5: { isRest: false, name: "Upper", exercises: [ { id: "7", name: "Overhead Press", sets: 3, reps: 8, weight: "" } ] },
    6: { isRest: false, name: "Lower", exercises: [ { id: "8", name: "Deadlift", sets: 1, reps: 5, weight: "" } ] }
  };

  return {
    workoutLogs: [],
    foodLogs: [],
    weightLogs: [],
    sleepLogs: [],
    cardioLogs: [],
    heartRateLogs: [],
    activeWorkout: null,
    customRoutines: [
      {
        id: 'routine-starter-1',
        name: 'Upper Body Power',
        description: 'Compound push and pull movements',
        exercises: [
          { id: 'u-1', name: 'Bench Press', sets: 4, reps: 8, weight: '' },
          { id: 'u-2', name: 'Barbell Row', sets: 4, reps: 8, weight: '' },
          { id: 'u-3', name: 'Overhead Press', sets: 3, reps: 10, weight: '' }
        ]
      }
    ],
    activePresetId: 'ppl-6day',
    lastCompletedRoutineName: null,
    plan: {
      macroTargets: { calories: Number(targetCalories) || 2500, protein: 160, carbs: 280, fat: 75 },
      schedule: defaultSchedule
    }
  };
};

export const useStore = create(
  persist(
    (set, get) => ({
      isSetupComplete: true,
      activeWorkout: null,
      
      plan: {
        macroTargets: { calories: 2500, protein: 150, carbs: 300, fat: 80 },
        schedule: {
          0: { isRest: true, name: "Rest", exercises: [] },
          1: { isRest: false, name: "Push", exercises: [ { id: "1", name: "Bench Press", sets: 3, reps: 8, weight: "" }, { id: "2", name: "Incline Dumbbell Press", sets: 3, reps: 10, weight: "" }, { id: "3", name: "Tricep Pushdown", sets: 3, reps: 12, weight: "" } ] },
          2: { isRest: false, name: "Pull", exercises: [ { id: "4", name: "Pull-ups", sets: 3, reps: 8, weight: "" }, { id: "5", name: "Barbell Row", sets: 3, reps: 10, weight: "" } ] },
          3: { isRest: false, name: "Legs", exercises: [ { id: "6", name: "Squats", sets: 3, reps: 8, weight: "" } ] },
          4: { isRest: true, name: "Rest", exercises: [] },
          5: { isRest: false, name: "Upper", exercises: [ { id: "7", name: "Overhead Press", sets: 3, reps: 8, weight: "" } ] },
          6: { isRest: false, name: "Lower", exercises: [ { id: "8", name: "Deadlift", sets: 1, reps: 5, weight: "" } ] }
        }
      },
      workoutLogs: [],
      foodLogs: [],
      weightLogs: [],
      sleepLogs: [],
      cardioLogs: [],
      heartRateLogs: [],

      // Custom Routines Library & Progression Tracking
      customRoutines: [
        {
          id: 'routine-default-1',
          name: 'Chest & Arms Hypertrophy',
          description: 'Upper body pushing & bicep/tricep supersets',
          exercises: [
            { id: 'c-1', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '' },
            { id: 'c-2', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '' },
            { id: 'c-3', name: 'Dips', sets: 3, reps: 10, weight: '' },
            { id: 'c-4', name: 'Barbell Bicep Curl', sets: 3, reps: 10, weight: '' },
            { id: 'c-5', name: 'Tricep Rope Pushdown', sets: 3, reps: 12, weight: '' }
          ]
        },
        {
          id: 'routine-default-2',
          name: 'Quick 25-Min Dumbbell Blitz',
          description: 'High-density compound full-body circuit with dumbbells',
          exercises: [
            { id: 'c-6', name: 'Dumbbell Walking Lunge', sets: 3, reps: 10, weight: '' },
            { id: 'c-7', name: 'Dumbbell Flat Bench Press', sets: 3, reps: 10, weight: '' },
            { id: 'c-8', name: 'Dumbbell Bent-Over Row', sets: 3, reps: 10, weight: '' },
            { id: 'c-9', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '' }
          ]
        }
      ],
      activePresetId: 'ppl-6day',
      lastCompletedRoutineName: null,

      // Multi-User Profile State
      profiles: [
        {
          id: 'user-1',
          name: 'Kalendra (Athlete)',
          role: 'Hypertrophy & Strength',
          weight: 72,
          targetCalories: 2500,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
        },
        {
          id: 'user-2',
          name: 'Alex Rivera',
          role: 'Hybrid Athlete',
          weight: 82,
          targetCalories: 2900,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
        }
      ],
      activeProfileId: 'user-1',
      userDataByProfile: {},

      // Cloud Authentication State
      currentUser: authService.getStoredUser(),
      authToken: authService.getToken(),
      isCloudSyncing: false,
      lastSyncTime: null,

      persistCurrentUserData: () => {
        const state = get();
        const profileId = state.activeProfileId || state.currentUser?.id || 'user-1';
        const snapshot = {
          workoutLogs: state.workoutLogs,
          foodLogs: state.foodLogs,
          weightLogs: state.weightLogs,
          sleepLogs: state.sleepLogs,
          cardioLogs: state.cardioLogs,
          heartRateLogs: state.heartRateLogs || [],
          customRoutines: state.customRoutines || [],
          activePresetId: state.activePresetId,
          lastCompletedRoutineName: state.lastCompletedRoutineName,
          plan: state.plan
        };

        set({
          userDataByProfile: {
            ...state.userDataByProfile,
            [profileId]: snapshot
          }
        });

        if (state.authToken && state.currentUser && !state.currentUser.isGuest) {
          authService.syncToCloud(snapshot).catch(err => console.warn('Auto-sync notice:', err));
        }
      },

      loginUser: async (email, password) => {
        const { token, user } = await authService.login(email, password);
        const state = get();

        // 1. Snapshot prior profile if any
        if (state.activeProfileId && state.activeProfileId !== user.id) {
          state.persistCurrentUserData();
        }

        // 2. Fetch remote cloud data
        let userDataToLoad = null;
        try {
          const remote = await authService.fetchFromCloud();
          if (remote && remote.data) {
            userDataToLoad = remote.data;
          }
        } catch (e) {
          console.warn('Cloud sync fetch on login failed:', e);
        }

        // 3. Fallback to local snapshot or clean defaults
        if (!userDataToLoad) {
          userDataToLoad = state.userDataByProfile[user.id] || createDefaultUserData(2500);
          authService.syncToCloud(userDataToLoad).catch(() => {});
        }

        const userProfile = {
          id: user.id,
          name: user.name,
          role: user.role || 'Athlete',
          email: user.email,
          weight: 75,
          targetCalories: Number(userDataToLoad.plan?.macroTargets?.calories) || 2500,
          avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
        };

        set({
          authToken: token,
          currentUser: user,
          activeProfileId: user.id,
          profiles: [...state.profiles.filter(p => p.id !== user.id), userProfile],
          userDataByProfile: {
            ...state.userDataByProfile,
            [user.id]: userDataToLoad
          },
          workoutLogs: userDataToLoad.workoutLogs || [],
          foodLogs: userDataToLoad.foodLogs || [],
          weightLogs: userDataToLoad.weightLogs || [],
          sleepLogs: userDataToLoad.sleepLogs || [],
          cardioLogs: userDataToLoad.cardioLogs || [],
          heartRateLogs: userDataToLoad.heartRateLogs || [],
          customRoutines: userDataToLoad.customRoutines || [],
          activePresetId: userDataToLoad.activePresetId || 'ppl-6day',
          lastCompletedRoutineName: userDataToLoad.lastCompletedRoutineName || null,
          plan: userDataToLoad.plan || createDefaultUserData().plan,
          activeWorkout: null,
          isSetupComplete: true
        });

        return user;
      },

      registerUser: async (email, password, name, role) => {
        const { token, user } = await authService.register(email, password, name, role);
        const state = get();

        // 1. Snapshot prior state if any
        if (state.activeProfileId) {
          state.persistCurrentUserData();
        }

        // 2. Initialize a brand-new, clean user state
        const cleanData = createDefaultUserData(2500);

        const newProfile = {
          id: user.id,
          name: user.name,
          role: user.role || 'Athlete',
          email: user.email,
          weight: 75,
          targetCalories: 2500,
          avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
        };

        set({
          authToken: token,
          currentUser: user,
          activeProfileId: user.id,
          profiles: [...state.profiles.filter(p => p.id !== user.id), newProfile],
          userDataByProfile: {
            ...state.userDataByProfile,
            [user.id]: cleanData
          },
          isSetupComplete: true,
          ...cleanData
        });

        // 3. Push fresh clean state to cloud
        await authService.syncToCloud(cleanData);
        return user;
      },

      loginGuest: () => {
        const guestId = 'guest-athlete';
        const guestUser = {
          id: guestId,
          email: 'guest@anchor.local',
          name: 'Guest Athlete',
          role: 'Strength & Hypertrophy',
          isGuest: true,
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GuestAthlete'
        };

        authService.setToken('guest-offline-token');
        authService.setStoredUser(guestUser);

        const state = get();
        const existingData = state.userDataByProfile[guestId] || createDefaultUserData(2500);

        const guestProfile = {
          id: guestId,
          name: 'Guest Athlete',
          role: 'Strength & Hypertrophy',
          email: 'guest@anchor.local',
          weight: 75,
          targetCalories: 2500,
          avatar: guestUser.avatar
        };

        set({
          authToken: 'guest-offline-token',
          currentUser: guestUser,
          activeProfileId: guestId,
          profiles: [...state.profiles.filter(p => p.id !== guestId), guestProfile],
          userDataByProfile: {
            ...state.userDataByProfile,
            [guestId]: existingData
          },
          workoutLogs: existingData.workoutLogs || [],
          foodLogs: existingData.foodLogs || [],
          weightLogs: existingData.weightLogs || [],
          sleepLogs: existingData.sleepLogs || [],
          cardioLogs: existingData.cardioLogs || [],
          heartRateLogs: existingData.heartRateLogs || [],
          customRoutines: existingData.customRoutines || [],
          activePresetId: existingData.activePresetId || 'ppl-6day',
          lastCompletedRoutineName: existingData.lastCompletedRoutineName || null,
          plan: existingData.plan || createDefaultUserData().plan,
          activeWorkout: null,
          isSetupComplete: true
        });

        return guestUser;
      },

      logoutUser: () => {
        const state = get();
        if (state.activeProfileId) {
          state.persistCurrentUserData();
        }
        authService.clearAuth();
        set({
          authToken: null,
          currentUser: null,
          activeWorkout: null
        });
      },

      syncWithCloud: async () => {
        const state = get();
        if (!state.authToken || state.currentUser?.isGuest) return { success: false, reason: 'unauthenticated' };
        set({ isCloudSyncing: true });
        try {
          // Prepare local mutations
          const mutations = {
            workouts: state.workoutLogs,
            nutrition: state.foodLogs,
            routines: state.customRoutines || [],
            plan: state.plan,
            bodyweight: (state.weightLogs || []).map(w => ({ date: w.date, weight: w.weight }))
          };

          const deltaRes = await authService.syncDelta(state.lastSyncTime || 0, mutations);

          if (deltaRes && deltaRes.success && deltaRes.delta) {
            const { workouts = [], nutrition = [], routines = [], plan = null, bodyweight = [] } = deltaRes.delta;

            // 1. Merge workouts
            let mergedWorkouts = [...state.workoutLogs];
            for (const s of workouts) {
              if (s.deleted) {
                mergedWorkouts = mergedWorkouts.filter(w => w.id !== s.id);
              } else {
                const idx = mergedWorkouts.findIndex(w => w.id === s.id);
                if (idx >= 0) mergedWorkouts[idx] = { ...mergedWorkouts[idx], ...s };
                else mergedWorkouts.unshift(s);
              }
            }

            // 2. Merge nutrition
            let mergedNutrition = [...state.foodLogs];
            for (const f of nutrition) {
              if (f.deleted) {
                mergedNutrition = mergedNutrition.filter(food => food.id !== f.id);
              } else {
                const idx = mergedNutrition.findIndex(food => food.id === f.id);
                if (idx >= 0) mergedNutrition[idx] = { ...mergedNutrition[idx], ...f };
                else mergedNutrition.unshift(f);
              }
            }

            // 3. Merge routines
            let mergedRoutines = [...(state.customRoutines || [])];
            for (const r of routines) {
              if (r.deleted) {
                mergedRoutines = mergedRoutines.filter(rtn => rtn.id !== r.id);
              } else {
                const idx = mergedRoutines.findIndex(rtn => rtn.id === r.id);
                if (idx >= 0) mergedRoutines[idx] = { ...mergedRoutines[idx], ...r };
                else mergedRoutines.push(r);
              }
            }

            // 4. Merge plan
            const updatedPlan = plan ? { ...state.plan, ...plan } : state.plan;

            set({
              workoutLogs: mergedWorkouts,
              foodLogs: mergedNutrition,
              customRoutines: mergedRoutines,
              plan: updatedPlan,
              lastSyncTime: deltaRes.serverTime || Date.now()
            });

            // Also push legacy snapshot in background for backward compatibility
            authService.syncToCloud({
              workoutLogs: mergedWorkouts,
              foodLogs: mergedNutrition,
              weightLogs: state.weightLogs,
              sleepLogs: state.sleepLogs,
              cardioLogs: state.cardioLogs,
              heartRateLogs: state.heartRateLogs || [],
              customRoutines: mergedRoutines,
              activePresetId: state.activePresetId,
              lastCompletedRoutineName: state.lastCompletedRoutineName,
              plan: updatedPlan
            }).catch(() => {});

            return { success: true, deltaSync: true };
          }

          // Fallback to legacy sync if delta wasn't supported
          const remote = await authService.fetchFromCloud();
          if (remote && remote.data) {
            set({
              workoutLogs: remote.data.workoutLogs !== undefined ? remote.data.workoutLogs : state.workoutLogs,
              foodLogs: remote.data.foodLogs !== undefined ? remote.data.foodLogs : state.foodLogs,
              weightLogs: remote.data.weightLogs !== undefined ? remote.data.weightLogs : state.weightLogs,
              sleepLogs: remote.data.sleepLogs !== undefined ? remote.data.sleepLogs : state.sleepLogs,
              cardioLogs: remote.data.cardioLogs !== undefined ? remote.data.cardioLogs : state.cardioLogs,
              heartRateLogs: remote.data.heartRateLogs !== undefined ? remote.data.heartRateLogs : state.heartRateLogs || [],
              customRoutines: remote.data.customRoutines !== undefined ? remote.data.customRoutines : state.customRoutines || [],
              activePresetId: remote.data.activePresetId || state.activePresetId,
              lastCompletedRoutineName: remote.data.lastCompletedRoutineName !== undefined ? remote.data.lastCompletedRoutineName : state.lastCompletedRoutineName,
              plan: remote.data.plan || state.plan,
              lastSyncTime: Date.now()
            });
            return { success: true, pulled: true };
          }
          return { success: true };
        } catch (e) {
          console.warn('Sync failed:', e);
          return { success: false, error: e.message };
        } finally {
          set({ isCloudSyncing: false });
        }
      },

      getActiveProfile: () => {
        const state = get();
        return state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0];
      },

      switchProfile: (newProfileId) => {
        const state = get();
        if (state.activeProfileId === newProfileId) return;

        // 1. Snapshot current profile data
        const currentSnapshot = {
          workoutLogs: state.workoutLogs,
          foodLogs: state.foodLogs,
          weightLogs: state.weightLogs,
          sleepLogs: state.sleepLogs,
          cardioLogs: state.cardioLogs,
          heartRateLogs: state.heartRateLogs || [],
          customRoutines: state.customRoutines || [],
          activePresetId: state.activePresetId,
          lastCompletedRoutineName: state.lastCompletedRoutineName,
          plan: state.plan
        };

        const updatedUserData = {
          ...state.userDataByProfile,
          [state.activeProfileId]: currentSnapshot
        };

        // 2. Load target profile data or initialize clean defaults
        const targetData = updatedUserData[newProfileId] || createDefaultUserData(2500);

        set({
          activeProfileId: newProfileId,
          userDataByProfile: updatedUserData,
          workoutLogs: targetData.workoutLogs || [],
          foodLogs: targetData.foodLogs || [],
          weightLogs: targetData.weightLogs || [],
          sleepLogs: targetData.sleepLogs || [],
          cardioLogs: targetData.cardioLogs || [],
          heartRateLogs: targetData.heartRateLogs || [],
          customRoutines: targetData.customRoutines || [],
          activePresetId: targetData.activePresetId || 'ppl-6day',
          lastCompletedRoutineName: targetData.lastCompletedRoutineName || null,
          plan: targetData.plan || createDefaultUserData().plan,
          activeWorkout: null
        });
      },

      createProfile: ({ name, role = 'Athlete', weight = 70, targetCalories = 2400 }) => {
        const newId = `user-${Date.now()}`;
        const newProfile = {
          id: newId,
          name,
          role,
          weight: Number(weight),
          targetCalories: Number(targetCalories),
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
        };

        set(state => ({
          profiles: [...state.profiles, newProfile]
        }));

        get().switchProfile(newId);
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          profiles: state.profiles,
          activeProfileId: state.activeProfileId,
          userDataByProfile: state.userDataByProfile,
          current: {
            workoutLogs: state.workoutLogs,
            foodLogs: state.foodLogs,
            weightLogs: state.weightLogs,
            plan: state.plan
          }
        }, null, 2);
      },
      
      completeSetup: () => set({ isSetupComplete: true }),
      
      updatePlan: (newPlan) => {
        set({ plan: { ...get().plan, ...newPlan } });
        get().persistCurrentUserData();
      },

      applyPresetPlan: (presetId) => {
        const preset = WORKOUT_PRESETS.find(p => p.id === presetId);
        if (!preset) return false;
        set(state => ({
          activePresetId: presetId,
          plan: {
            ...state.plan,
            schedule: JSON.parse(JSON.stringify(preset.schedule))
          }
        }));
        get().persistCurrentUserData();
        return true;
      },

      addCustomRoutine: ({ name, exercises, description = '' }) => {
        const newRoutine = {
          id: `routine-${Date.now()}`,
          name: name.trim(),
          description: description.trim(),
          exercises: exercises || [],
          createdAt: Date.now()
        };
        set(state => ({
          customRoutines: [...(state.customRoutines || []), newRoutine]
        }));
        get().persistCurrentUserData();
        return newRoutine;
      },

      updateCustomRoutine: (id, updatedData) => {
        set(state => ({
          customRoutines: (state.customRoutines || []).map(r => r.id === id ? { ...r, ...updatedData } : r)
        }));
        get().persistCurrentUserData();
      },

      deleteCustomRoutine: (id) => {
        set(state => ({
          customRoutines: (state.customRoutines || []).filter(r => r.id !== id)
        }));
        get().persistCurrentUserData();
      },

      saveWorkoutAsRoutine: (name, exercises, description = 'Custom saved routine') => {
        const formattedExercises = (exercises || []).map(ex => ({
          id: crypto.randomUUID(),
          name: ex.name,
          sets: ex.sets?.length || 3,
          reps: ex.sets?.[0]?.reps || 10,
          weight: ex.sets?.[0]?.weight || ''
        }));
        return get().addCustomRoutine({ name, exercises: formattedExercises, description });
      },
      
      startWorkout: (workoutName, plannedExercises) => {
        const sessionExercises = (plannedExercises || []).map(ex => {
          const prevSets = get().getPreviousPerformance(ex.name);
          return {
            name: ex.name,
            sets: Array.from({ length: Number(ex.sets) || 3 }).map((_, i) => ({
              weight: prevSets && prevSets[i] ? prevSets[i].weight : (ex.weight || ""),
              reps: prevSets && prevSets[i] ? prevSets[i].reps : (ex.reps || 10),
              completed: false
            }))
          };
        });
        
        set({
          activeWorkout: {
            date: getTodayStr(),
            name: workoutName,
            exercises: sessionExercises,
            startTime: Date.now()
          }
        });
      },

      startBlankWorkout: (workoutName = 'Quick Strength Session') => {
        set({
          activeWorkout: {
            date: getTodayStr(),
            name: workoutName,
            exercises: [],
            startTime: Date.now()
          }
        });
      },

      addExerciseToActiveWorkout: ({ name, sets = 3, reps = 10, weight = '' }) => set(state => {
        if (!state.activeWorkout) return {};
        const prevSets = get().getPreviousPerformance(name);
        const newSets = Array.from({ length: Number(sets) || 3 }).map((_, i) => ({
          weight: prevSets && prevSets[i] ? prevSets[i].weight : (weight || ''),
          reps: prevSets && prevSets[i] ? prevSets[i].reps : (reps || 10),
          completed: false
        }));
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: [
              ...state.activeWorkout.exercises,
              { name, sets: newSets }
            ]
          }
        };
      }),

      removeExerciseFromActiveWorkout: (exIndex) => set(state => {
        if (!state.activeWorkout) return {};
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: state.activeWorkout.exercises.filter((_, i) => i !== exIndex)
          }
        };
      }),

      addSetToActiveWorkoutExercise: (exIndex) => set(state => {
        if (!state.activeWorkout) return {};
        const targetEx = state.activeWorkout.exercises[exIndex];
        if (!targetEx) return {};
        const lastSet = targetEx.sets[targetEx.sets.length - 1];
        const newSet = {
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : 10,
          completed: false
        };
        const updatedExercises = state.activeWorkout.exercises.map((ex, i) => {
          if (i !== exIndex) return ex;
          return { ...ex, sets: [...ex.sets, newSet] };
        });
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises
          }
        };
      }),

      removeSetFromActiveWorkoutExercise: (exIndex, setIndex) => set(state => {
        if (!state.activeWorkout) return {};
        const targetEx = state.activeWorkout.exercises[exIndex];
        if (!targetEx || targetEx.sets.length <= 1) return {};
        const updatedExercises = state.activeWorkout.exercises.map((ex, i) => {
          if (i !== exIndex) return ex;
          return { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) };
        });
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises
          }
        };
      }),

      getNextRoutineInSplit: () => {
        const state = get();
        const schedule = state.plan?.schedule || {};
        const trainingDays = Object.entries(schedule)
          .filter(([, d]) => !d.isRest && d.exercises && d.exercises.length > 0)
          .map(([dayIdx, d]) => ({ dayIdx: Number(dayIdx), ...d }));

        if (trainingDays.length === 0) return null;

        // If we have a lastCompletedRoutineName, find the next one in sequence
        if (state.lastCompletedRoutineName) {
          const lastIdx = trainingDays.findIndex(d => d.name === state.lastCompletedRoutineName);
          if (lastIdx !== -1) {
            const nextIdx = (lastIdx + 1) % trainingDays.length;
            return trainingDays[nextIdx];
          }
        }

        // Default to today's workout if non-rest, else first non-rest day
        const todayDay = new Date().getDay();
        const todayMatch = trainingDays.find(d => d.dayIdx === todayDay);
        if (todayMatch) return todayMatch;

        return trainingDays[0];
      },
      
      updateActiveWorkout: (exercises) => set((state) => ({
        activeWorkout: state.activeWorkout ? { ...state.activeWorkout, exercises } : null
      })),
      
      finishActiveWorkout: () => {
        set((state) => {
          if (!state.activeWorkout) return {};
          
          let sessionToSave = state.activeWorkout.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets.filter(s => s.completed)
          })).filter(ex => ex.sets.length > 0);
          
          // If no individual sets were checked, treat all sets as completed so the workout is never discarded
          if (sessionToSave.length === 0 && state.activeWorkout.exercises.length > 0) {
            sessionToSave = state.activeWorkout.exercises.map(ex => ({
              name: ex.name,
              sets: ex.sets.map(s => ({ ...s, completed: true }))
            }));
          }
          
          if (sessionToSave.length === 0) {
            return { activeWorkout: null }; // discard truly empty workout (0 exercises)
          }
          
          const totalPlannedSets = state.activeWorkout.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
          const totalCompletedSets = sessionToSave.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
          const endTime = Date.now();
          const duration = Math.max(1, Math.round((endTime - state.activeWorkout.startTime) / 60000)); // in minutes
          const workoutName = state.activeWorkout.name;

          return {
            workoutLogs: [
              ...state.workoutLogs,
              {
                id: crypto.randomUUID(),
                date: getTodayStr(),
                name: workoutName,
                exercises: sessionToSave,
                totalPlannedSets: Math.max(totalPlannedSets, totalCompletedSets),
                totalCompletedSets,
                startTime: state.activeWorkout.startTime,
                endTime,
                duration,
                timestamp: Date.now()
              }
            ],
            activeWorkout: null,
            lastCompletedRoutineName: workoutName
          };
        });
        get().persistCurrentUserData();
      },
      
      addWorkoutSession: (name, exercises) => {
        set((state) => ({
          workoutLogs: [
            ...state.workoutLogs,
            {
              id: crypto.randomUUID(),
              date: getTodayStr(),
              name,
              exercises,
              timestamp: Date.now()
            }
          ]
        }));
        get().persistCurrentUserData();
      },
      
      addFoodLog: (foodData) => {
        set((state) => ({
          foodLogs: [
            ...state.foodLogs,
            {
              id: crypto.randomUUID(),
              date: getTodayStr(),
              ...foodData,
              timestamp: Date.now()
            }
          ]
        }));
        get().persistCurrentUserData();
      },
      
      addWeightLog: (weight, date = getTodayStr()) => {
        set((state) => {
          const exists = state.weightLogs.find(w => w.date === date);
          if (exists) {
            return { weightLogs: state.weightLogs.map(w => w.date === date ? { ...w, weight } : w) };
          }
          return {
            weightLogs: [
              ...state.weightLogs,
              { id: crypto.randomUUID(), date, weight, timestamp: Date.now() }
            ]
          };
        });
        get().persistCurrentUserData();
      },
      
      deleteFoodLog: (id) => {
        set((state) => ({
          foodLogs: state.foodLogs.filter(log => log.id !== id)
        }));
        get().persistCurrentUserData();
      },
      
      deleteWorkoutLog: (id) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.filter(log => log.id !== id)
        }));
        get().persistCurrentUserData();
      },

      addSleepLog: (hours, date = getTodayStr()) => {
        set((state) => {
          const existing = state.sleepLogs.find(s => s.date === date);
          if (existing) {
            return { sleepLogs: state.sleepLogs.map(s => s.date === date ? { ...s, hours: Number(hours) } : s) };
          }
          return {
            sleepLogs: [
              ...state.sleepLogs,
              { id: crypto.randomUUID(), date, hours: Number(hours), timestamp: Date.now() }
            ]
          };
        });
        get().persistCurrentUserData();
      },

      addCardioLog: (distanceKm, durationMin = 30, date = getTodayStr()) => {
        set((state) => ({
          cardioLogs: [
            ...state.cardioLogs,
            { id: crypto.randomUUID(), date, distanceKm: Number(distanceKm), durationMin: Number(durationMin), timestamp: Date.now() }
          ]
        }));
        get().persistCurrentUserData();
      },

      addHeartRateLog: (bpm, date = getTodayStr()) => {
        set((state) => {
          const existing = (state.heartRateLogs || []).find(h => h.date === date);
          if (existing) {
            return { heartRateLogs: state.heartRateLogs.map(h => h.date === date ? { ...h, bpm: Number(bpm), timestamp: Date.now() } : h) };
          }
          return {
            heartRateLogs: [
              ...(state.heartRateLogs || []),
              { id: crypto.randomUUID(), date, bpm: Number(bpm), timestamp: Date.now() }
            ]
          };
        });
        get().persistCurrentUserData();
      },

      getTodaySleep: () => {
        const todayLog = get().sleepLogs.find(s => s.date === getTodayStr());
        return todayLog ? todayLog.hours : null;
      },

      getTodayDistance: () => {
        const todayLogs = get().cardioLogs.filter(c => c.date === getTodayStr());
        return todayLogs.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0);
      },

      getMonthlyDistance: (yearMonth = null) => {
        const targetPrefix = yearMonth || getTodayStr().slice(0, 7);
        const logs = get().cardioLogs.filter(c => c.date && c.date.startsWith(targetPrefix));
        const total = logs.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0);
        return Number(total.toFixed(2));
      },

      getWeeklyDistance: () => {
        const state = get();
        const today = new Date();
        let total = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const dayLogs = state.cardioLogs.filter(c => c.date === dateStr);
          total += dayLogs.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0);
        }
        return Number(total.toFixed(2));
      },

      getTodayHeartRate: () => {
        const state = get();
        const todayLog = (state.heartRateLogs || []).find(h => h.date === getTodayStr());
        if (todayLog) return todayLog.bpm;
        if (state.activeWorkout?.date === getTodayStr()) return 124;
        return null;
      },

      getWeeklyWorkoutActivity: () => {
        const state = get();
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const todayDayIdx = today.getDay();
        const todayStr = getTodayStr();

        const currentSunday = new Date(today);
        currentSunday.setDate(today.getDate() - todayDayIdx);

        const weekData = [];
        let maxVolume = 1;

        for (let i = 0; i < 7; i++) {
          const d = new Date(currentSunday);
          d.setDate(currentSunday.getDate() + i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const dayName = daysOfWeek[d.getDay()];
          const isToday = dateStr === todayStr;

          const sessions = state.workoutLogs.filter(w => w.date === dateStr);
          let totalVolume = 0;
          let totalSets = 0;

          for (const s of sessions) {
            if (s.exercises) {
              for (const ex of s.exercises) {
                if (ex.sets) {
                  for (const setItem of ex.sets) {
                    if (setItem.completed !== false) {
                      totalSets++;
                      const w = Number(setItem.weight) || 0;
                      const r = Number(setItem.reps) || 0;
                      totalVolume += (w > 0 ? w : 20) * (r > 0 ? r : 1);
                    }
                  }
                }
              }
            }
          }

          if (isToday && state.activeWorkout?.date === todayStr && state.activeWorkout.exercises) {
            for (const ex of state.activeWorkout.exercises) {
              if (ex.sets) {
                for (const setItem of ex.sets) {
                  if (setItem.completed) {
                    totalSets++;
                    const w = Number(setItem.weight) || 0;
                    const r = Number(setItem.reps) || 0;
                    totalVolume += (w > 0 ? w : 20) * (r > 0 ? r : 1);
                  }
                }
              }
            }
          }

          if (totalVolume > maxVolume) maxVolume = totalVolume;

          weekData.push({
            day: dayName,
            date: dateStr,
            isToday,
            volume: totalVolume,
            sets: totalSets,
            sessionCount: sessions.length
          });
        }

        return weekData.map(d => {
          const pct = d.volume > 0 ? Math.max(20, Math.min(100, Math.round((d.volume / maxVolume) * 100))) : (d.sessionCount > 0 ? 30 : 0);
          return {
            ...d,
            pct,
            isActive: d.isToday,
            value: d.sets > 0 ? `${d.sets} sets` : (d.sessionCount > 0 ? 'Logged' : 'Rest')
          };
        });
      },

      getWeekOverWeekChange: () => {
        const state = get();
        const today = new Date();

        let thisWeekVol = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const sessions = state.workoutLogs.filter(w => w.date === dateStr);
          for (const s of sessions) {
            if (s.exercises) {
              for (const ex of s.exercises) {
                if (ex.sets) {
                  for (const setItem of ex.sets) {
                    thisWeekVol += (Number(setItem.weight) || 1) * (Number(setItem.reps) || 1);
                  }
                }
              }
            }
          }
        }

        let priorWeekVol = 0;
        for (let i = 7; i < 14; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const sessions = state.workoutLogs.filter(w => w.date === dateStr);
          for (const s of sessions) {
            if (s.exercises) {
              for (const ex of s.exercises) {
                if (ex.sets) {
                  for (const setItem of ex.sets) {
                    priorWeekVol += (Number(setItem.weight) || 1) * (Number(setItem.reps) || 1);
                  }
                }
              }
            }
          }
        }

        if (priorWeekVol === 0) {
          return thisWeekVol > 0 ? { changePct: 100, isPositive: true, raw: '+100%' } : { changePct: 0, isPositive: true, raw: '0%' };
        }

        const delta = thisWeekVol - priorWeekVol;
        const pct = Math.round((delta / priorWeekVol) * 100);
        return {
          changePct: Math.abs(pct),
          isPositive: pct >= 0,
          raw: `${pct >= 0 ? '+' : ''}${pct}%`
        };
      },

      getHealthScore: () => {
        const state = get();
        const todayStr = getTodayStr();
        const todayFoods = state.foodLogs.filter(f => f.date === todayStr);
        const targetCals = Number(state.plan?.macroTargets?.calories) || 2000;
        const consumedCals = todayFoods.reduce((acc, f) => acc + (Number(f.calories) || 0), 0);
        
        // 1. Nutrition Score (max 45)
        let nutritionScore = 0;
        if (consumedCals > 0) {
          const calRatio = consumedCals / targetCals;
          if (calRatio >= 0.85 && calRatio <= 1.15) {
            nutritionScore = 45;
          } else if (calRatio >= 0.7 && calRatio <= 1.3) {
            nutritionScore = 35;
          } else {
            nutritionScore = 20;
          }
        }

        // 2. Workout Score (max 40)
        let workoutScore = 0;
        const dayIdx = new Date().getDay();
        const todayPlan = state.plan?.schedule?.[dayIdx];
        const isRest = todayPlan?.isRest;
        const session = state.workoutLogs.find(w => w.date === todayStr);
        const active = state.activeWorkout?.date === todayStr;

        if (session) {
          workoutScore = 40;
        } else if (active) {
          workoutScore = 25;
        } else if (isRest) {
          workoutScore = consumedCals > 0 ? 35 : 0;
        }

        // 3. Sleep & Recovery Score (max 15)
        const sleepHours = state.getTodaySleep();
        let sleepScore = 0;
        if (sleepHours !== null && sleepHours !== undefined) {
          if (sleepHours >= 7 && sleepHours <= 9) {
            sleepScore = 15;
          } else if (sleepHours >= 6) {
            sleepScore = 11;
          } else {
            sleepScore = 6;
          }
        }

        const totalRaw = nutritionScore + workoutScore + sleepScore;
        return Math.min(100, Math.round(totalRaw));
      },

      getTodayFoodLogs: () => get().foodLogs.filter(log => log.date === getTodayStr()),
      getTodayWorkoutSession: () => {
        const todayLogs = get().workoutLogs.filter(log => log.date === getTodayStr());
        return todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : null;
      },
      getTodayWorkoutSessions: () => get().workoutLogs.filter(log => log.date === getTodayStr()),
      
      getAllTimePR: (exerciseName) => {
        if (!exerciseName) return 0;
        const target = exerciseName.toLowerCase().trim();
        let maxWeight = 0;
        for (const session of get().workoutLogs) {
          const ex = session.exercises.find(e => e.name?.toLowerCase().trim() === target);
          if (ex && ex.sets) {
            for (const s of ex.sets) {
              const w = Number(s.weight) || 0;
              if (w > maxWeight) maxWeight = w;
            }
          }
        }
        return maxWeight;
      },
      
      getPreviousPerformance: (exerciseName) => {
        if (!exerciseName) return null;
        const target = exerciseName.toLowerCase().trim();
        const logs = get().workoutLogs.sort((a, b) => b.timestamp - a.timestamp);
        for (const session of logs) {
          const ex = session.exercises.find(e => e.name?.toLowerCase().trim() === target);
          if (ex && ex.sets && ex.sets.length > 0) {
            return ex.sets;
          }
        }
        return null;
      },
      
      getRecentFoods: () => {
        const logs = [...get().foodLogs].sort((a, b) => b.timestamp - a.timestamp);
        const unique = [];
        const seen = new Set();
        for (const log of logs) {
          const key = log.name.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(log);
            if (unique.length === 5) break;
          }
        }
        return unique;
      }
    }),
    {
      name: 'anchor-storage-v3', // bumped for isSetupComplete and activeWorkout
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
