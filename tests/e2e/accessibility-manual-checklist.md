# Manual Accessibility Checklist (Retained Surface)

Automated axe checks are a baseline only. They do not replace full manual accessibility review.

- Keyboard-only navigation sanity:
  Tab and Shift+Tab through global navigation, command palette trigger, and primary actions on `/`, `/docs`, `/admin`, `/prompts`, `/editor`, `/playground`.
- Focus order and focus visibility:
  Confirm focus order is logical and visible on all interactive controls, including dropdowns, tabs, and dialogs.
- Dialog behavior:
  Open command palette and admin confirmation dialogs; verify initial focus, trapped focus while open, and Escape to close.
- Route title and heading sanity:
  Verify each retained route exposes a meaningful page title and at least one visible heading for orientation.
- Screen reader spot-check:
  Perform spot checks in NVDA or VoiceOver for global navigation, command palette search results, admin form labels, and editor tabs.
