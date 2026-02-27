# ResumeAI - Dark Aesthetic Resume Analyzer

A futuristic single-page Resume Analyzer with interactive visual effects, ATS scoring, auth demo flows, command palette, magnetic buttons, and dual dark themes.

## Project Structure

```text
.
|- backend/
|  |- index.html                  # main app entry (split from monolithic file)
|  |- resume-ai-v2 (3).html       # original backup file
|  |- assets/
|  |  |- css/styles.css           # all styles
|  |  \- js/app.js               # all JS logic
|  \- proof/                     # image/svg assets used by the UI
|- tmp_frames/
\- index.html                     # root redirect to backend/index.html (GitHub Pages friendly)
```

## Run Locally

From repo root:

```powershell
python -m http.server 5500
```

Then open:

```text
ai-resume-analyzer-nine-beta.vercel.app
```

## Deploy

### GitHub Pages (easy)

1. Push this repository to GitHub.
2. In repository settings, open **Pages**.
3. Set Source to **Deploy from a branch**.
4. Select branch: `main` (or your default), folder: `/ (root)`.
5. Save. The root `index.html` redirects automatically to `backend/index.html`.

### Netlify / Vercel

- Publish directory: repository root (or `backend` if you prefer and set `index.html` as entry).

## Features

- Dual dark themes: `Obsidian` and `Carbon`
- ATS and content scoring simulation
- Animated data visuals and particle background
- Command palette (`Ctrl/Cmd + K`)
- Magnetic button interactions
- Hidden easter egg (`type: resumeai`)
- Demo login/signup flow with localStorage

## Notes

- `backend/resume-ai-v2 (3).html` is kept as original backup.
- Active, modular app files are `backend/index.html`, `backend/assets/css/styles.css`, and `backend/assets/js/app.js`.

## Author

- Name: `shloktripathi`
- GitHub: https://github.com/shloktripathi
- Instagram: https://www.instagram.com/dark.lord6006?igsh=MWthaGwzNTE4YjFiYw==
- Telegram: https://t.me/shloktripathi12
