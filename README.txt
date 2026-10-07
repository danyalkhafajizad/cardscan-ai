CardScan AI v3.2.0
====================
Built from the working v3.1.5 release.

New:
- Scan QR Code button for QR codes visible in the captured business-card photo.
- Reads contact vCard QR, MECARD QR, website QR, and plain-text QR.
- Two phone fields shown by default.
- Each phone can be labeled Mobile, Office, Direct, Main, or Other.
- + Add Phone supports third and additional numbers.
- OCR attempts to capture multiple printed phone numbers and infer their labels.
- Address is separated into Street, City, State/Province, ZIP/Postal Code, and Country.
- iPhone Contacts export carries multiple phone numbers and the structured address.
- Existing v3.1.5 contacts remain readable and migrate into the new structure when edited.
- Existing contact photos, Add Photos, modern UI, OCR, and Enhanced/Dark Card behavior are retained.

QR scanning uses jsQR loaded in the browser. No cloud contact database or API key is added.
