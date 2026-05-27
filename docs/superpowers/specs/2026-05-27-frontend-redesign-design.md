# Frontend Redesign — Listening Trainer

**Date**: 2026-05-27
**Status**: Approved by user

## Overview

Complete frontend overhaul of the Academic Listening Trainer. Goals:
- Modern minimalist visual design (replacing the Aurora gradient/glassmorphism theme)
- Real URL routing with react-router v6 (replacing useState-based in-memory routing)
- Dashboard-style homepage with learning stats
- Immersive fullscreen Dictogloss player with audio waveform
- User settings page
- Data visualization for practice history
- Responsive design (desktop + mobile)

## Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| bg | `#FAFAFA` | Page background |
| bg-alt | `#F5F5F5` | Alternate backgrounds, section dividers |
| surface | `#FFFFFF` | Cards, panels, modals |
| surface-hover | `#F9FAFB` | Card hover state |
| border | `#E5E7EB` | Card borders, dividers |
| border-strong | `#D1D5DB` | Active/focused borders |
| text | `#111827` | Primary text |
| text-secondary | `#6B7280` | Secondary text, captions |
| text-tertiary | `#9CA3AF` | Placeholder text |
| primary | `#4F46E5` | Primary actions, links, active states |
| primary-hover | `#4338CA` | Primary hover |
| primary-surface | `#EEF2FF` | Primary tinted backgrounds |
| success | `#10B981` | Correct answers, positive indicators |
| error | `#EF4444` | Wrong answers, errors |
| warning | `#F59E0B` | Warnings, hints |

### Typography

- **Font**: Inter (loaded from Google Fonts, fallback to system sans-serif)
- **Headings**: font-weight 700-800, tight letter-spacing
- **Body**: font-weight 400-500, line-height 1.7
- **Numbers**: `tabular-nums` for score/progress alignment
- **Scale**: `text-xs` (12) → `text-sm` (14) → `text-base` (16) → `text-lg` (18) → `text-xl` (20) → `text-2xl` (24) → `text-3xl` (30) → `text-4xl` (36)

### Spacing & Radius

- **Spacing scale**: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
- **Card border-radius**: `rounded-xl` (12px)
- **Button border-radius**: `rounded-lg` (8px)
- **Badge border-radius**: `rounded-full`
- **Max content width**: `max-w-5xl` (1024px), increased from 4xl

### Micro-interactions

- **Card hover**: `translate-y-[-1px]` + shadow increase
- **Button active**: `scale-[0.99]`
- **Page transitions**: fade + slide (framer-motion or CSS transitions)
- **Loading**: skeleton placeholders instead of spinners
- **Focus ring**: `outline-2 outline-primary/50 outline-offset-2`

## Architecture & Routing

### Route Structure

```
/                     → HomePage (Dashboard)
/auth                 → AuthPage
/lessons/:difficulty  → LessonsPage
/player/:lessonId     → PlayerPage
/custom               → CustomLessonPage
/history              → HistoryPage
/history/:lessonId    → LessonHistoryPage
/history/detail/:id   → HistoryDetailPage
/settings             → SettingsPage (NEW)
*                     → 404 redirect to /
```

### File Structure

```
src/
  routes/
    RootLayout.tsx          ← Shared header, responsive nav
    HomePage.tsx            ← Dashboard with stats
    AuthPage.tsx            ← Login/Register
    LessonsPage.tsx         ← Lesson list by difficulty
    PlayerPage.tsx          ← Immersive Dictogloss player
    CustomLessonPage.tsx    ← Custom lesson creator
    HistoryPage.tsx         ← Full practice history
    LessonHistoryPage.tsx   ← Per-lesson attempt history
    HistoryDetailPage.tsx   ← Single attempt detail view
    SettingsPage.tsx        ← User profile & preferences
  components/
    ui/                     ← New design system primitives
      Button.tsx
      Card.tsx
      Badge.tsx
      ProgressBar.tsx
      Skeleton.tsx
      EmptyState.tsx
      StatCard.tsx
    AudioControls.tsx       ← Redesigned
    AudioWaveform.tsx       ← NEW: Web Audio API visualization
    LessonCard.tsx          ← Redesigned from LessonList
    DifficultyCard.tsx      ← Redesigned with ring progress
  context/
    AuthContext.tsx         ← Keep existing
    ProgressContext.tsx     ← Keep existing
  lib/
    api.ts                  ← Keep existing
    router.tsx              ← NEW: react-router configuration
  utils/
    compare.ts              ← Keep existing
    grammar.ts              ← Keep existing
    customLessons.ts        ← Keep existing
    formatDate.ts           ← NEW: date formatting helpers
  data/
    lessons.ts              ← Keep existing
  types/
    index.ts                ← Update View type removed, add chart types
  index.css                 ← Rewrite with new design tokens
  App.tsx                   ← Simplified: just RouterProvider
  main.tsx                  ← Keep, add BrowserRouter
```

### State Management Changes

- **AuthContext**: Keep as-is (JWT flow works fine)
- **ProgressContext**: Keep as-is (already integrates with backend)
- **App.tsx**: Remove all `useState<View>`, `handleGo*` callbacks, conditional rendering
- Replace with `<BrowserRouter>` + `<Routes>` in App.tsx
- Navigation via `useNavigate()` and `useParams()` in route components

## Page Designs

### 1. AuthPage

- Centered card layout on subtle gradient background
- Clean form: email + password, with validation feedback
- Toggle between Sign In / Create Account
- Logo and tagline above the card
- No major functional changes, visual refresh only

### 2. HomePage (Dashboard)

**Sections**:

**Greeting** (top):
- "Good morning, [user email]" with subtle time-based greeting
- Small user avatar circle

**Stats Grid** (4 cards in 2x2 grid on desktop, 1 column on mobile):
1. Total lessons completed
2. Best average score (%)
3. Current streak (days)
4. Last session score

**Quick Resume** (below stats):
- "Continue where you left off" — shows last 3 practiced lessons
- Each row: lesson title, difficulty badge, best score %, "Continue" button
- Clicking starts the player directly

**Difficulty Selection** (compact cards):
- 3 difficulty tiers with circular progress indicators
- Shows X/Y completed
- Click navigates to /lessons/:difficulty

**Action Buttons**:
- "Practice History" → /history
- "+ Create Custom Lesson" → /custom

**Trend Chart** (bottom):
- Simple line chart of last 7 days' scores (using canvas or lightweight chart lib)
- Fallback: if no data, show encouraging empty state

### 3. LessonsPage

- Header: difficulty title + back arrow to home
- Grid of lesson cards (1 column mobile, 2 columns desktop)
- Each card shows:
  - Lesson number badge
  - Title
  - Best score mini progress bar
  - "Start" button
  - Custom badge + delete for custom lessons
- Empty state with illustration

### 4. PlayerPage (Immersive)

**Layout**: Full-width centered container, max-w-5xl

**Top bar**:
- Lesson title (left)
- 5-step progress indicator (center) — circles with connecting lines
- Close/back button (right)

**Stage content** (varies by phase):

**Prep**:
- Topic hint card
- Key vocabulary pills (wrapped tags)
- Large "Start Listening" button

**Listen 1**:
- Large centered audio waveform visualization
- "Just listen" instruction
- Play/pause button (large, centered)
- Speed indicator

**Listen 2 (Notes)**:
- Audio controls on left
- Keyword notes textarea on right
- Instruction: "Write important words only"

**Reconstruct**:
- Mini audio bar (compact controls)
- Previous notes shown as reference card
- Large writing area with line-height-1.7
- Character/word count
- Submit button

**Result**:
- Score display (large percentage with color coding)
- Word-by-word diff view (inline highlights)
- Reveal original text button
- Side-by-side comparison view
- Try Again / Next Lesson buttons

**Keyboard Shortcuts**:
- `Space`: Play/Pause
- `Enter`: Advance to next stage (when button visible)
- `Esc`: Go back
- `1-3`: Cycle speeds (0.75x, 1x, 1.25x)

### 5. HistoryPage

- Header: "Practice History" with total stats
- Filter tabs: All | Daily | Campus | Academic
- List of lessons sorted by date (newest first)
- Each row: lesson title, difficulty badge, attempts count, best/latest score
- Click navigates to /history/:lessonId
- Empty state with illustration

### 6. LessonHistoryPage

- Header: lesson title + difficulty + attempt count
- "Practice Again" button
- Timeline of attempts (newest first)
- Each entry: attempt #, date, score, "View Detail" chevron
- Click navigates to /history/detail/:id

### 7. HistoryDetailPage

- Header: date + lesson name
- Score card (large)
- Tab navigation: Overview | Notes | Reconstruction | Comparison
- **Overview**: Process steps, audio plays, final score
- **Notes**: Keyword notes in styled card
- **Reconstruction**: User's written text in styled card
- **Comparison**: Word-by-word diff + side-by-side view + legend

### 8. SettingsPage (NEW)

- **Profile**: Avatar circle, display name, email (read-only)
- **Change Password**: Current + new + confirm
- **Preferences**:
  - Default TTS speed (0.75x / 1x / 1.25x / 1.5x)
  - Default difficulty
  - TTS voice (male / female)
- **Data Management**:
  - Export practice data (JSON download)
  - Sign out button

### 9. Data Visualization

Added to HomePage and optionally HistoryPage:
- **Line chart**: Score over time (last 7/30 days)
- **Bar chart**: Practice count by difficulty
- **Radar/spider chart**: Accuracy dimensions (vocab, grammar, listening)
- Implementation: Use lightweight canvas chart (e.g., Chart.js or custom SVG)
- Graceful empty states when no data

## Responsive Design

### Breakpoints
- **Mobile**: < 640px — single column, bottom tab navigation
- **Tablet**: 640px–1024px — 2 column grids where applicable
- **Desktop**: > 1024px — full layout, max-w-5xl content

### Mobile-specific
- Bottom fixed tab bar: Home | Lessons | History | Settings (40px height)
- Header simplified to logo only
- Player stages stack vertically
- Touch targets minimum 44x44px
- Swipe gestures: swipe back in player

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react-router-dom | ^6.x | URL routing |
| framer-motion | ^11.x | Page transitions, micro-animations |
| chart.js + react-chartjs-2 | ^4.x / ^5.x | Data visualization (or alternative) |

## Migration Strategy (Progressive — Option A)

Phase-by-phase, each phase produces a working app:

1. **Phase 1: Design System** — Rewrite `index.css` with new tokens, update layout primitives
2. **Phase 2: Routing** — Add react-router, convert App.tsx, create route wrappers
3. **Phase 3: Auth + Home** — Redesign auth page, build Dashboard
4. **Phase 4: Lessons + Custom** — Redesign lesson list, custom lesson form
5. **Phase 5: Player** — Immersive player with waveform, shortcuts
6. **Phase 6: History** — Redesign all history pages with tabs and charts
7. **Phase 7: Settings + Polish** — Settings page, responsive, final cleanup

Each phase merges independently. No feature flags needed.

## API Changes

No backend API changes required. All new features use existing endpoints:
- Stats computed from existing `/api/progress` and `/api/progress/history`
- Settings preferences stored client-side initially (can add backend endpoint later)
- Chart data derived from existing history endpoint
