# chrome-ext

> A polished Chrome Manifest V3 side panel notes extension focused on `chrome.storage.sync`.

[![Platform](https://img.shields.io/badge/platform-Chrome-blue)](https://www.google.com/chrome/)
[![Manifest](https://img.shields.io/badge/manifest-v3-1f6feb)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Storage](https://img.shields.io/badge/storage-chrome.storage.sync-b08968)](https://developer.chrome.com/docs/extensions/reference/api/storage)

`chrome-ext` is a lightweight notes extension built around the Chrome Side Panel API. The current product direction is deliberately narrow: quick note capture, clean reading and editing, and automatic sync through the user's signed-in Chrome profile. There is no custom account system, no remote sync server, and no login flow.

## Product Direction

This repository now targets one clear use case:

- open a persistent side panel from the browser toolbar
- write short notes quickly
- edit and delete existing notes
- export notes as plain text
- rely on Chrome Sync for same-account multi-device sync

That choice keeps the project small, maintainable, and practical for personal productivity.

## Key Features

- Side panel note workflow built for Chrome Manifest V3
- Local-first storage using `chrome.storage.sync`
- Automatic cross-device sync for the same Chrome account
- Search/filter across saved notes
- Modal-based note viewing and editing
- URL detection with clickable links
- Keyboard shortcuts for fast capture
- Refined card-based UI inspired by DaisyUI-style surfaces and controls

## How Sync Works

The extension stores notes in `chrome.storage.sync`.

That means notes can sync across devices when all of the following are true:

1. the user is signed in to Chrome
2. Chrome Sync is enabled
3. the extension is installed under the same Chrome profile

This project does not ship its own authentication or cloud backend. Sync is delegated to Chrome's built-in account sync system.

## Limits and Tradeoffs

`chrome.storage.sync` is convenient, but it is not an unlimited database.

- best for lightweight text notes
- not suitable for large attachments or very large datasets
- sync timing is managed by Chrome, not by this extension

If the product later needs full-text archives, attachments, web access, or account-level collaboration, that would require a separate backend architecture.

## Tech Stack

- Chrome Extensions Manifest V3
- Side Panel API
- `chrome.storage.sync`
- Vanilla HTML, CSS, and JavaScript

## Project Structure

```text
chrome-ext/
├── dist/
├── icons/
├── manifest.json
├── background.js
├── PRIVACY.md
├── PUBLISHING.md
├── sidepanel.html
├── sidepanel.css
├── sidepanel.js
├── STORE_LISTING.md
├── store-assets/
├── scripts/
└── README.md
```

## Getting Started

### Load the extension in Chrome

1. Open `chrome://extensions/`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `/Users/xieyuqiyu/Documents/xieyuqiyu/chrome-ext`
5. Click the extension action button to open the side panel

## User Flow

1. Open the side panel from the extension action
2. Click `新建笔记`
3. Write content and save with `Ctrl + Enter`
4. Browse notes as cards in reverse update order
5. Open a note to read, edit, or delete it
6. Use search to filter notes instantly
7. Export all notes to the clipboard when needed

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: open the composer
- `Ctrl/Cmd + Enter`: save a new note or save edits
- `Esc`: close the composer or modal

## Data Model

Notes are stored as lightweight objects:

```json
{
  "id": "lx8k9v-abc123",
  "content": "note body",
  "createdAt": 1710000000000,
  "updatedAt": 1710001000000
}
```

Older note data using `timestamp` or `lastModified` is normalized in the UI layer for backward compatibility.

## Recent Cleanup

The project was simplified to reduce maintenance overhead:

- removed the custom server-based sync direction
- removed login and cloud-sync UI
- removed demo popup tooling and placeholder extension scripts
- reduced permissions to the minimum needed for side panel notes
- rewrote the side panel UI and state handling to remove redundant logic

## Development Notes

- The extension is intentionally kept framework-free.
- Styles live in `sidepanel.css` to avoid the previous monolithic inline CSS block.
- UI behavior is centralized in `sidepanel.js`.
- `chrome.storage.onChanged` is used so the panel can react when sync storage changes.

## Known Gaps

- There is no automated test suite yet.
- Search is simple substring matching.
- Storage quota limits still apply because the project uses `chrome.storage.sync`.
- There is no import flow yet, only export to clipboard.

## Suggested Next Steps

- add note pinning or tags
- add import-from-text or JSON
- add lightweight storage quota warnings
- add packaging and release documentation for Chrome distribution

## Release Prep

This repository now includes basic Chrome Web Store preparation assets:

- `PRIVACY.md` for privacy disclosure drafting
- `STORE_LISTING.md` for listing copy
- `PUBLISHING.md` for release steps
- `icons/` for extension icons
- `store-assets/promo-440x280.png` for the small promotional image
- `scripts/build-release.sh` to generate the release zip

Build the release package with:

```bash
./scripts/build-release.sh
```

## Stable Extension ID

This project now includes a fixed manifest `key` so unpacked development builds keep a stable Chrome extension ID.

- fixed development ID: `lmkjmpeimhepflgghhhepcnpjlgegikj`

If you reload the unpacked extension from the same project, Chrome should keep using that ID instead of generating a new one.

## License

No root `LICENSE` file is included yet. Add one before public distribution.
