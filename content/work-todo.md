# Fit Check — Improvements & TODO

A comprehensive list of all suggested changes, improvements, and potential reworks across the entire project.

---

## 1. Active Workout — Core UX Improvements

This is the most critical screen in the app. It needs the most attention.

### Exercise reordering mid-workout
- Add drag-and-drop (or up/down buttons) to reorder exercises in the queue while a workout is in progress.
- Currently there is no way to change the order once started.

### Add exercises mid-workout
- Add a floating `+ Add Exercise` button on the active workout screen.
- Should open the same exercise picker used in the workout builder.
- Inserted exercises should be appended to the end of the circuit (or at a chosen position).

### Remove exercises mid-workout
- Allow swiping left or tapping a trash icon on an exercise in the queue to remove it.
- Should ask for confirmation before removing.

### Replace an exercise mid-workout
- Add a "swap exercise" option — useful when equipment is occupied at the gym.
- Opens exercise picker, pre-filtered to the same muscle group.

### Skip exercise
- Add a "Skip" button to jump to the next exercise without logging sets.
- Skipped exercises should still appear in the summary view (marked as skipped).

### Edit set count mid-workout
- Allow adding/removing sets from the current exercise during the workout.
- Currently the set count is fixed from the template.

### Superset support
- Allow grouping two or more exercises into a superset.
- The timer should alternate between the paired exercises with minimal rest between, then full rest after both.

### Circuit / AMRAP mode
- Add a timed circuit mode: complete all exercises in a circuit within a set window, tracking rounds.
- Add AMRAP (As Many Rounds As Possible) mode with a countdown clock.

### Previous set autofill
- When starting a new set, auto-populate weight and reps from the last logged set for that exercise.
- Currently values appear to reset between sets.

### Warm-up set flag
- Allow marking a set as a warm-up set (not counted toward volume/1RM tracking).

### RPE per set
- Add optional RPE (Rate of Perceived Exertion, 1–10) logging per set, not just per exercise.

### Better rest timer
- Add audio cue (beep/vibration) when rest timer expires.
- Allow quick adjustments to rest time from the timer screen (+ 15s / - 15s buttons).
- Allow saving a custom default rest time per exercise.
- Add option to disable rest timer entirely.

### Pause / Resume workout
- A proper pause button that freezes the workout clock without ending the session.

---

## 2. Workout Builder Improvements

### Template editing
- Allow editing saved templates (add/remove/reorder exercises, change default sets/reps).
- Currently templates appear read-only after creation.

### Template categories
- Organize templates into categories: Push/Pull/Legs, Full Body, Cardio, Mobility, etc.
- Add a search/filter bar in the template browser.

### Duplicate a template
- One-click option to clone an existing template and rename it.

### Workout naming
- Let the user name the workout before starting (not just after completing).
- Default to template name if one was selected.

### Scheduled workouts
- Allow assigning templates to days of the week (e.g., Monday = Push Day).
- Dashboard should show "Today's Planned Workout" based on the schedule.

### Superset builder
- In the workout builder, allow grouping exercises into supersets before starting.

---

## 3. Progress & Analytics Improvements

### Exercise-specific progress page
- Each exercise should have a dedicated stats page showing:
  - Best set (weight × reps)
  - Estimated 1RM trend over time
  - Volume per session trend
  - Total volume all time
  - Number of sessions performed

### Comparative analytics
- Compare current week vs. last week in terms of volume and frequency.
- Month-over-month PR tracking.

### Muscle group heatmap
- Replace or supplement the pie/bar chart with a body silhouette heatmap showing which muscles were trained most recently/most often.

### Volume by week / month view
- Toggle between weekly and monthly views on the volume chart.

### Workout frequency calendar
- GitHub-style contribution heatmap for workout frequency (currently exists as streak calendar — expand to show volume intensity as colour depth).

### Personal records table
- Full sortable/filterable table of all PRs, not just top 5.
- Show date achieved and workout where it happened.

### Plateau detection
- Notify the user when a lift hasn't improved in 3+ sessions (suggest deload or variation).

### Rest time analytics
- Track average rest times and flag if consistently going over logged rest.

---

## 4. Profile / Settings Improvements

### User profile setup
- Name, profile photo (avatar), and a short bio or goal statement.
- Currently there is no user identity at all.

### Goals system
- Let users set specific goals per exercise (e.g., "Bench press 100kg by June").
- Progress bars toward each goal on the profile page.
- Body composition goals (target weight, target body fat %).

### Notification preferences
- Daily workout reminder (PWA push notification or in-app reminder).
- Rest day reminders.
- Streak at-risk warning ("You haven't worked out in 2 days — streak is safe until midnight tonight").

### Theme switcher
- The app already has `theme-fitness.css` and `theme-luxury.css`. Expose these as a user-selectable option in settings.
- Add a light mode option.

### Import data
- Allow importing workout history from CSV or JSON (currently only export is supported).
- Import from popular apps: Strong, Hevy, JEFIT via their export formats.

### Delete account / data wipe
- Give users a clear way to delete all their data (GDPR compliance).

### Measurement preferences
- Expand beyond kg/lbs to also include:
  - Distance units (km / miles) for cardio
  - Height units (cm / ft+in) for BMI/body metrics

---

## 5. New Feature Ideas

### Nutrition logging (basic)
- Log daily calories and macros (protein, carbs, fat).
- Visualize caloric intake vs. expenditure trend.
- Even just a simple daily note field for food would be useful.

### Body measurements
- Track additional metrics beyond weight and body fat: waist, chest, arms, hips, thighs.
- Visualize each measurement over time.

### Water intake tracker
- Simple daily water goal with tap-to-increment logging.

### Workout notes / journal
- A free-text daily journal entry tied to each workout session.
- Separate from the per-exercise set notes.

### Social / sharing
- Generate a shareable workout summary card (image) to share on Instagram/Twitter.
- Show total volume, duration, and exercises completed.

### Personal trainer mode
- A coach can create and assign workouts to a client's account.
- Requires multi-user auth (see Architecture section).

### Exercise video library expansion
- Add more YouTube video links to exercises in `exercises.ts`.
- Many exercises currently have no `videoUrl` set.

### Warm-up routine generator
- Given the day's workout plan, auto-generate a 5-minute dynamic warm-up tailored to the target muscle groups.

---

## 6. Technical Debt & Architecture

### Authentication (most critical architectural gap)
- Currently the app has no login — it's single-user with anonymous Supabase access.
- Add Supabase Auth (email/password or magic link) to:
  - Enable multi-device sync (data follows the user, not the device)
  - Enable sharing / social features
  - Enable coach/client workflows
  - Properly secure data per user with Row Level Security (RLS) in Supabase

### Supabase Row Level Security
- Even if keeping single-user, add RLS policies to the Supabase tables to prevent data leakage between anonymous sessions.

### IndexedDB abstraction
- The current `offline.ts` is a low-level IndexedDB wrapper.
- Consider migrating to `idb` (a thin typed wrapper) for cleaner, promise-based access.

### Error handling & loading states
- Add loading skeletons to remaining pages (progress, workout detail).
- Currently only basic spinners exist; full skeleton UI not yet done.

### Unit tests
- Vitest is set up but test coverage appears minimal.
- Add unit tests for:
  - `calculators.ts` (1RM, plate calculations)
  - `streak.ts` (edge cases: timezone changes, multi-day gaps)
  - `progress.ts`
  - `weight-conversion.ts`

### TypeScript strictness
- Enable `strict: true` in `tsconfig.json` and fix any resulting type errors.
- Add explicit return types to all utility functions.

### Service Worker / PWA
- Add a service worker for true PWA support:
  - Install-to-home-screen prompt
  - Offline caching of the app shell
  - Background sync of queued operations
- Currently the sync queue exists but there's no service worker to drive background sync.

### Environment variable validation
- Add startup validation that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
- Fail loudly at dev startup if missing, rather than silently failing at runtime.

### Complete the services layer
- `src/lib/services/workouts.ts` — extract workout CRUD out of page components
- `src/lib/services/body-metrics.ts` — extract body metrics CRUD
- `src/lib/services/templates.ts` — extract template management
- (exercises service already done)

---

## 7. UI / Design System Improvements

### Design tokens / CSS variables audit
- Standardize spacing, border-radius, shadow, and transition values as CSS variables.
- Currently a mix of inline Tailwind utilities and CSS variable references.

### Component library consolidation
- Extract common patterns (Card, Button, Badge, Modal, Sheet) into reusable components in `$lib/components/ui/`.
- Many pages duplicate the same card/button styles.

### Mobile keyboard behavior
- When the numeric input is focused on the active workout screen (reps/weight), the soft keyboard should not push the rest timer off screen.
- Consider using `inputmode="decimal"` on weight inputs.

### Accessibility
- Add `aria-label` attributes to all icon-only buttons.
- Ensure colour contrast ratios meet WCAG AA on the dark theme (especially orange text on black backgrounds).
- Add keyboard navigation support for the rest timer controls.

### Empty states
- Add illustrated empty-state screens for:
  - No workouts logged yet
  - No body metrics recorded
  - No progress data for an exercise
- Currently these states show blank space.

### Haptic feedback (PWA/mobile)
- Use the Vibration API to give feedback on:
  - Set completion tap
  - Rest timer end
  - PR achievement

### Animations
- Add a subtle confetti or badge animation when a new PR is set during a workout.
- Animate streak milestone badges when achieved.

### Dark/light theme
- Implement CSS `prefers-color-scheme` media query support so the app respects the system preference by default.

---

## 8. Content & Data Improvements

### Expand exercise database
- Add exercises for underrepresented categories:
  - Olympic lifts (snatch, clean & jerk)
  - Kettlebell movements
  - Resistance band exercises
  - Balance / stability work
  - Yoga / mobility flows
- Add muscle diagrams or group images to each exercise entry.

### Exercise aliases / search
- Add common alternate names to exercises (e.g., "Press-up" for "Push-up").
- Improve exercise search to match partials and common aliases.

### Workout templates expansion
- Add more built-in templates:
  - 5×5 Stronglifts
  - Starting Strength
  - PPL (Push/Pull/Legs) 6-day split
  - 531 (Jim Wendler)
  - Bodyweight-only beginner plan
  - 15-minute HIIT circuit

---

## 9. Infrastructure & DevOps

### CI/CD pipeline
- Add a GitHub Actions workflow for:
  - `npm run check` (TypeScript check) on every PR
  - `npm run test` (Vitest) on every PR
  - Auto-deploy to Netlify on merge to `main`

### Branch protection
- Protect `main` branch: require PR review and passing CI before merge.

### Semantic versioning
- Add a version number to the app (visible in the profile/settings page footer).
- Use conventional commits and automated changelog generation.

### Error monitoring
- Integrate Sentry (or equivalent) for runtime error tracking in production.

### Analytics
- Add privacy-respecting analytics (e.g., Plausible or Umami) to understand which features are used most.

---

## 10. Routing & Navigation Improvements

### New routes to add
- `/exercises` — dedicated exercise library browser with search/filter
- `/exercises/[id]` — single exercise detail page (currently a modal)
- `/templates` — full template management page
- `/settings` — user settings page (currently buried in profile)
- `/profile/goals` — dedicated goals page

### Consider: Local-first with optional sync
Given the offline-first architecture already in place, consider making local IndexedDB the primary data store and Supabase purely optional/sync-only. This would:
- Work perfectly without any Supabase credentials
- Remove the dependency on network availability at startup
- Make the app viable as a pure PWA with no backend

---

## Priority Order (Suggested)

### High priority (do next)
1. Authentication (Supabase Auth) for multi-device sync
2. Workout template editing (templates are currently read-only after creation)
3. Exercise-specific progress pages

### Medium priority
6. Workout template editing
7. Scheduled workouts / weekly planner
8. Exercise-specific progress pages
9. Goals system
10. PWA service worker

### Lower priority / nice to have
11. Nutrition logging
12. Body measurements expansion
13. Social sharing cards
14. CI/CD pipeline
15. Accessibility audit
