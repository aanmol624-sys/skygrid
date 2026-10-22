# UFV SkyGrid — advocacy website (CIS 385)

Static Astro site for GitHub Pages. All wording comes from `content - final.docx`.

## Run it on your laptop
```
npm install        # first time only
npm run dev        # then open http://localhost:4321
```
Stop the server with `Ctrl + C`.

## Where to edit things
| What | File |
|---|---|
| Team skills and initials avatars | `src/data/responsibility.json` (`skills`, `initials`) |
| Hired-employees stakeholder | `src/data/stakeholders.json`, entry `"employees"` |
| Hiring plan | `src/data/hiring.json` |
| Recorded pitch video | `src/lib/site.ts`, set `YOUTUBE_URL` to any normal YouTube link |
| Pitch outline | `src/lib/site.ts`, `PITCH_OUTLINE` |
| Schedule / risks / budget / KPIs / WBS | the matching JSON in `src/data/`. Every chart re-renders from it |

After changing data used by the PDFs, regenerate them: run `npm run dev` in one terminal and `npm run pdfs` in a second.

## Presentation Mode
Press **P** on the home page (or click ▶ Present). Arrows move between chapters, **N** shows speaker notes, **T** pauses the 15:00 timer, **Esc** exits.

## Windows note
Smart App Control blocks Rollup's native ARM64 file, so `package.json` swaps in `@rollup/wasm-node` via `overrides`. Leave that in place.

## Deploy
Push to the `main` branch of a GitHub repo. `.github/workflows/deploy.yml` builds and publishes to GitHub Pages automatically (Settings → Pages → Source: **GitHub Actions**).
