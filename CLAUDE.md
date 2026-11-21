# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page to-do/task tracker built with plain HTML, CSS and vanilla JavaScript — no frameworks, no build tools, no package manager. The whole app is three files: `index.html`, `style.css`, `app.js`.

## Running locally

There is no build step. Serve the folder with any static file server and open it, e.g.:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html`. Opening `index.html` directly via `file://` mostly works but some browser previews treat it as a static snapshot — prefer a local server when testing.

There are no linters, formatters, or automated tests configured in this repo. Verify changes by loading the page in a browser and exercising the UI directly (DevTools device emulation is useful for checking the mobile breakpoint at 600px).

## Changelog

This repo keeps a `CHANGELOG.md` at the project root. After making any change in a session (feature, fix, or removal), add an entry under today's date before finishing up.

## Architecture

**Data model**: a single in-memory array `todos` (in `app.js`), persisted to `localStorage` under key `todo-tracker-items` as JSON. Each task has: `id`, `title`, `createdAt` (`YYYY-MM-DD` string set when the task is created; duplicates and recurring spawns get a fresh one rather than inheriting the original's), `description`, `subtasks` (array of `{id, text, done}`), `priority` (`High`/`Medium`/`Low`), `deadline` (`YYYY-MM-DD` string, compared as plain strings to avoid timezone bugs — never parsed into `Date` for comparisons), `category` (`MSME`/`Credit Card`/`Project`/`Others`), `pic` (requester/owner name), `links` (array of `{id, url}`), `remarks`, `status` (`Active`/`On Hold`/`Not Started`/`Done`), `recurrence` (`None`/`Weekly`/`Monthly`), and `activity` (append-only log of `{ts, text}` entries, capped at 30).

**Loading/normalizing data**: `normalizeTodo()` is the single source of truth for validating and defaulting a task object — it's used both when loading from `localStorage` (`loadTodos()`) and would be used for any future import path. It also migrates older shapes (e.g. a legacy boolean `done` field → `status`, a legacy single `link` string → `links` array). When adding a new task field, update `normalizeTodo()` so old saved data doesn't break.

**Status changes go through `setStatus(todo, newStatus)`**, not direct assignment — it logs the activity entry and, critically, handles recurrence: marking a recurring task `Done` auto-spawns the next occurrence (deadline advanced via `addInterval()`, sub-tasks/links reset, inserted immediately after the original in the array). Any code that changes a task's status (checkbox toggle, the edit modal, bulk-style actions) should call `setStatus()` rather than mutating `todo.status` directly.

**Rendering is a full teardown/rebuild**: `render()` clears `#todo-list` and rebuilds it from `todos` on every state change (filter, search, toggle, edit, etc.) — there's no diffing/virtual DOM. It applies, in order: status filter → due-date filter (`Today`/`Tomorrow`) → category filter → search (`matchesSearch()`, checks title/description/remarks/pic/category/subtask text) → sort (`deadline`, `priority`, or `created`/`createdAt`, with priority as a secondary tiebreaker). `render()` also drives side effects each pass: the overdue/due-today reminder banner, and the PIC `<datalist>` autocomplete options.

**Add/Edit uses one shared `<dialog>` modal** (`#task-modal`) for both flows, toggled by module-level `editingId` (`null` = adding). Sub-tasks and links are edited via working-copy arrays (`modalSubtasks`, `modalLinks`) that are only committed to the real task object on form submit. There's a separate small `<dialog>` for duplicating a task (lets you pick a new deadline before the copy is created).

**Security-relevant conventions** (keep these when editing):
- All user-entered text is rendered via `textContent`, never `innerHTML`. The only `innerHTML` usage is for static, hardcoded SVG icon strings (`ICON_EDIT`, `ICON_DUPLICATE`, etc.) — never interpolate user data into those.
- Links are validated with `isSafeHttpUrl()` (must be `http:`/`https:`) before being rendered as a clickable `<a>`, to avoid `javascript:` URI injection.

**Theming**: CSS custom properties on `:root` and `:root[data-theme="dark"]` in `style.css`; `app.js` toggles the `data-theme` attribute on `<html>` and persists the choice to `localStorage` (key `todo-tracker-theme`), falling back to `prefers-color-scheme` on first load.

**Notifications**: optional browser `Notification` API integration, gated by an explicit opt-in toggle (localStorage key `todo-tracker-notify`) and throttled to once per day (`todo-tracker-last-notified`) — see `maybeSendDailyNotification()`.

**Responsive layout**: single mobile breakpoint at `max-width: 600px` in `style.css`; the add/edit modal goes full-screen below that width.
