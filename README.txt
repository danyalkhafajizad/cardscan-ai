CardScan AI v2 — iPhone PWA

WHAT'S NEW IN V2
- Take a business-card photo from iPhone Safari.
- Tap Recognize Card to run OCR in the browser using Tesseract.js.
- Automatically attempts to populate name, company, title, email, phone, website, and address.
- Always review extracted fields before saving; business-card layouts vary.
- Saved contacts, notes, tags, card images, and backups remain in Safari local storage.
- Search contacts and export them as vCards.

IMPORTANT
- The PWA must be hosted over HTTPS for normal Home Screen/service-worker behavior.
- The first OCR use requires internet access to download the Tesseract.js browser OCR components/language data. Those resources may then be browser-cached.
- OCR recognition happens in the browser. The app itself does not upload the business-card image to a CardScan AI server because this build has no backend.
- Clearing Safari website data can erase local contacts. Use Export Backup regularly.
- This is heuristic contact-field parsing, so always verify the populated fields.

INSTALL AFTER HOSTING
1. Open the HTTPS CardScan AI URL in Safari on iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Tap Add.
