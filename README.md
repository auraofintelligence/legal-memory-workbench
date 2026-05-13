# Legal Memory Workbench

Legal Memory Workbench is a public static website for preparing AI-ready markdown files for a personal or project-specific legal information assistant.

It is for legal information preparation only. It does not provide legal advice.

## What It Does

- Helps visitors map life, work, projects, property, community activity and obligations that may touch law.
- Helps visitors list jurisdictions, possible legal sources, risk categories and evidence gaps.
- Generates markdown previews in the browser.
- Lets visitors copy or download local `.md` files for their own workflow.
- References optional partner builders for public profiles, Aura context, noticeboards and grant readiness without merging or uploading visitor data.

## What It Does Not Do

- No chatbot.
- No legal advice.
- No accounts.
- No database.
- No analytics or trackers.
- No external API calls.
- No scraping.
- No upload to GitHub.

The public GitHub repository contains only the site code, blank templates, public examples and licence. Visitor-filled files stay in the visitor's browser until they copy or download them.

## Run Locally

Open `index.html` in a browser, or run a small local server:

```powershell
python -m http.server 4186 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4186/
```

## GitHub Pages

This site is designed to run from the repository root on GitHub Pages with no build step.

## Licence

See `LICENCE.md`.
