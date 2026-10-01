CardScan AI v3.1.1
Built directly from the original v3.1.

Changes are intentionally conservative:
- Same v3.1 Tesseract OCR and image preprocessing.
- Improved name scoring using email first.last clues and proximity to job title.
- Email-derived name fallback only when no credible printed name survives OCR.
- Rejects department labels such as Power & HVAC as company names.
- Small company cleanup for common OCR prefix artifacts.
- Same localStorage key: cardscan_contacts.

Export a Backup before clearing Safari website data.
