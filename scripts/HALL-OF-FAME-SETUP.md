# Hall of Fame — Google Drive + Apps Script

The game stores leaderboard records in a **private JSON file** on your Google Drive.
A **public Web App** (Apps Script) is the only API the browser uses to read and write that file.

## Architecture

```
Browser (play.html / hall-of-fame.html)
        │  GET ?action=list
        │  GET ?action=submit&name=…&score=…
        ▼
Apps Script Web App (public URL, runs as you)
        │  DriveApp read/write
        ▼
guess-the-note-hall-of-fame.json  (private on your Drive)
```

Players do not need a Google account. You only need one Google account to host the script.

## Setup

1. Open [Google Apps Script](https://script.google.com) → **New project**.
2. Replace the default code with [`hall-of-fame-apps-script.gs`](hall-of-fame-apps-script.gs) from this repo.
3. **Save** the project.
4. (Recommended) **Project settings → Script properties** → add:
   - `SUBMIT_TOKEN` = a long random secret (same value goes in `HALL_OF_FAME_SUBMIT_TOKEN` in `js/constants.js`).
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the **Web app URL** (ends with `/exec`).
7. In `js/constants.js` set:
   - `HALL_OF_FAME_API_URL` = that URL
   - `HALL_OF_FAME_SUBMIT_TOKEN` = your token (or leave `""` if you skipped step 4)

Redeploy the site (GitHub Pages / TV package) after updating `constants.js`.

After any change to `hall-of-fame-apps-script.gs`, create a **new deployment version**
(Deploy → Manage deployments → Edit → New version) so the live Web App picks up the code.

## CORS / JSONP

Google Apps Script Web Apps do **not** send `Access-Control-Allow-Origin`, so browser
`fetch()` from your site (localhost or GitHub Pages) fails with a CORS error.

The game uses **JSONP** instead: requests append `&callback=…` and the script returns
JavaScript (`callback({…})`). Direct browser visits without `callback` still get plain JSON.

## API

### List records

```
GET {WEB_APP_URL}?action=list
```

Response:

```json
{
  "ok": true,
  "highScore": 45230,
  "records": [
    { "name": "Swift Maestro", "score": 45230, "grade": 9, "at": "2026-09-01T12:00:00.000Z" }
  ]
}
```

### Submit a record

Uses **GET** query parameters so the static site works without CORS preflight issues:

```
GET {WEB_APP_URL}?action=submit&name=Player&score=45230&grade=9&token=YOUR_TOKEN
```

Response:

```json
{
  "ok": true,
  "added": true,
  "isNewHigh": true,
  "highScore": 45230,
  "records": [ … ]
}
```

## Local fallback

If `HALL_OF_FAME_API_URL` is empty, the app uses `localStorage` on that device only (useful for offline TV testing).

## Security notes

- The submit token in the client is visible in source code; it only reduces casual spam, not determined abuse.
- Scores are not cryptographically verified. Treat the board as a fun leaderboard, not a competitive esport ranking.
