# Privacy Policy

Last updated: 2026-03-30

## Summary

`我的笔记` is a Chrome side panel notes extension. It stores notes locally in the user's Chrome profile using `chrome.storage.sync` so the same signed-in Chrome account can access notes across devices.

The extension does not operate its own backend service and does not send note content to any developer-controlled server.

## What Data Is Processed

The extension processes only the data required for its core feature:

- note content entered by the user
- note metadata such as creation time and update time

## How Data Is Stored

The extension uses:

- `chrome.storage.sync`

This means note data is stored by Chrome as part of the user's browser sync data when Chrome Sync is enabled.

## What Data Is Not Collected

The extension does not:

- sell user data
- transfer note content to a third-party server operated by the developer
- use analytics, ads, or tracking SDKs
- collect browsing history
- read page content from websites

## Permissions Used

### `storage`

Used to save and load notes.

### `sidePanel`

Used to open and display the extension UI inside Chrome's side panel.

## Data Sharing

No note data is shared with the developer or an external backend controlled by the developer.

If Chrome Sync is enabled, Chrome may sync the stored note data across devices under the user's Google account according to Google's own browser sync behavior.

## Data Deletion

Users can delete individual notes or clear all notes from inside the extension.

Users can also remove the extension or clear extension storage through Chrome's extension management tools.

## Contact

Publisher contact email should be filled in on the Chrome Web Store listing before publication.
