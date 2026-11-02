# LinkedIn posters

Images for announcing crew on LinkedIn, in the "Quiet Terminal" visual system: one cyan accent,
magenta only for owner gates, real terminal output as the hero instead of plain screenshots. All
projects shown (Parcel) are fictional.

| File | Size | Use |
| ---- | ---- | --- |
| `launch.png` | 2160×2700 (1080×1350 at 2x) | Launch post, single image |
| `concept.png` | 2160×2700 | Follow-up post about the review rule and gates |
| `carousel/01.png` … `07.png` | 2160×2700 each | Carousel slides, also usable alone |
| `carousel/crew-carousel.pdf` | 7 pages, 1080×1350 | Upload as a LinkedIn document so it swipes |

Sources are in [`design/posters/`](../../../design/posters/) (HTML and CSS, no build step). They use
the site's own fonts from `site/assets/fonts/`.

```bash
node design/posters/render.mjs            # everything
node design/posters/render.mjs carousel   # one file while iterating
```

It uses the system Chrome (`CHROME_PATH` to override).

## launch.png

**Headline:** Ship like a team of eight.

**Alt text:**
> Poster for crew, an open-source agent team for Claude Code. Headline: "Ship like a team of
> eight." Subhead: "Roles, briefs, independent review and human gates, scaffolded into any repo
> with one command." A tilted terminal shows npx create-crew creating CLAUDE.md, the team and plan
> documents and one agent file per role. In front, a second terminal shows crew doctor passing all
> five checks with a green HEALTHY badge, and a magenta chip reads "G2 Design, waiting for you".
> Footer: Open source, free. mauriciomsouza.github.io/crew. By Mauricio Souza, Design Engineer.

## concept.png

**Headline:** Nobody approves their own work.

**Alt text:**
> Poster for crew. Headline: "Nobody approves their own work." Subhead: "An orchestrator routes
> briefs to seven roles. QA verifies what dev builds. Gates stop for you." A diagram in the shape
> of the crew logo: the orchestrator in the center, connected to seven roles around it: business,
> design, dev, qa, infra, release and marketing. Five roles carry magenta gate markers G1 to G5,
> and a green arrow labeled "verifies" runs from dev to qa. Legend: the diamond stops for the
> owner's approval; PASS or FAIL, with evidence.

## Carousel

**Suggested document title:** crew: an open-source agent team for Claude Code

| Slide | Alt text |
| ----- | -------- |
| 1 | Cover, 1 of 7. Headline: "Your AI agent shouldn't grade its own work." A terminal card lists author: dev, reviewer: dev, verdict: looks good to me, with a red stamp reading "Same agent". "Swipe" cue at the bottom. |
| 2 | 2 of 7, the problem. "One session does everything." Subhead: decisions live in chat history and you end up as the only reviewer. One circle labeled "1 session, 5 jobs" next to a list: scopes the work, designs it, builds it, tests it, and, in red, says it's done. |
| 3 | 3 of 7, how it works. "One command scaffolds the team." Terminal output of npx create-crew for a fictional project, Parcel, creating CLAUDE.md, the team and plan documents, one agent per role and the source-of-truth documents. |
| 4 | 4 of 7, how it works. "Briefs in. Handoffs out." A brief for dev with a goal, acceptance criteria and out-of-scope line, and an arrow to QA's handoff block: verdict PASS, checks run, next step release. |
| 5 | 5 of 7, the design decision. "Gates stop for the human." The team flow as a terminal tree: Owner, then the orchestrator routing to seven roles; business, design, infra, release and marketing carry gates G1 to G5, and qa sends a FAIL back to the author. Subhead ends: "Silence is not approval." |
| 6 | 6 of 7, what makes it different. "crew doctor keeps the team honest." Terminal output where doctor finds a missing agent file and a missing design spec, ending in a red NEEDS WORK badge with 2 passed, 1 warning, 2 errors. Subhead notes that crew is built by its own agent team. |
| 7 | 7 of 7. "Try the live demo." URL: mauriciomsouza.github.io/crew. Notes: the real generator in your browser, break it and watch doctor catch it, MIT license. Command: npx create-crew. A tilted crop of the in-browser demo terminal. Tag: Open source, free. |
