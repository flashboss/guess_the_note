# Guess the Note

A small web app for practicing music-note reading on a staff. Notes appear at random on a treble or bass staff; the player has a limited time to name them. After ten notes, the session ends with a grade from 0 to 10.

## GitHub Pages

The presentation homepage and the game are published from `main`:

- Homepage: https://flashboss.github.io/guess_the_note/
- Play: https://flashboss.github.io/guess_the_note/play.html

Enable **GitHub Pages** on the repository with source **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys the static site on every push to `main`.

## How to play

Open `index.html` for the homepage, or `play.html` for the game (or serve the folder with any static file server).

1. Choose the clef: treble, bass, or both at random.
2. Set **time between notes** — a shorter interval is harder.
3. Name the note with the buttons. Keys `1`–`7` work as shortcuts.
4. The UI is available in English, Italian, Spanish, Portuguese, German, French, Chinese, and Japanese. It follows the browser language and can be changed from the language bar.
5. When the time is up, the solution appears at the bottom, then the next note is shown. After ten notes the session ends with a final grade.

## Note ranges

- Treble clef: C4 (middle C) through A5
- Bass clef: E2 through C4

Natural notes only (no accidentals).

## Samsung TV (Tizen)

The same project is a Tizen web app (`config.xml`) that can be sideloaded on a Samsung Smart TV.

### Remote

- Arrows: move between clef, tempo, Start/Stop, and note buttons
- Enter / OK: confirm
- Play/Pause: start or stop the drill
- Back: stop the drill, or exit the app if it is already stopped

### Install

You need [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) with the TV extension and a **Samsung** certificate profile that includes this TV's DUID. This machine already has a `MyHomeGamesTV` profile.

1. On the TV: **Apps** → enter `12345` on the remote → turn **Developer mode** on → set **Host PC IP** to your computer → reboot the TV.
2. From this folder:

```bash
chmod +x scripts/tizen-install.sh
# package only
./scripts/tizen-install.sh

# package and install
TV_IP=192.168.1.50 ./scripts/tizen-install.sh
```

Find the TV IP under **Settings → Network → Network Status**. The signed `.wgt` is written to `.buildResult/`.

You can also import the folder into Tizen Studio (it is already a TV web project) and use Device Manager → **Install app**.

Sideloaded apps stay on the TV until you uninstall them or a firmware update drops the developer certificate. They are not published through the Samsung store.
