# Guess the Note

A small web app for practicing music-note reading on a staff. Notes, dyads, or chords appear at random on a treble or bass staff; the player has a limited time to pick the correct answer among five choices. After the session, a grade from 0 to 10 is shown.

## GitHub Pages

The presentation homepage and the game are published from `main`:

- Homepage: https://guessthenote.vige.it/
- Play: https://guessthenote.vige.it/play.html
- GitHub Pages fallback: https://flashboss.github.io/guess_the_note/

Enable **GitHub Pages** on the repository with source **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys the static site on every push to `main`.

## How to play

Open `index.html` for the homepage, or `play.html` for the game (or serve the folder with any static file server).

1. Open settings and choose the clef, exercise type (notes and/or chords), difficulty, how to answer, tempo, and number of rounds.
2. Set **difficulty** from 1 (simplest notes) to 10 (full range, inversions, accidentals, and richer chords). With **Chords** enabled, lower levels use triads only; mid levels add dyads and sevenths; high levels add ninths. Set **time between notes** — a shorter interval is also harder.
3. **Answers:** **Notes** uses the seven natural names (Do–Si, or C–B). **Choices** uses a quiz with 3–7 predefined answers, either **single** (one correct) or **multiple** (select every written pitch). Keys `1`–`7` work as shortcuts.
4. In Choices mode, labels can include sharps and flats. Chord symbols use `-` for minor, `°` for diminished, `+` for augmented, `7` / `Δ` / `ø` for sevenths, and `9` for ninths.
5. The UI is available in English, Italian, Spanish, Portuguese, German, French, Chinese, and Japanese. It follows the browser language and can be changed from the language bar.
6. Correct answers are highlighted on the buttons, then the next challenge is shown. After the session a final grade is shown.

## Note ranges

- Treble clef: C4 (middle C) through A5
- Bass clef: E2 through C4

**Difficulty** 1 stays near the staff, uses root position, and avoids extra accidentals and rarer types. **10** uses the full range, inversions, accidentals, and diminished/augmented/half-diminished spellings. Dyads add a diminished fifth from mid levels and an augmented fifth at the top.

In **Notes** answer mode, written accidentals on the root are not used. In **Choices** mode, sharps and flats can appear depending on difficulty.

## Samsung TV (Tizen)

The same project is a Tizen web app (`config.xml`) that can be sideloaded on a Samsung Smart TV.

### Remote

- Arrows: move between settings, Start/Stop, and answer buttons
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
