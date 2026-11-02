# Attribution, license restrictions and disclaimer

## Original Android DSH plugin

- Software: dsh-app-pet, pinned npm version **1.0.3**.
- https://www.npmjs.com/package/dsh-app-pet
- Source tarball: https://registry.npmjs.org/dsh-app-pet/-/dsh-app-pet-1.0.3.tgz
- The npm package declares MIT for code; its original LICENSE is preserved
  byte-for-byte in Fish distribution. Copyright owners retain their rights.
- Related original Android DSH host: https://github.com/pht88888888/DSHAPP
- Fish is an independent unofficial derivative and not an official release.

## Animation source and character

- All 24 WebM animations are from dsh-pet, original source
  https://github.com/PC2005-cloud/dsh-pet .
- Copyright (c) 2026 PC2005-cloud. Attribution is mandatory for public
  derivatives under the upstream author's stated terms.
- Original project distinguishes MIT software code from animation source
  and prompts: **animation media is permitted for open-source noncommercial
  use, not unrestricted commercial redistribution**.
- Upstream describes the fan-made DeepSeek whale-girl (大肥鱼) character as
  derived from 溟月 by Bilibili creator 上善无形, with maid whale-girl
  design by Bilibili creator ZipZipPipe. Its declared character terms are
  **CC BY-NC-SA 4.0** (attribution, noncommercial, share-alike):
  https://creativecommons.org/licenses/by-nc-sa/4.0/
- The 24 animation files in Fish are byte-for-byte copies from the pinned
  package, not generated or modified; their source Chinese names remain in
  preset source mapping.
- NO commercial use, commercial relicensing or paid resale of these media
  or character is authorized by this repository.

## Fish modifications

Independently modified from original package 1.0.3:
1. Distinct plugin name dsh-app-pet-fish and tool fish_pet.
2. Restrict preset names and animation file paths (no filesystem traversal).
3. Reject unknown action instead of falling into a configuration write.
4. Add read-only verify preflight; no writes or native privilege changes.
5. Serialize Fish's own concurrent mailbox writes only (NO cross-plugin lock).
6. Track applied state separately in deskpet/fish-state.json.
7. Permit DSH_PET_FISH_DISABLE_BOOT=1 to disable automatic apply.
8. Add optional focus.json with reduced movement and smaller appearance.
9. Pin upstream tarball SHA256 and run package/behavior tests in CI.

## No warranties

Provided AS IS, without warranty. Not endorsed by DeepSeek, the original
plugin publisher, PC2005-cloud, the character creators or OpenAI.
The Fish package is NOT an Android APK; it does not grant overlay permission.
Native animation playback, transparency, touch interactions and Android API
compatibility require separate device verification. Keep the original DSH
app's data and APK; uninstall/disable the original dsh-app-pet *plugin*
before using Fish. Do not have multiple plugins simultaneously writing the
same bubble-cmd.json mailbox. Removing Fish may leave host appearance config;
use the original bubble tool to restore it rather than deleting host data.
