# Guitar Upscale - a guitar simulator

A virtual guitar which allows to play notes and chords in a selected scale.

## Main Interface

1. `Subscription (mobile) / Sign in (web)` button - open the subscription view that allows unlocking premium features
1. Main menu
   1. `Settings` button - opens the settings view
   1. `Fullscreen` button - toggles fullscreen mode (on mobile it might show the device buttons)
   1. `Chord detector` (requires `Explorer` plan) - allows detecting chords by pressing notes on several strings one by one or simultaneously
   1. `Play` button - allows to understand how the selected scale sounds like
      Depends on the `Playback type` setting
      Could play the scale or the examples (if available)
   1. `Metronome` button - toggles metronome (volume and tempo can be changed in settings)
   1. `Record` button (requires `Composer` plan) - toggles MIDI recording
      While recording all the notes will be recorded in a live mode
      Once pressed the button transforms into two other buttons - save recording or cancel recording
      When saved the MIDI file with the recorded melody is saved to the standard download location (usually it's Downloads folder)
      The saved filename contains selected scale, tempo and the timestamp.
      Actual recording doesn't start until the first pressed note, so there is no need to play immediately - the recording will be trimmed anyway
   1. `Strumming settings` button - opens the strumming settings view (strumming is activated by pressing the chord without releasing it)
   1. `Scale selector` - allows chosing the scale group and the scale. For example `Far eastern - Chinese Yo`
      Changing scale stops current playback and updates the fretboard and chords
1. `Fretboard` - resembles a guitar (skin can be changed - requires `Composer` plan).
   You can play notes here
   It only shows notes that match the selected scale (hint: for playing any note choose the `Special - Chromatic (all notes)` scale)
   Fret headers are also clickable (pressing a header plays all the notes on this fret available in the current scale)
   You can scroll if some notes are out of screen (or alternatively change the zoom using sliders)
   On mobile you can play notes with one hand while playing chords with the other
1. `Chords view` - allows playing chords
   Tapping on a chord plays it once, long press activates strumming
   By default only basic (`Major` and `Minor`) chords are shown
   Advanced chords like `Esus4` or `B7♯9` require `Explorer` plan
   You can hide the chords for ♯ notes (they are used more rarely) - this would make the other chord buttons bigger which makes playing easier
1. `Zoom sliders` - allow customizing the view to make it more convenient for playing
   If you want to see more notes on the screen - move horizontal slider to the right
   If you want to have more space between the notes vertically and avoid pressing the wrong note - move the vertical slider down
   If you want to see the guitar with the natural aspect ratio - move the horizontal slider to the left and vertical slider up

## Settings view

1. `Show advanced chords` (requires `Explorer` plan) - hides or shows advanced chords in the Chords view (there are a lot of advanced chords so sometimes it's convenient to hide them)
1. `Show chords for ♯ (dièse) notes` - hide or show chords for 'black' notes which are used rarely.
   Disabling it makes the other chord buttons bigger
1. `Alternate chords` - if checked each chord will be played with alterations - bottom to top and then top to bottom (only applicable to single chord taps, strumming has its own alternation patterns)
1. `Start metronome when recording` (requires `Composer` plan) - starts the metronome along with recording
1. `Instrument selectors` (requires `Explorer` plan) - allows configuring how the program sounds.
   The majority of instruments are generic midi instruments
   But some of them are sampled (recorded with the real sounds) (e.g. `Piano - Sampled piano`)
   You can choose two instruments - lead (for notes) and chord (for chords)
   Some examples may specify their own instruments. If not specified, then selected instruments will be used accordingly
1. `Theme` - light/dark/match operation system theme
1. `Tuning` - tunes the strings on the fretboard
   Examples may specify their own tunings, but will be adjusted to the selected one.
   Each tuning specifies a base note (`D`/`E` etc) - if the base note differs from E, the examples will be shifted to the tuning's base note
   The tuning's base note also affects the `Base note/Capo` parameter. For example, if the tuning is `DAFCGC` (with the base note `D`), then capo 2 would mean the note E, while in the standard `EBGDAE` tuning it means `F#`
   Changing tuning stops current playback and updates the fretboard and chords
1. `Base note/Capo` - similar to placing a capo on the corresponding fret.
   The chords remain the same (they are not shifted, the `Am` chord would still be `Am` regardless of the capo position) , but they will be played on different frets with different finger positions
   The examples are shifted. The whole melody will change its tune
   Changing base note stops current playback and updates the fretboard and chords
1. `Note display mode` - how notes look like on the fretboard
   1. `Note` - shows the notes and their octaves. For example, `A5`
   1. `Fret` - shows the fret. It might be easier to see the frets when playing
   1. `Note shift` - shows the difference between the current note and the value of `Base note/capo`. Mostly useful to understand the chord patterns (for example, the Major chord could be built with the notes that has these shifts: `0, 7, 0, 4, 7, 0`)
1. `Chord display mode` - how the UI is arranged
   1. Left - displays `Chords view` and `Subscription` buttons on the left and the rest of controls on the right
      Suitable for playing chords with the left hand and notes with the right hand (on a mobile device)
   1. Right - vice versa
1. `Chord play mode` - each chord can be played differently
   1. `Round Robin` - each time chord plays - it plays the next variation in the same order
   1. `All Variations` - each variation of the chord will be played after a single click with a 1 second interval. Not suitable for playing, only useful for studying chords
   1. `Closest Variation` - the chord will be played the same way every time. It will use the variation which is closest to the neck head
   1. `First Variation` - the chord will be played the same way every time. It will take the chord's base note and find it on the thickest (lowest) string starting from the neck head (left to right)
   1. `Random Variation` - each time chord plays - it plays the next variation in the random order
1. `Skin` (requires `Composer` plan) - the image of the guitar to show
   Just for visual pleasure
   Each skin has slightly different placement of the notes
1. `Playback type`
   1. `Scale` - the whole scale is played without repeating notes (randomly - top to bottom or vice versa)
   1. `FullStringScale` - the whole scale is played on each string one by one (randomly - top to bottom or vice versa)
   1. `Melody` (requires `Explorer` plan)
      If the scale has examples (marked with \*) then the random example is played
      Tempo is set to match it.
      Examples usually involve multiple tracks including but not limited to: chords track, melody track and rhythm track. They typically represent different instrument.
      Playing all of them at once on a real guitar might require mastering the advanced techniques like fingerstyle and arranging the melody properly
      If there are no examples for selected scale - the scale is played the same way as `Scale` mode does
1. `Tempo` - the melody tempo in BPM (beats per minute)
   It affects the metronome, strumming and examples/scale playback
   It can be changed during playback without interrupting it
1. `Chord strumming delay` - how much time in milliseconds should pass between each note of the chord
1. `Notes to play in chord` - how many notes in chords to play
   Depends on the alternation mode - takes the first two notes either from the bottom or from the top of the neck
1. `Playback volume` - how loud is each note
   Is different from system volume
1. `Metronome volume` - how loud is metronome
1. `Reverb strength` (only on desktop, glitchy on mobile) - adds reverb effect to the sound
   ##Strumming panel TODO
   ##Fretboard highlight colors TODO
