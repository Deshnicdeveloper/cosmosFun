# Cosmos Fun 🚀

A "Heads Up!"-style party charades game with a cosmic twist, built with Expo + React Native + TypeScript.

One player holds the phone to their forehead — the word shows on screen facing their friends, who shout clues. **Tilt down** for "Got it!", **tilt up** to skip, beat the clock. 14 themed decks (including Cameroon Special 🇨🇲, Pidgin, and French), streaks, confetti, sounds, haptics, and local high scores.

## Game modes & features

- **Quick Play** — classic solo rounds with any deck
- **Team Battle** — 2–6 teams take turns (1–3 rounds each), live standings between rounds, victory podium with confetti
- **Daily Challenge** — everyone gets the *same* seeded 20 words each day; per-day leaderboard
- **Cosmic Events** — random round modifiers: Supernova (2× points), Meteor Shower (45s, +3s per correct), Golden Rush, Frozen Comet (skips freeze 3s), Deep Space Silence (mime-only clues)
- **Golden words** (~1 in 12) worth 3 points, with sparkle sound and gold styling
- **Streak time bonus** — +2s at every 5-streak; **Buzzer Beater** badge for a correct in the final 3s
- **Custom decks** — build decks from your own words in-app (they join Mix All too)
- **Stats** — lifetime words guessed, best streak ever, golden words found, time played…
- **Share cards** — the recap captures a score card image for the share sheet
- Skip-freeze house rule (Settings), mascot commentary during rounds, last-5s red pulse

## Run it

```bash
npm install        # .npmrc already sets legacy-peer-deps
npx expo start
```

### Test on your iPhone (Expo Go)

1. Install **Expo Go** from the App Store.
2. Run `npx expo start` on your computer.
3. Scan the QR code with the iPhone camera — it opens in Expo Go.
4. On first round start, iOS asks for **motion access** — allow it for tilt controls. If you decline, the always-on **Skip / Got It** buttons keep the game fully playable.

> Tilt feel: if triggers feel too eager/lazy on your device, adjust **Settings → Tilt sensitivity** (it maps to the trigger angle in `hooks/useTiltDetection.ts`).

## Project structure

```
app/            expo-router screens (index → home → decks → pregame → game → recap, + settings/how-to-play/high-scores)
components/     Mascot, TimerRing, DeckCard, ConfettiBurst, TiltIndicator, PoppinsText, StarField, ...
context/        GameContext — settings, round results, high scores (AsyncStorage-persisted)
data/decks.ts   12 decks, 380+ difficulty-tagged words
hooks/          useTiltDetection, useSound, useHaptics
theme/theme.ts  cosmic dark theme (structured so a light mode can be added later)
assets/         generated icon/splash art + synthesized sound effects
```

## Sounds

`assets/sounds/*.wav` are **synthesized placeholders** (generated programmatically — a ding, whoosh, beep, buzz, and fanfare). They work out of the box. For richer audio, drop royalty-free replacements with the same filenames (`correct`, `skip`, `countdown`, `timeout`, `cheer`) into `assets/sounds/` and update the extensions in `hooks/useSound.ts` if you use `.mp3`.

Good sources: [freesound.org](https://freesound.org), [pixabay.com/sound-effects](https://pixabay.com/sound-effects).

## Implementation notes

- **expo-audio instead of expo-av** — expo-av is deprecated in current Expo SDKs; expo-audio is its official replacement.
- **reanimated instead of moti** — moti's framer-motion dependency is incompatible with React 19; all animations use react-native-reanimated 4 directly.
- **Tilt detection** derives pitch from `DeviceMotion.rotation.beta` with a hysteresis band: after a tilt fires, the phone must return to neutral before the next event — one gesture, one word.
- **Icons/splash** are generated programmatically (`ringed planet + comet` on the navy/purple gradient). Replace `assets/icon.png` etc. with real artwork before App Store submission if you want.

## Ship it (EAS Build / App Store)

```bash
npm install -g eas-cli
eas login
eas build:configure          # creates eas.json
eas build --platform ios     # needs an Apple Developer account ($99/yr)
eas submit --platform ios    # upload to App Store Connect / TestFlight
```

The bundle identifier is already set to `com.codinghq.cosmosfun` in `app.json`, and `NSMotionUsageDescription` is configured for the motion-permission prompt.

### Next steps

- Replace placeholder sounds and (optionally) generated icon art.
- Expand the Celebrities deck with names your group recognizes (see the comment in `data/decks.ts`).
- Landscape mode + light theme are natural v2 candidates (theme file is already structured for it).
