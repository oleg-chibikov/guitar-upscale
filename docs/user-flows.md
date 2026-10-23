# User flows

Each flow follows one person through one task. The steps name the buttons as the screen shows them. [features.md](features.md) explains each control.

## First visit

The page opens with the fretboard in E natural minor, standard tuning and 120 BPM. Sound loads on the first touch.

```mermaid
sequenceDiagram
  actor P as Person
  participant S as Server
  participant B as Browser
  P->>S: opens the page
  S-->>B: HTML and the paid parts for the tier
  B->>B: restores settings from localStorage
  B->>B: workers build chord shapes
  P->>B: first tap or key press
  B->>B: loads lead, chord and metronome sounds
  P->>B: taps a note
  B-->>P: note sounds, marker lights up
```

1. The fretboard shows the scale notes. The chords fill in a row at a time.
2. The first tap anywhere loads the sounds. It takes a moment on a slow network.
3. From the second tap, notes play straight away.

## Learn a scale

```mermaid
flowchart LR
  A[Open control panel] --> B[Pick style and scale]
  B --> C[Pick tuning and capo]
  C --> D[Fretboard shows the scale]
  D --> E[Press Play]
  E --> F{Playback type}
  F -- Scale --> G[Scale string by string]
  F -- Full string scale --> H[Each string in full]
  F -- Melody --> I[A song in this scale]
```

1. Open the control panel and pick a style, then a scale.
2. Set the tuning and capo. The scale root is the open low string, so these two set the key.
3. Press Play, or Space, to hear the scale.
4. With Explorer, set "Playback type" to Melody in Settings. Play then picks a song written in the scale and sets its tempo.
5. Tap along on the fretboard. Note names or fret numbers come from "Note display mode".

## Strum a chord progression

```mermaid
flowchart TD
  A[Open strumming settings] --> B[Pick or build a pattern]
  B --> C[Hold first chord]
  C --> D[Pattern strums in time]
  D --> E{Next chord pressed?}
  E -- yes, switching on --> F[New chord joins the running pattern]
  E -- yes, switching off --> G[Pattern restarts on the new chord]
  E -- released --> H{Wait for pattern to finish?}
  H -- yes --> I[Pattern plays to its end]
  H -- no --> J[Strumming stops]
  F --> D
  G --> D
```

1. Open strumming settings from the control panel and pick a pattern. The pattern dialog adds and edits custom ones.
2. Set the tempo in the control panel. Turn on the metronome in the play panel to hear the beat.
3. Hold a chord button. The chord sounds at once, and the pattern goes on in time with the clock.
4. Press the next chord while still holding, or right after release.
5. A quick tap plays the chord once and skips the pattern.

## Find a chord or a scale by ear

[Explorer]

```mermaid
flowchart LR
  subgraph Chord
    C1[Press Detect chord] --> C2[Tap 3 or more notes<br/>on different strings]
    C2 --> C3[Message lists chord names]
  end
  subgraph Scale
    S1[Press Detect scale] --> S2[App switches to chromatic]
    S2 --> S3[Tap 5 or more notes]
    S3 --> S4[Dialog suggests scales]
    S4 --> S5[Pick one to switch]
  end
```

1. Press "Detect chord" or "Detect scale" in the control panel. Only one runs at a time.
2. Tap the notes heard in the song. A second tap on a marked note removes it.
3. Read the result, then press the button again to stop.

## Record a melody and download it

[Composer]

```mermaid
sequenceDiagram
  actor P as Person
  participant R as Record button
  participant M as MIDI recorder
  participant PR as Piano roll
  P->>R: press Record
  R->>M: start, clock and metronome on
  P->>M: taps notes, plays chords
  P->>R: press Stop
  M-->>PR: recording becomes the melody
  alt Save MIDI right after recording is on
    M-->>P: .mid file downloads
  else
    P->>P: press Download later for .gp, hold it for .mid
  end
```

1. Turn on "Start metronome when recording" in Settings for a click track.
2. Press Record and play. Notes and chords go to separate tracks.
3. Press Stop. The cross next to it drops the take instead.
4. Press Play to hear the take, or Download to save it as `.gp`. Hold Download for a `.mid` file.

## Build a song with the looper

[Composer]

```mermaid
stateDiagram-v2
  [*] --> Empty
  Empty --> Recording: press record
  Recording --> Looping: press stop
  Looping --> Paused: press pause
  Paused --> Looping: press play
  Looping --> Recording: record again
  Looping --> Empty: Clear
  Paused --> Empty: Clear
```

1. Press record on channel 1 and play a chord part. Press stop. The channel loops at once.
2. Press record on channel 2 and play a melody over the loop. Press stop.
3. Add channels with the plus button, up to 8.
4. Pause and play channels to arrange the parts.
5. Press save to download each channel mixed into one `.mid` file.

A change to scale, tuning or capo clears the looper. Save first.

## Edit notes in the piano roll

```mermaid
flowchart TD
  A[Open piano roll] --> B{Track}
  B -- Melody --> C[Last played, recorded or uploaded melody]
  B -- Loop N --> D[A looper channel]
  B -- empty Melody --> E[Draw from scratch]
  C --> F[Select, draw, erase, move]
  D --> F
  E --> F
  F --> G[Space to listen]
  G --> H{Done?}
  H -- no --> F
  H -- yes --> I[Close, then Download in the play panel]
  F -. song edits .-> J[Saved to the song list after 1 second]
```

1. Open the piano roll from the control panel.
2. Pick the track: the melody or a loop.
3. Edit with the toolbar or the keys in the [root README](../README.md#piano-roll-keys). Double click a chord to change its type.
4. Press Space to play the track. A loop plays in time with the looper.
5. Close the dialog and press Download to save the melody as `.gp`. Hold Download for `.mid`.

Edits to a song save on their own. An uploaded song updates in place. A built-in song gets its own copy under the same name.

## Add your own song

[Composer]

```mermaid
flowchart LR
  A[Press upload] --> B[Pick a .gp, .gp3 to .gp5, .gpx or .mid file]
  B --> C[Scale detected]
  C --> D[Song joins the list under that scale]
  D --> E[Song plays on the fretboard]
  E --> F[Edit in piano roll]
```

1. Wait for the chords to finish loading. The upload button stays disabled until then.
2. Press upload and pick a Guitar Pro or MIDI file. A track named `Chords` plays as chords.
3. Watch the file play on the fretboard, then open the piano roll to edit it.
4. Later, right click or hold Play to pick the song again. The bin icon deletes it.

## Download a song as Guitar Pro

[Explorer]

1. Set the key and tuning in the control panel.
2. Right click or hold Play to open the song list. Type in the search field to find the song.
3. Press the download icon next to a song. The `.gp` file is in the key and tuning from the settings, with saved edits.

## Get a paid tier

Sign-in has to be on for this flow.

```mermaid
flowchart TD
  A[Taps a locked button] --> B[Message names the plan]
  B --> C[Opens sign-in panel]
  C --> D{Where}
  D -- Web --> E[Sign in with Patreon]
  E --> F[Server reads Patreon membership]
  D -- Android app --> G[Buy in Google Play]
  G --> H[App sends purchase to server]
  H --> I[Server checks it with Google<br/>and sets a cookie]
  I --> J[Page reloads]
  F --> K[Paid controls show up]
  J --> K
```

1. A locked button, such as Record, says which plan unlocks it.
2. On the web, sign in with Patreon. A Patreon member of the Explorer or Composer tier gets it on the next page load.
3. In the Android app, pick a plan in the purchase dialog. Google Play takes the payment.
4. The page reloads with the new tier.
5. Change or cancel the Google Play plan from the same panel. A cancelled plan works until its end date.
