# Tool Bridge v2 - Consent Copy Library

Purpose surfaces must show concise, transparent consent language before executing any device tool. This library provides default copy blocks that product/design can fine-tune without changing code.

## Usage Guidelines

- Present consent in a modal or sheet above the confirmation CTA.
- Highlight what data is accessed, how it is used, and how the user can revoke.
- If a permission has already been denied, surface a recovery hint ("Open Settings -> Notifications").
- Localize copy via i18n keys that reference these snippets verbatim.

## Consent Blocks

### schedule_reminder

- **Title:** "Schedule this reminder?"
- **Body:** "Fermi will set a one-time reminder on your device for {formatted_time}. Nothing is stored on our servers."
- **CTA:** "Schedule reminder"
- **Secondary CTA:** "Not now"
- **Denied follow-up:** "Reminder not scheduled. You can try again whenever you're ready."

### start_timer

- **Title:** "Start this timer?"
- **Body:** "Fermi can keep a countdown in the background and ping you when time's up."
- **CTA:** "Start timer"
- **Secondary CTA:** "Cancel"
- **Denied follow-up:** "Timer cancelled. Let me know if you want to try again."

### get_location

- **Title:** "Share your city?"
- **Body:** "Fermi will pull your coarse city + region to tailor the guidance. We never store precise coordinates."
- **CTA:** "Share city"
- **Secondary CTA:** "Keep private"
- **Denied follow-up:** "Location stayed private - totally fine. I'll keep helping without it."

### save_note

- **Title:** "Save this note?"
- **Body:** "The note stays private to you. If you're offline we'll sync it later when you come back."
- **CTA:** "Save note"
- **Secondary CTA:** "Skip"
- **Denied follow-up:** "Nothing saved. Want me to try again later?"

### create_ics_event

- **Title:** "Create calendar file?"
- **Body:** "Fermi will generate a downloadable .ics calendar file so you can add it anywhere. No event is created automatically."
- **CTA:** "Create .ics file"
- **Secondary CTA:** "Maybe later"
- **Denied follow-up:** "All good - no calendar file created."

## Accessibility Notes

- Provide descriptive `aria-label`s for confirm/dismiss buttons (e.g., "Schedule reminder created by Fermi").
- Ensure motion/animation can be disabled via Reduce Motion.
- All consent copy should remain under 200 characters to support screen readers without truncation.
