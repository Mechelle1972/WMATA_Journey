# M3. Communication Styles and Adaptability · C² Instructor Hub (instructor-only)

Static web package built on the standard C² Instructor Hub engine (v2.2). No server code, database, or build step.

## Host it
1. Upload this whole folder as-is to an **HTTPS** site. Keep the folder structure and file names; all paths are relative.
2. **Restrict the entire folder to instructors** (site sign-in or path-level authorization). It holds the full speaker notes (`assets/course/course-private.js`), answer reveal slides, and the source PowerPoint. Separate script files and hidden HTML are not access control.
3. Instructors open `index.html` (or `instructor.html` directly). The console opens `display.html` in a second window, which must come from the **same origin** as the console. Don't split the pages across domains or open them with `file://`.

## Server settings
- MIME types: `.webp` → `image/webp`, `.mp4` → `video/mp4`, `.pptx` → `application/vnd.openxmlformats-officedocument.presentationml.presentation`.
- The site must allow pop-ups from itself (instructors approve this once in the browser).
- No external requests, fonts, CDNs, or media. No Content-Security-Policy exceptions needed.

## Link to the participant eWorkbook
The console's **Participant eWorkbook** button opens `../M3_Communication_Styles_Participant_eWorkbook/index.html`, which works when both folders sit side by side. If the eWorkbook is hosted elsewhere, change `workbookUrl` near the top of `assets/course/course.js`. Instructors can also paste the eWorkbook and PDF backup links on slide 1 in the console.

## What's inside
| Path | Purpose |
|---|---|
| `index.html` | Launch page, with the instructor walkthrough video |
| `instructor.html` | Private instructor console |
| `display.html` | Participant display (loads public slide data only) |
| `assets/course/course.js` | Slide list, titles, modules, timing, reveal states, timers, eWorkbook parts, running-order alternative |
| `assets/course/course-private.js` | Speaker notes (instructor-only) |
| `assets/engine/`, `assets/hub.css` | Shared C² hub engine and styles (identical across courses) |
| `assets/training/` | Instructor walkthrough video, poster, and transcript (identical across courses) |
| `assets/slides/` | 1920×1080 slide images; `sNN-0.webp` is the before-reveal state |
| `assets/brand/` | Avani Services and C² co-brand logo |
| `downloads/` | Setup guide, printable notes, chat text, backup PowerPoint |

## Notes
- Sync between the console and display uses BroadcastChannel and localStorage in the instructor's browser. Nothing is sent to a server, and no participant data is collected.
- Private instructor notes (**My notes**) stay in the instructor's browser and are never sent to the display.
- Supported browsers: current Microsoft Edge and Google Chrome.
