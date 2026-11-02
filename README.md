# Fish · DSH Android floating desktop pet v1.2.0

Unofficial derivative of **dsh-app-pet@1.0.3**, intended for
**noncommercial** open-source use only.

Original plugin: https://www.npmjs.com/package/dsh-app-pet
Original assets/character: https://github.com/PC2005-cloud/dsh-pet
Original Android host: https://github.com/pht88888888/DSHAPP

## New in Fish v1.2.0 — opt-in desk-pet interactions

- A **new optional `fish_pet_life` tool** sends one-shot playful speech
  bubbles via native `action:notify`: `break`, `water`, `mischief`,
  `say` (1–60 Unicode characters). **Text only, no synthesized voice/TTS.**
- **Timers default OFF**. On explicit user instruction, `configure` can
  enable a recurring study break (default 45 min), hydration (90 min), or
  occasional harmless mischievous message (120 min). 15–240 min interval
  limits; global 15-minute cooldown.
- Local device quiet hours default **22:00–08:00**; adjust with
  `quietStart` and `quietEnd` (HH:MM). `off` cancels all timers.
- Opt-in settings are kept in `$DSH_HOME/deskpet/fish-life.json`, never
  touching the original pet stamp or accounts.
- New `fish_pet apply preset="playful"` increases the frequency of
  existing playful motions and enables bounded movement, while preserving
  original 24 videos and seven original status mappings.
- Timers need the DSH **Node engine to stay running**; Android may suspend it.
  These are **not reliable OS-level alarm-clock reminders**.
- If installing over previous Fish, ensure only one plugin instance is
  active. Original `dsh-app-pet` should remain disabled.

### Tool call examples

| Goal | DSH tool | Arguments |
|---|---|---|
| Enable a 45-minute break reminder | `fish_pet_life` | `{"action":"configure","feature":"break","enabled":true,"intervalMin":45}` |
| Enable occasional playful messages | `fish_pet_life` | `{"action":"configure","feature":"mischief","enabled":true,"intervalMin":120}` |
| Remind me to drink water now | `fish_pet_life` | `{"action":"water"}` |
| Say a custom short phrase | `fish_pet_life` | `{"action":"say","text":"学习一小时，休息一下！"}` |
| Disable all reminders | `fish_pet_life` | `{"action":"off"}` |
| Use animated mischief profile | `fish_pet` | `{"action":"apply","preset":"playful"}` |

Detailed lifecycle and native host limitations:
[docs/INTERACTIONS.md](docs/INTERACTIONS.md).

## Upgrade relative to 1.0.3

- All original **24 transparent WebM videos** and **seven work-state
  animations** retained. No video modified.
- Reject unsafe preset paths, arbitrary media directories and bad file names.
- An unknown tool action now fails, instead of silently applying a preset.
- New distinct tool: fish_pet with actions status, list, apply, verify.
- verify checks the full bundled preset offline WITHOUT overwriting the
  current native bubble appearance.
- New optional focus and playful presets: less wandering, smaller size, shorter status
  bubble; original pet preset remains the default.
- Only this fork's own writes are serialized; original bubble is an external
  writer, so no cross-process write-exclusivity is claimed.
- Original applied-state file not overwritten. Optional
  DSH_PET_FISH_DISABLE_BOOT=1 disables automatic apply at startup.

## DSH Android direct URL (after CI publishes dist)

https://raw.githubusercontent.com/initial2024/fish/main/dist/dsh-app-pet-fish-1.2.0.tgz

Paste the TGZ URL into DSH plugin download, NOT an Android APK installer,
Git clone URL or GitHub Actions artifact. First uninstall/disable the
original dsh-app-pet plugin to avoid conflicts, and restart DSH. The native
floating bubble must be enabled in the Android app.

This package uses the existing native bubble-cmd.json/bubble-result.json
interface. GitHub CI build success does not prove actual Android device
playback or compatibility; real device acceptance is a separate gate.

## Copyright, image rights, and disclaimer

Code declares MIT (upstream LICENSE preserved), but **the video media is
noncommercial, and the underlying character uses CC BY-NC-SA 4.0 terms**.
Attribution and rights belong to their respective authors; this repository
does not grant commercial use for media or character.

Full attribution, exact changes and warranty disclaimer:
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Fork does not replace or re-sign DSH Android, delete app data, or grant
Android permissions. Applied bubble settings may remain after uninstall.
