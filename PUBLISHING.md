# Publishing Guide

This repository is prepared for Chrome Web Store submission, but final store submission still requires manual work in the Developer Dashboard.

## 1. Create the release ZIP

Run:

```bash
./scripts/build-release.sh
```

The script creates:

- `dist/my-notes-extension-v<version>.zip`

## 2. Chrome Web Store assets prepared in repo

- Extension icons in `icons/`
- Small promotional image in `store-assets/promo-440x280.png`

## 3. Assets you still need to upload manually

The Chrome Web Store also expects screenshots from the real extension UI.

Recommended screenshots:

1. main dashboard view
2. expanded note card view
3. note detail modal
4. compose state

Recommended screenshot size:

- `1280x800` or `640x400`

## 4. Store listing content

Use the drafts in:

- `STORE_LISTING.md`
- `PRIVACY.md`

## 5. Pre-submit checklist

- confirm extension name and description
- confirm publisher email
- upload at least one screenshot
- upload the small promotional image
- verify privacy answers match real behavior
- verify the zip contains `manifest.json` at root
- ensure the version number is higher than the previous published version

## 6. Notes

- The extension does not use a developer backend.
- Sync depends on Chrome's own sync system.
- If you add new permissions later, privacy answers in the store must be updated.
