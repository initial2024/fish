# Fish v1.2.0 interactions — maintainers and phone-test handoff

## Existing integration, no Android app changes

Fish is a Node DSH plugin built from pinned original dsh-app-pet@1.0.3.
Fish v1.2.0 installs the original 24 WebM files without modification and
registers original `fish_pet` plus optional `fish_pet_life`.
The latter only transmits native bubble commands of this form:

    {"id":1300000,"action":"notify",
     "text":"休息一下吧！","durationMs":4000,"sticky":false}

The DSH Android source's BubbleCommandBridge handles `notify` without
changing SharedPreferences appearance. The user must actually have an
active native floating bubble for this to show.

## User-facing behavior

- Newly installed: all timed features disabled, no surprise popup.
- `fish_pet_life configure`: requires feature, enabled, and optional
  intervalMin between 15 and 240; first notification occurs after interval.
- `fish_pet_life off`: disables all, cancels interval timer.
- `fish_pet_life status`: reports config and runtime timer status.
- `fish_pet_life break|water|mischief|say`: explicit, immediate one-shot.
- `fish_pet apply preset=playful`: changes movement/idle action mix using
  only original 24 animations; not itself an auto-chat message.
- Quiet time default 22:00–08:00, device-local, configurable HH:MM.
- Global 15-minute cooldown for background notices, non-sticky 4s messages.
- No catch-up spam after DSH Node restarts. Settings persist but countdown
  restarts fresh. No direct Android notification permission or alarm manager.

## Security and compatibility boundaries

1. All timers live in the DSH Node engine: engine suspended/exited = no
   reliable reminders. Never claim OS alarm scheduling.
2. Never execute arbitrary audio or text-to-speech; new short text is only
   a bubble status string. Native text rendering may vary with WebView.
3. `fish_pet_life` transports through the SAME shared bubble mailbox. Own
   Fish writes are serialized; this is NOT an inter-plugin transaction
   lock. Disable original dsh-app-pet to avoid duplicate writers.
4. A native `notify` failure returns a tool error, not a fake success.
5. Do not log full private message strings, user file paths or model prompts.
6. Respect noncommercial asset and CC BY-NC-SA character rights documented
   in THIRD_PARTY_NOTICES.md.
7. Never delete/reset existing Android bubble preferences on plugin removal.

## Tests and production acceptance

- CI pins SHA-256 of original tarball, verifies 24 original files and 7 states.
- Node tests verify OFF default, quiet hours, interval, stop, opt-in,
  persistence, invalid text, native notify payload and mock mailbox.
- Native phone acceptance remaining: 45 min reminder while engine active,
  quiet-hours suppression, playful animation, touch/drag and restart; native
  renderer behavior is not certified by CI.
- If any timer makes DSH loop hang, conflicts with other bubble updates,
  or causes unexpected background activity, DISABLE Fish Life and revert to
  v1.1.0 before further changes.

## Upstream source and attribution

Original Android plugin: npm dsh-app-pet@1.0.3 (MIT code).
Video/character: PC2005-cloud/dsh-pet noncommercial; character CC BY-NC-SA.
See THIRD_PARTY_NOTICES.md. v1.2.0 code and dialogue are Fish additions.
