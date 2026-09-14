# Fitness Tracker App — Product Constitution (v1)

*Living document — update as we iterate. Never delete old sections, strike them through or move to "Later" instead.*

## 1. The Problem (Why This Exists)
People trying to track workouts + diet either:
- Use bloated apps (MyFitnessPal, etc.) that feel like homework, paywall core features, and don't adapt when life happens, OR
- Fall back to a plain notes app for max flexibility but zero structure, insights, or consistency.

Result: 71%+ of fitness app users quit within 3 months; day-30 retention industry-wide is only 3–8%. The gap isn't more features — it's friction and rigidity.

## 2. USP (One Sentence — Do Not Dilute)
**"The fastest way to log your day — workout, food, and progress — without ever feeling like homework."**

*Every feature decision gets tested against this line. If it slows logging down or adds visual noise, it doesn't belong in v1.*

## 3. Design Philosophy
- **Minimalism**: one screen = one job. Home screen shows only today. Everything else is one tap away, never competing for attention.
- **Immersiveness**: comes from motion/feedback (smooth transitions, subtle goal-hit animations), NOT from more UI elements or icons.
- **Progressive disclosure**: simple by default (quick log), powerful on demand (detailed graphs/macros hidden until tapped).
- **Palette discipline**: 2–3 colors max, generous whitespace, no decorative clutter.
- **Primary action per screen**: one bold CTA; everything else demoted to secondary text/links.

## 4. Feature Backlog (MoSCoW)
**Must-Have (v1 — build first, nothing else until these work end-to-end)**
- Quick workout logging: Sets/reps/weight, repeat-last-session shortcut
- Quick diet logging: Simple entry (not full barcode DB initially)
- Unified daily view: Workout + food + net calories in ONE screen — this IS the USP
- Custom plan builder: User defines their own split/macros — replaces the "notes folder" flexibility

**Should-Have (v1.1 — after Must-haves are validated with real users)**
- Progress trends: Weight, lift PRs, streaks over time
- Adaptive plan: Auto-adjusts after a missed day instead of guilt-tripping

**Could-Have (later delighters, only if core loop is proven sticky)**
- Lightweight sharing: Accountability with 1–2 friends, not a full social feed

**Won't-Have (v1 — explicitly parked, revisit only after v1 is stable)**
- Social feed / gamification badges
- Wearable device sync
- AI coach chatbot
- Exercise video library
- Anything that adds a second primary action to any screen

## 5. Success Metrics (How We'll Know It's Working)
- **Time-to-log**: under 15 seconds per workout/meal entry
- **Day-7 / Day-30 retention**: beat the industry's dismal 3–8% day-30 baseline
- **Plan adherence rate**: % of planned workouts/meals actually completed
- **Qualitative check-in**: weekly ask to testers — "did you open notes app for this instead this week?" (Yes = unmet feature, investigate)

## 6. Riskiest Assumption (Test This First, Nothing Else Matters Yet)
People will log daily habit data consistently if it takes under 15 seconds and feels calm — even with zero gamification or social pressure.

*v1's only real job is to prove or disprove this.*

## 7. Change Log
*Add an entry every time we alter scope, so we can see how the idea evolved.*

| Date | Change | Reason |
| :--- | :--- | :--- |
| 2026-08-08 | Initial constitution drafted | First planning pass |

## 8. Open Questions / Parking Lot
*Drop half-formed ideas here during vibe-coding sessions instead of building them immediately.*
*(add as they come up)*
