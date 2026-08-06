# Game Station

An interactive team game station for a live group activity. The host enters a
team name, runs timed rounds, marks answers, tracks hints, and saves final
scores to a local scoreboard.

## Games Included

- **Zoom & Guess**: teams guess real objects from zoomed-in photos.
- **Bible Story**: teams guess Bible stories from picture and emoji clues.
- **Hymn Guess**: teams guess hymn titles from picture and emoji clues.

Zoom has its own 5-minute timer. Bible Story and Hymn share another 5-minute
timer, so the host can switch between those two categories during the same
round.

## Host Controls

- **Correct**: adds 1 point and reveals the answer.
- **Skip**: moves the question to the back of the queue so it can return later.
- **Wrong**: reveals the answer without adding a point. Use this only when the
  team wants to know the answer.
- **Hints**: counts down oral hints. Zoom has 5 hints. Bible Story and Hymn
  share 5 hints total.

The team can keep guessing as many questions as possible within the time limit.

## Run Locally

Requirements:

- Node.js `>=22.13.0`
- npm

Install dependencies:

```bash
npm install
```

Start the local game:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:3000/
```

If port 3000 is already busy, the app will choose another port such as
`http://localhost:3001/`.

## Run On Another Device

For another phone or laptop on the **same Wi-Fi network**:

1. Start the app with:

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

2. Find the computer's local IP address.

   On macOS:

   ```bash
   ipconfig getifaddr en0
   ```

3. On the other device, open:

   ```text
   http://YOUR_LOCAL_IP:3000/
   ```

   Example:

   ```text
   http://192.168.1.25:3000/
   ```

For a device on **5G or a different network**, use the hosted website version
instead of localhost. Localhost only works on the machine running the app.

## Scoreboard Data

Scores are saved in the browser's local storage.

That means:

- Scores stay on the same browser/device after refresh.
- Scores do not automatically sync across different devices.
- Clearing browser data can erase saved scores.
- The **Clear scoreboard** button removes saved results from that browser.

## Edit Questions

Main game content lives in:

```text
app/page.tsx
```

Question images live in:

```text
public/questions/
```

Zoom image pairs usually follow this pattern:

```text
public/questions/zoom/example-zoom.jpg
public/questions/zoom/example-answer.jpg
```

When adding or removing Zoom questions, update the question list in
`app/page.tsx` and keep the tests in `tests/rendered-html.test.mjs` in sync.

## Verify Before Using

Run:

```bash
npm test
```

This builds the app and checks that the configured question images exist and the
main game behavior is still protected.

## Project Structure

```text
app/
  page.tsx        Main game logic and question data
  globals.css     Main styling
public/questions/ Question image assets
tests/            Render and configuration tests
```

## Notes For Future Setup

- Use the hosted website when players need to access the game from another
  network.
- Use local development when editing questions or testing changes.
- Commit both question data and the image files whenever game content changes.
