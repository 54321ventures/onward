# Changelog

All notable changes to this project are tracked here, most recent first.

## 2026-11-23

### Changed
- Category field in the Add/Edit form changed from a fixed MSME/Credit Card/Project/Others dropdown to a free-text input with autocomplete suggestions (previously used categories, plus the four original defaults), matching the existing PIC field pattern. The Category filter dropdown now lists whatever distinct categories actually exist in your tasks instead of a hardcoded list.

## 2026-11-21

### Added
- Initial to-do tracker: title, priority (High/Medium/Low), deadline, done checkbox, add/edit/delete, sort by deadline or priority, filter All/Active/Done, overdue (red) / due-today (amber) highlighting, localStorage persistence, friendly empty state.
- Task description field and per-task sub-tasks checklist.
- Attachment link field per task (later expanded to multiple links per task).
- Duplicate-task action, later enhanced to prompt for a new deadline before duplicating.
- Due-date filter: All / Today / Tomorrow.
- Requester/PIC (owner) field, with autocomplete suggestions drawn from previously used names.
- Category field (MSME / Credit Card / Project / Others) with a category filter control.
- Remarks field per task.
- Dark/light theme toggle, persisted and falling back to the OS `prefers-color-scheme` on first load.
- Keyword search bar (matches title, description, remarks, PIC, category, and sub-task text).
- Recurring tasks (Weekly/Monthly): completing a recurring task auto-creates the next occurrence with an advanced deadline and reset sub-tasks/links.
- Optional browser notification reminders for overdue/due-today tasks, gated by explicit opt-in and throttled to once per day.
- CSV export of all tasks.
- Per-task activity log (status changes, edits, duplication, creation).
- `Not Started` and `On Hold` task statuses (see Changed — `Not Started` replaced the original `Deprioritised` label).
- "Date added" shown on every task, backed by a new `createdAt` field; new "Date Added" sort option.
- `CLAUDE.md` project documentation for future Claude Code sessions.
- Device mockup (Samsung Galaxy Z Fold8, folded and unfolded) showing the app running, built as a Claude Artifact design.
- App renamed/branded as "Onward", with the title styled in bold yellow ochre.

### Changed
- "+ Add Task" button moved into the header row (next to the notification/theme icons) to close the empty gap below the title; on mobile it still drops to its own full-width line for tappability.
- "+ Add Task" button moved to the right of the toolbar and recolored to yellow ochre.
- Edit, Delete, Duplicate, and Details controls changed from text buttons to icon buttons with hover tooltips.
- Replaced the original "Sort by" control with a dedicated category Filter control (sort and category filter are now separate controls).
- Removed the JSON export/import feature, the "My Name" / "My Tasks" single-user filter, and the bulk multi-select feature (app is single-user, so these were unnecessary).
- De-emphasized the CSV export button (moved to a small underlined footer link instead of the main toolbar).
- Renamed the `Deprioritised` status to `Not Started` throughout (filters, edit form, badges).
- Duplicate-task naming: started as `Task (copy)`, changed to `Task v2`/`v3`/... , then simplified to a plain trailing number: `Task 2`, `Task 3`, etc., auto-incrementing from the highest existing copy of that task.

### Fixed
- Mobile Due filter (All/Today/Tomorrow) sitting flush right while the Status filter wrapped to the left, since the Due buttons were narrow enough to fit beside their label on one line while Status's weren't. Both filter groups now stack their label above their buttons on mobile, so Status and Due line up consistently.
- Mobile header still showing an empty gap below the title: the icon-button group was stretching to its own full-width row before wrapping, pushing the title and icons apart. The "+ Add Task" button is now a direct header-row item (instead of nested inside the icon-button group), so on mobile only that button wraps to its own full-width line while the title and icons stay flush on the first line.
- Invisible "Save" button in the Add/Edit modal caused by a CSS specificity clash overriding the primary button color.
- Reminder banner and (now-removed) bulk-action bar briefly showing as empty boxes on load because `display: flex` rules were overriding the native `[hidden]` attribute; fixed with a global `[hidden] { display: none !important; }` rule.
- Notification toggle going stale: the bell icon only read a saved on/off flag and never rechecked the browser's actual notification permission, so it could keep showing "enabled" indefinitely after permission was revoked or never truly granted. It now resyncs with `Notification.permission` on every load/toggle, and gives a clearer message when notifications are blocked at the browser level.
