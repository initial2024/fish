# Fish · DSH Android floating desktop pet v1.1.0

Unofficial derivative of **dsh-app-pet@1.0.3**, intended for
**noncommercial** open-source use only.

Original plugin: https://www.npmjs.com/package/dsh-app-pet
Original assets/character: https://github.com/PC2005-cloud/dsh-pet
Original Android host: https://github.com/pht88888888/DSHAPP

## Upgrade relative to 1.0.3

- All original **24 transparent WebM videos** and **seven work-state
  animations** retained. No video modified.
- Reject unsafe preset paths, arbitrary media directories and bad file names.
- An unknown tool action now fails, instead of silently applying a preset.
- New distinct tool: fish_pet with actions status, list, apply, verify.
- verify checks the full bundled preset offline WITHOUT overwriting the
  current native bubble appearance.
- New optional focus preset: less wandering, smaller size, shorter status
  bubble; original pet preset remains the default.
- Only this fork's own writes are serialized; original bubble is an external
  writer, so no cross-process write-exclusivity is claimed.
- Original applied-state file not overwritten. Optional
  DSH_PET_FISH_DISABLE_BOOT=1 disables automatic apply at startup.

## DSH Android direct URL (after CI publishes dist)

https://raw.githubusercontent.com/initial2024/fish/main/dist/dsh-app-pet-fish-1.1.0.tgz

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
