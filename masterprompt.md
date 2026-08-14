# Cosmos Fun — Master Build Prompt for Claude Code

## 1. What We're Building

**App Name:** Cosmos Fun
**Type:** Mobile party game (React Native, Expo managed workflow)
**Concept:** A "Heads Up!"-style charades game. One player holds the phone to their forehead; teammates give clues for the word on screen; the holder guesses before time runs out. Tilt the phone down for "Correct," tilt up to "Skip."
**Platform:** iOS first (via Expo Go for dev, EAS Build for release), but keep it cross-platform (Android should work too, no platform-specific hacks unless required).

Build this as a complete, polished, installable app — not a prototype. Prioritize working code over placeholder TODOs. If a feature can't be finished, stub it clearly and explain why in a comment.

---

## 2. Tech Stack

- **Framework:** Expo (managed workflow), latest stable SDK
- **Language:** TypeScript
- **Navigation:** `expo-router` (file-based routing)
- **Sensors:** `expo-sensors` (`DeviceMotion`) for tilt detection
- **Audio:** `expo-av` for sound effects
- **Haptics:** `expo-haptics` for vibration feedback on correct/skip/timeout
- **Fonts:** `@expo-google-fonts/poppins` — Poppins is the **primary font across the entire app** (headings, buttons, body text, score counters). Load weights: Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800), Black (900). Use `expo-font` + `expo-splash-screen` to keep the native splash visible until fonts load.
- **Animations:** `react-native-reanimated` + `moti` for smooth transitions, card flips, and confetti/celebration effects
- **State management:** React Context + hooks (no Redux needed — this app's state is simple: current deck, score, timer, settings)
- **Storage:** `@react-native-async-storage/async-storage` for persisting high scores, selected decks, and settings (sound on/off, haptics on/off, timer duration)
- **Icons:** `@expo/vector-icons` (Ionicons or Feather)

---

## 3. Branding & Visual Identity

- **App name displayed everywhere:** "Cosmos Fun"
- **Font:** Poppins throughout — no system default fonts anywhere in the UI
- **Color palette:** Space/cosmos theme — deep navy/purple gradient backgrounds (`#0B0E2E` → `#3D1E6D` → `#7C3AED`), with vibrant accent colors per category (each category deck gets its own accent color, e.g., Programming = electric blue `#38BDF8`, Movies = hot pink `#EC4899`, Animals = lime green `#84CC16`, Cameroon deck = a warm orange/red inspired by the flag). Correct = green glow, Skip = amber/orange glow, Timeout = red pulse.
- **Visual motif:** Stars, planets, comets, subtle particle/twinkle animations in the background of menu screens (keep game screen itself clean/high-contrast for readability during play).
- **Icon & splash screen:** Design a custom app icon — a stylized planet/comet with a game controller or forehead-tilt icon motif, on the navy/purple gradient. Splash screen shows the "Cosmos Fun" wordmark in Poppins ExtraBold, centered, with a subtle animated twinkle/star field, fading into the home screen.

### Fun Extras To Include
- **Confetti burst animation** when a round ends with a high score or a "perfect round" (all correct, no skips).
- **Animated mascot** (a simple friendly cartoon planet or comet character, built as an SVG/Lottie or simple animated component) that reacts on key screens — waves on splash, cheers on correct answers, shrugs on skip, looks dizzy on timeout.
- **Sound effects:** a satisfying "ding" for correct, a soft "whoosh" for skip, a dramatic countdown beep in the last 5 seconds, an air-horn or crowd-cheer for round-end celebration. Use royalty-free placeholder sound file names and note in comments where the user should drop their own `.mp3` files if not included.
- **Haptic feedback:** light tap on skip, success notification haptic on correct, warning haptic on last-5-seconds countdown.
- **Shake-to-shuffle:** optional easter egg — shaking the phone on the deck-select screen shuffles/randomizes the deck order with a fun animation.
- **Streak counter:** track consecutive correct answers within a round and show a fun escalating label ("On fire! 🔥", "Unstoppable! ⚡", "Legendary! 🌟") at streak milestones (3, 5, 8+). Use animated icons. 
- **End-of-round recap screen:** animated tally showing words gotten right (green) vs skipped (red), total score, best streak, with "Play Again," "Change Deck," and "Share Score" (native share sheet) buttons.
- **Dark cosmic theme only** for v1 — no light mode toggle needed yet, but structure the theme file (`theme.ts`) so light mode could be added later without a rewrite.

---

## 4. Core Game Loop & Screens

Use `expo-router` with the following screens/routes:

1. **Splash Screen** (`app/index.tsx` or native splash via `expo-splash-screen`) — Cosmos Fun logo animation, auto-navigates to Home after ~1.5s or on font load complete.
2. **Home Screen** (`app/home.tsx`) — "Cosmos Fun" title, animated star background, big "Play" button, secondary buttons for "Categories," "Settings," "How to Play," "High Scores."
3. **Category/Deck Select Screen** (`app/decks.tsx`) — Grid of category cards (see §5), each showing category name, icon, accent color, and word count. Multi-select allowed (combine decks) or single-select — default to single-select with a "Mix All" option. Include a difficulty filter toggle (Easy / Medium / Hard / All).
4. **Pre-Game Screen** (`app/pregame.tsx`) — Shows selected deck(s), lets user set round duration (30s / 60s / 90s, default 60s), toggle sound/haptics, then "Hold phone to forehead & tap Start" instruction with a countdown (3-2-1) before the timer begins.
5. **Game Screen** (`app/game.tsx`) — THE CORE SCREEN:
   - Large centered word text (Poppins Bold/Black, auto-scales font size for long words)
   - Category label small at top
   - Countdown timer (circular progress ring or bar) at top, turning red/pulsing in final 5 seconds
   - Score tally (small, corner) updating live
   - Tilt detection via `DeviceMotion`: tilt phone down (forehead-facing-down motion) = correct, advance word, +1 score, green flash + haptic + sound; tilt up = skip, advance word, amber flash + haptic + sound
   - Fallback manual controls: two large tap zones or buttons ("✓ Got It" / "✗ Skip") for when tilt isn't available or permission denied (always show these as a non-intrusive option, since `DeviceMotion` requires permission on iOS via `expo-sensors`' `requestPermissionsAsync`)
   - When timer hits 0: auto-navigate to Recap Screen
6. **Recap Screen** (`app/recap.tsx`) — Results as described in §3 fun extras.
7. **Settings Screen** (`app/settings.tsx`) — Sound toggle, haptics toggle, default timer length, tilt sensitivity slider, "Reset High Scores" button, app version, credits.
8. **How to Play Screen** (`app/how-to-play.tsx`) — Simple animated/illustrated instructions (3–4 steps, icon + short Poppins text each).
9. **High Scores Screen** (`app/high-scores.tsx`) — Locally stored top 10 scores per deck, stored via AsyncStorage, with date played.

---

## 5. Word Bank / Categories (Data Structure)

Create `data/decks.ts` exporting a typed array of decks. Each word has a `difficulty` tag (`easy` | `medium` | `hard`).

```ts
type Difficulty = "easy" | "medium" | "hard";
type Word = { term: string; difficulty: Difficulty };
type Deck = {
  id: string;
  name: string;
  icon: string; // Ionicons name
  accentColor: string;
  words: Word[];
};
```

Include these decks fully populated (aim for 25–40 words per deck):

1. **Programming & Tech** (accent: electric blue `#38BDF8`)
   - Easy: JavaScript, Python, HTML, CSS, bug, laptop, internet, app, website, robot
   - Medium: algorithm, loop, variable, function, array, database, API, framework, Git, cloud, server, debugging, compiler, encryption, cache
   - Hard: recursion, race condition, technical debt, rubber duck debugging, merge conflict, stack overflow, middleware, polymorphism, big O notation, dependency injection

2. **Movies & TV**
3. **Animals**
4. **Celebrities** (use generic descriptors/placeholder guidance — do NOT hardcode real celebrity names in a way that could date the deck; instead add a comment showing the format and 5–10 safely generic/iconic example entries, and note the user should expand this list themselves)
5. **Occupations**
6. **Actions & Verbs** (things you physically act out: swimming, juggling, sneezing, typing, dancing)
7. **Famous Places & Landmarks**
8. **Food & Drinks**
9. **Emotions & Expressions**
10. **Sports**
11. **Cameroon Special** (accent: warm orange/red) — local flavor: ndolé, achu, Douala, Yaoundé, Limbe, jama-jama, okok, fufu corn, moto taxi, Njangi, Mount Cameroon, bikutsi, makossa — mark these all `medium` unless obviously easy/hard
12. **Tech Companies & Apps**

Populate every deck with real, playable word lists — don't leave any deck with fewer than 20 words. Use your best judgment for word selection quality (things that are genuinely describable/actable in a charades context).

---

## 6. Project Structure

```
cosmos-fun/
├── app/
│   ├── index.tsx
│   ├── home.tsx
│   ├── decks.tsx
│   ├── pregame.tsx
│   ├── game.tsx
│   ├── recap.tsx
│   ├── settings.tsx
│   ├── how-to-play.tsx
│   └── high-scores.tsx
├── components/
│   ├── Mascot.tsx
│   ├── TiltIndicator.tsx
│   ├── TimerRing.tsx
│   ├── DeckCard.tsx
│   ├── ConfettiBurst.tsx
│   └── PoppinsText.tsx   // wrapper enforcing font weight props
├── context/
│   └── GameContext.tsx    // current deck, score, streak, settings
├── data/
│   └── decks.ts
├── hooks/
│   ├── useTiltDetection.ts
│   ├── useSound.ts
│   └── useHaptics.ts
├── theme/
│   └── theme.ts            // colors, spacing, font weights
├── assets/
│   ├── fonts/               // Poppins files if not using @expo-google-fonts
│   ├── sounds/               // correct.mp3, skip.mp3, countdown.mp3, cheer.mp3
│   └── images/                // icon.png, splash.png, mascot sprites
├── app.json
├── package.json
└── tsconfig.json
```

---

## 7. Build Instructions For Claude Code

1. Scaffold the project with `npx create-expo-app cosmos-fun -t expo-template-blank-typescript`, then add `expo-router` per the official install steps.
2. Install all dependencies listed in §2.
3. Configure `app.json`: set `name`, `slug`, `scheme` to `cosmos-fun`; set icon and splash paths; set iOS bundle identifier placeholder `com.codinghq.cosmosfun`; enable `expo-sensors` motion usage description strings (`NSMotionUsageDescription`) for iOS.
4. Build the theme file first (colors, Poppins font weight constants), then shared components, then screens in the order listed in §4.
5. Implement `useTiltDetection` as a reusable hook: subscribes to `DeviceMotion`, exposes `{ tiltState: "neutral" | "down" | "up", requestPermission }`, debounced so a single tilt only fires one event (must return to neutral before re-triggering).
6. Wire the full game loop end to end: Home → Decks → Pregame → Game → Recap → back to Home or replay, with GameContext holding score/streak/current deck across the Game and Recap screens.
7. Add AsyncStorage persistence for settings and high scores.
8. Populate `data/decks.ts` fully per §5 — do not leave placeholder word lists.
9. Add basic loading/error states (e.g., motion permission denied → show manual tap controls automatically with a friendly explanation, don't block the game).
10. Test the app conceptually screen-by-screen and fix any obvious TypeScript or navigation errors before finishing.
11. At the end, output a short README section (can go in `README.md`) explaining: how to run (`npx expo start`), how to test on iPhone (Expo Go), where to add real sound files if placeholders were used, and next steps for EAS Build/App Store submission.

---

## 8. Non-Negotiables

- Poppins font used everywhere, no exceptions.
- Full game loop must be playable start to finish with no dead ends or broken navigation.
- Tilt detection must have a manual-control fallback — never block play if permission is denied.
- All 12 decks fully populated with real words, not lorem-ipsum placeholders.
- TypeScript throughout, no `any` types unless truly unavoidable (comment why).
- Keep everything in a single Expo managed workflow project — no native module ejects unless a listed dependency strictly requires it.

Build this now, screen by screen, starting with project scaffolding and the theme file.