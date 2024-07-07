More chords
Ads
more examples
7,8 string guitars
Feedback form
get the formula to avoid hardcoding each string height offset
youtube videos for each scale
High string at the bottom mode
Slash chords? when the main bass note is out of the chord
WaitForNextHalfBeat could make the melody offbeat - we need to store what tick to wait for

info about chord detection
https://www.oolimo.com/en/guitar-chords/analyze
or https://jguitar.com/chordname

piano roll editor for looper/recording

Can we avoid using pre-built chords for chord detection?

Piano roll:
Undo-redo (use event sourcing technique)
copy note instead of move when ctrl pressed (what about mobile?)
apply to looper and to recording, not only to midi upload
For looper we'll need another dialog showing all the tracks. Alternatively we can have buttons under the play buttons
For recording we'll need to have the ability to replay the recording first
Draggging over the X-axis should change current playback position. Should we adjust globalCurrentTick? Note that when we go forwards/backwards we don't do that - probably we should!

Replay button and set pianoRoll data after recording
MIDI save button - for pianoRoll data whatever it is
for chords - see what chords available for the new note. Prefer the same Mode, but if no - use the first available
// Cannot change notes in the example - why?
