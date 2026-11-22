# AI Essentials: Start Smart · C² Instructor Hub (instructor-only)

Static web package. No server code, database, or build step.

## Host it
1. Upload this whole folder as-is to an **HTTPS** site. Keep the folder structure and file names; all paths are relative.
2. **Restrict the entire folder to instructors** (site sign-in or path-level authorization). It holds the full speaker notes, answer slides, and the source PowerPoint. Hidden HTML or separate script files are not access control.
3. Instructors open `index.html` (or `instructor.html` directly). The console opens `display.html` in a second window, which must come from the **same origin** as the console. Don’t host the two pages on different domains or open them with `file://`.

## Server settings
- MIME types: `.webp` → `image/webp`, `.m4a` → `audio/mp4`, `.pptx` → `application/vnd.openxmlformats-officedocument.presentationml.presentation`.
- Slide 19 embeds a YouTube video from `https://www.youtube-nocookie.com`. If you send a Content-Security-Policy, allow it in `frame-src`. Don’t send `Referrer-Policy: no-referrer` (YouTube refuses embeds with no referrer); the default `strict-origin-when-cross-origin` is fine.
- The site must allow pop-ups from itself (instructors approve this in the browser once).

## Link to the participant eWorkbook
The console’s **Participant eWorkbook** button opens `../AI_Essentials_Start_Smart_Participant_eWorkbook/index.html`, which works when both folders sit side by side. If the eWorkbook is hosted somewhere else, change `workbookUrl` near the top of `assets/course/course.js`.

## What’s inside
| Path | Purpose |
|---|---|
| `index.html` | Launch page |
| `instructor.html` | Private instructor console |
| `display.html` | Participant display (loads public slide data only) |
| `assets/course/course.js` | Slide images, titles, timing, media settings |
| `assets/course/course-private.js` | Speaker notes (instructor-only) |
| `assets/engine/` | Shared hub engine (sync, stage, display, console, annotations, My notes) |
| `assets/slides/` | 1920×1080 slide images, one per reveal state |
| `assets/media/` | Slide 21 audio |
| `downloads/` | Setup guide, printable notes, chat text, source PowerPoint |

## Notes
- **My notes** (`assets/engine/my-notes.js`, console only): private per-slide instructor notes, saved in the instructor's browser under its own localStorage key (`<storageKey>_mynotes`). They are not part of the shared state, are never broadcast, and are never loaded by `display.html`. Instructors can print or save them as a PDF, download a CSV, and back up and restore them.
- Sync between the console and display uses BroadcastChannel and localStorage in the instructor’s browser. Nothing is sent to a server, and no participant data is collected.
- Supported browsers: current Microsoft Edge and Google Chrome.
