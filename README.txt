CardScan AI v3.5.0 — OPTIONAL online company research

1. BACK UP from the iPhone Home Screen app before updating.
2. Upload index.html, sw.js, excel-export.js, company-research.js to GitHub Pages.
3. To enable website research, create a free Cloudflare account and deploy cloudflare-worker.js as a Cloudflare Worker.
   In Cloudflare dashboard: Workers & Pages > Create > Worker > Deploy > Edit Code.
   Replace starter code with the complete cloudflare-worker.js content, then Deploy.
   Copy the HTTPS *.workers.dev URL.
4. In CardScan AI open Backup > Online company research setup, paste the Worker URL, Save.
5. Scan or edit a contact, enter/verify website, tap Research Company Website.
6. Review suggested text, edit if needed, tap Add to Notes, then Save Contact.

The worker extracts website descriptions, headings and list text. It is NOT a generative AI service.
Suggestions may be incomplete, inaccurate, or marketing claims. Always verify before saving.
It reads public HTTPS company websites only. It does not send card photos or saved contacts.
Some websites block bots or don't contain enough readable information; in those cases no specialties are returned.
The service URL is stored on your device. The worker is a separately deployed fifth file and does NOT belong in GitHub Pages.
No API key required; Cloudflare may apply free-tier usage limits.
